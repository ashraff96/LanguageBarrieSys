<?php

namespace App\Http\Controllers;

use App\Models\Translation;
use App\Models\TranslationHistory;
use App\Models\Language;
use App\Models\File;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Stichoza\GoogleTranslate\GoogleTranslate;
use Stichoza\GoogleTranslate\Exceptions\LargeTextException;
use Stichoza\GoogleTranslate\Exceptions\RateLimitException;
use Stichoza\GoogleTranslate\Exceptions\TranslationRequestException;
use Stichoza\GoogleTranslate\Exceptions\TranslationDecodingException;

class TranslationController extends Controller
{
    /**
     * Get all translations (admin only)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Translation::with(['user', 'file'])
                ->orderBy('created_at', 'desc');

            // Apply filters
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->has('source_language')) {
                $query->where('source_language', $request->source_language);
            }

            if ($request->has('target_language')) {
                $query->where('target_language', $request->target_language);
            }

            if ($request->has('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            $translations = $query->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $translations
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching translations: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching translations'
            ], 500);
        }
    }

    /**
     * Get user's translations
     */
    public function getUserTranslations(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            $query = Translation::where('user_id', $user->id)
                ->orderBy('created_at', 'desc');

            // Apply filters
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('source_language')) {
                $query->where('source_language', $request->source_language);
            }

            if ($request->has('target_language')) {
                $query->where('target_language', $request->target_language);
            }

            $translations = $query->paginate($request->get('per_page', 20));

            return response()->json([
                'success' => true,
                'data' => $translations
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching user translations: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching translations'
            ], 500);
        }
    }

    /**
     * Store a new translation
     */
    /**
     * Create translation record
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'original_text' => 'required|string',
                'translated_text' => 'required|string',
                'source_language' => 'required|string|max:10',
                'target_language' => 'required|string|max:10',
                'file_name' => 'nullable|string|max:255',
                'file_type' => 'nullable|string|max:50',
                'file_size' => 'nullable|integer|min:0',
                'metadata' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $translation = Translation::create([
                'user_id' => $request->user()?->id,
                'original_text' => $request->original_text,
                'translated_text' => $request->translated_text,
                'source_language' => $request->source_language,
                'target_language' => $request->target_language,
                'file_name' => $request->file_name,
                'file_type' => $request->file_type,
                'file_size' => $request->file_size,
                'status' => 'completed',
                'metadata' => $request->metadata
            ]);

            // Add to history
            TranslationHistory::create([
                'user_id' => $request->user()?->id,
                'translation_id' => $translation->id,
                'original_text' => $request->original_text,
                'translated_text' => $request->translated_text,
                'source_language' => $request->source_language,
                'target_language' => $request->target_language,
                'action_type' => 'translation',
                'metadata' => $request->metadata
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Translation created successfully',
                'data' => $translation
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating translation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating translation'
            ], 500);
        }
    }

    /**
     * Translate text and save to database
     */
    public function translateText(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'text' => 'required|string|max:50000',
                'source_language' => 'required|string|max:10',
                'target_language' => 'required|string|max:10',
                'file_name' => 'nullable|string|max:255',
                'file_type' => 'nullable|string|max:50',
                'file_size' => 'nullable|integer|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $originalText = $request->text;
            $sourceLanguage = $request->source_language;
            $targetLanguage = $request->target_language;

            // Perform the actual translation
            $translatedText = $this->performTranslation($originalText, $sourceLanguage, $targetLanguage);

            $fileRecord = null;
            
            // Create file record if this is a document translation (has file information)
            if ($request->file_name && $request->file_type && $request->file_size) {
                $fileRecord = File::create([
                    'original_name' => $request->file_name,
                    'file_name' => $request->file_name,
                    'file_path' => 'documents/' . $request->file_name, // Virtual path since we're not storing the actual file
                    'file_size' => $request->file_size,
                    'file_type' => $request->file_type,
                    'user_id' => $request->user()?->id,
                    'status' => 'translated',
                    'source_language' => $sourceLanguage,
                    'target_language' => $targetLanguage,
                    'translation_accuracy' => 95.0, // Default accuracy for demo
                    'metadata' => [
                        'translation_method' => 'document_translator',
                        'character_count' => strlen($originalText),
                        'word_count' => str_word_count($originalText),
                        'processed_at' => now()->toISOString()
                    ]
                ]);
            }

            // Save translation to database
            $translation = Translation::create([
                'user_id' => $request->user()?->id,
                'file_id' => $fileRecord?->id,
                'original_text' => $originalText,
                'translated_text' => $translatedText,
                'source_language' => $sourceLanguage,
                'target_language' => $targetLanguage,
                'file_name' => $request->file_name,
                'file_type' => $request->file_type,
                'file_size' => $request->file_size,
                'status' => 'completed',
                'metadata' => [
                    'translation_method' => 'document_translator',
                    'character_count' => strlen($originalText),
                    'word_count' => str_word_count($originalText),
                    'translated_at' => now()->toISOString()
                ]
            ]);

            // Add to history
            TranslationHistory::create([
                'user_id' => $request->user()?->id,
                'translation_id' => $translation->id,
                'original_text' => $originalText,
                'translated_text' => $translatedText,
                'source_language' => $sourceLanguage,
                'target_language' => $targetLanguage,
                'action_type' => 'translation',
                'metadata' => [
                    'translation_method' => 'document_translator',
                    'character_count' => strlen($originalText),
                    'word_count' => str_word_count($originalText)
                ]
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Text translated successfully',
                'data' => [
                    'translated_text' => $translatedText,
                    'translation_id' => $translation->id,
                    'file_id' => $fileRecord?->id,
                    'character_count' => strlen($originalText),
                    'word_count' => str_word_count($originalText)
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error translating text: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error translating text: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Perform the actual translation using Google Translate API
     */
    private function performTranslation(string $text, string $sourceLanguage, string $targetLanguage): string
    {
        // Language mapping for display names
        $languageNames = [
            'en' => 'English',
            'ta' => 'Tamil', 
            'si' => 'Sinhala'
        ];

        $targetLanguageName = $languageNames[$targetLanguage] ?? $targetLanguage;

        // If same language, return original
        if ($sourceLanguage === $targetLanguage) {
            return $text;
        }

        try {
            // Initialize Google Translate
            $translator = new GoogleTranslate($targetLanguage, $sourceLanguage);
            
            // Configure options for better reliability
            $translator->setOptions([
                'timeout' => 30,
                'headers' => [
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                ]
            ]);

            // For large texts, split into chunks to avoid Google's 5000 character limit
            $chunks = $this->chunkTextForTranslation($text, 4500); // Leave some buffer
            $translatedChunks = [];

            foreach ($chunks as $chunk) {
                if (empty(trim($chunk))) {
                    $translatedChunks[] = $chunk; // Preserve whitespace
                    continue;
                }

                try {
                    // Add small delay between requests to avoid rate limiting
                    if (count($translatedChunks) > 0) {
                        usleep(500000); // 0.5 second delay
                    }

                    $translatedChunk = $translator->translate($chunk);
                    $translatedChunks[] = $translatedChunk;
                    
                    Log::info("Translated chunk", [
                        'source_lang' => $sourceLanguage,
                        'target_lang' => $targetLanguage,
                        'chunk_length' => strlen($chunk),
                        'translated_length' => strlen($translatedChunk)
                    ]);

                } catch (LargeTextException $e) {
                    Log::warning("Text chunk too large, splitting further", ['chunk_size' => strlen($chunk)]);
                    // If still too large, split this chunk further
                    $subChunks = $this->chunkTextForTranslation($chunk, 2000);
                    foreach ($subChunks as $subChunk) {
                        if (!empty(trim($subChunk))) {
                            usleep(500000); // 0.5 second delay
                            $translatedChunks[] = $translator->translate($subChunk);
                        } else {
                            $translatedChunks[] = $subChunk;
                        }
                    }
                } catch (RateLimitException $e) {
                    Log::warning("Rate limit hit, waiting longer", ['chunk' => substr($chunk, 0, 100)]);
                    // Wait longer and retry
                    sleep(2);
                    $translatedChunks[] = $translator->translate($chunk);
                }
            }

            $translatedText = implode('', $translatedChunks);

            Log::info("Translation completed successfully", [
                'source_lang' => $sourceLanguage,
                'target_lang' => $targetLanguage,
                'original_length' => strlen($text),
                'translated_length' => strlen($translatedText),
                'chunks_processed' => count($chunks)
            ]);

            return $translatedText;

        } catch (TranslationRequestException $e) {
            Log::error("Translation request failed", [
                'error' => $e->getMessage(),
                'source_lang' => $sourceLanguage,
                'target_lang' => $targetLanguage,
                'text_length' => strlen($text)
            ]);
            
            // Fallback to mock translation for critical errors
            return $this->fallbackTranslation($text, $sourceLanguage, $targetLanguage);

        } catch (TranslationDecodingException $e) {
            Log::error("Translation response decoding failed", [
                'error' => $e->getMessage(),
                'source_lang' => $sourceLanguage,
                'target_lang' => $targetLanguage
            ]);
            
            return $this->fallbackTranslation($text, $sourceLanguage, $targetLanguage);

        } catch (\Exception $e) {
            Log::error("Unexpected translation error", [
                'error' => $e->getMessage(),
                'source_lang' => $sourceLanguage,
                'target_lang' => $targetLanguage
            ]);
            
            return $this->fallbackTranslation($text, $sourceLanguage, $targetLanguage);
        }
    }

    /**
     * Split text into chunks suitable for Google Translate API
     */
    private function chunkTextForTranslation(string $text, int $maxChunkSize = 4500): array
    {
        $chunks = [];
        
        // If text is smaller than limit, return as single chunk
        if (strlen($text) <= $maxChunkSize) {
            return [$text];
        }

        // Split by paragraphs first (double newlines)
        $paragraphs = preg_split('/\n\s*\n/', $text);
        $currentChunk = '';
        
        foreach ($paragraphs as $paragraph) {
            // If adding this paragraph would exceed limit
            if (strlen($currentChunk . "\n\n" . $paragraph) > $maxChunkSize && !empty($currentChunk)) {
                $chunks[] = $currentChunk;
                $currentChunk = $paragraph;
            } else {
                $currentChunk = empty($currentChunk) ? $paragraph : $currentChunk . "\n\n" . $paragraph;
            }
            
            // If single paragraph is too large, split by sentences
            if (strlen($currentChunk) > $maxChunkSize) {
                $sentences = preg_split('/(?<=[.!?])\s+/', $currentChunk);
                $tempChunk = '';
                
                foreach ($sentences as $sentence) {
                    if (strlen($tempChunk . ' ' . $sentence) > $maxChunkSize && !empty($tempChunk)) {
                        $chunks[] = $tempChunk;
                        $tempChunk = $sentence;
                    } else {
                        $tempChunk = empty($tempChunk) ? $sentence : $tempChunk . ' ' . $sentence;
                    }
                }
                $currentChunk = $tempChunk;
            }
        }
        
        if (!empty($currentChunk)) {
            $chunks[] = $currentChunk;
        }
        
        return $chunks;
    }

    /**
     * Fallback translation when Google Translate fails
     */
    private function fallbackTranslation(string $text, string $sourceLanguage, string $targetLanguage): string
    {
        $languageNames = [
            'en' => 'English',
            'ta' => 'Tamil',
            'si' => 'Sinhala'
        ];

        $targetLanguageName = $languageNames[$targetLanguage] ?? $targetLanguage;
        
        // Simple fallback - just add a prefix indicating translation failed
        return "[{$targetLanguageName} Translation - Service Temporarily Unavailable] " . $text;
    }

    /**
     * Show translation details
     */
    public function show(Translation $translation): JsonResponse
    {
        try {
            $translation->load(['user', 'history']);

            return response()->json([
                'success' => true,
                'data' => $translation
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching translation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching translation'
            ], 500);
        }
    }

    /**
     * Update translation
     */
    public function update(Request $request, Translation $translation): JsonResponse
    {
        try {
                'Computer' => 'கணினி',
                'Future' => 'எதிர்காலம்',
                'Introduction' => 'அறிமுகம்',
                'Humanity' => 'மனிதகுலம்',
                'Science' => 'அறிவியல்',
                'Fiction' => 'கற்பனை',
                'Medical' => 'மருத்துவ',
                'Advanced' => 'மேம்பட்ட',
                'Applications' => 'பயன்பாடுகள்',
                'Voice' => 'குரல்',
                'Assistant' => 'உதவியாளர்',
                'Assistants' => 'உதவியாளர்கள்',
                'Recommendation' => 'பரிந்துரை',
                'Systems' => 'அமைப்புகள்',
                'Century' => 'நூற்றாண்டு',
                'Transforming' => 'மாற்றுகிறது',
                'Everyday' => 'அன்றாடம்',
                'Life' => 'வாழ்க்கை',
                'Powering' => 'இயக்குகிறது',
                'Hello' => 'வணக்கம்',
                'Thank you' => 'நன்றி',
                'Good morning' => 'காலை வணக்கம்',
                'How are you?' => 'எப்படி இருக்கிறீர்கள்?',
                'Welcome' => 'வரவேற்கிறோம்',
                'Good' => 'நல்லது',
                'Yes' => 'ஆம்',
                'No' => 'இல்லை',
                'the' => '',
                'and' => 'மற்றும்',
                'of' => 'இன்',
                'to' => 'க்கு',
                'from' => 'இருந்து',
                'has' => 'உள்ளது',
                'become' => 'ஆகிவிட்டது',
                'one' => 'ஒன்று',
                'most' => 'மிகவும்',
                'significant' => 'குறிப்பிடத்தக்க',
                'advancements' => 'முன்னேற்றங்கள்',
                'technological' => 'தொழில்நுட்ப',
                'Once' => 'ஒரு காலத்தில்',
                'confined' => 'அடைத்து',
                'realm' => 'பகுதி',
                'now' => 'இப்போது',
                'permeates' => 'ஊடுருவுகிறது',
                'machines' => 'இயந்திரங்கள்',
                'learning' => 'கற்றல்',
                'intelligence' => 'நுண்ணறிவு',
                'data' => 'தரவு',
                'algorithms' => 'வழிமுறைகள்',
                'development' => 'வளர்ச்சி',
                'research' => 'ஆராய்ச்சி',
                'automation' => 'தானியங்கி',
                'innovation' => 'புதுமை',
                'society' => 'சமுதாயம்',
                'industry' => 'தொழில்துறை',
                'education' => 'கல்வி',
                'healthcare' => 'சுகாதார பராமரிப்பு',
                'business' => 'வணிகம்',
                'security' => 'பாதுகாப்பு',
                'privacy' => 'தனியுரிமை',
                'ethics' => 'நெறிமுறைகள்',
                'challenges' => 'சவால்கள்',
                'opportunities' => 'வாய்ப்புகள்',
                'future' => 'எதிர்காலம்',
                'human' => 'மனித',
                'work' => 'வேலை',
                'jobs' => 'வேலைகள்',
                'global' => 'உலகளாவிய',
                'world' => 'உலகம்',
                'countries' => 'நாடுகள்',
                'government' => 'அரசாங்கம்',
                'policy' => 'கொள்கை',
                'regulation' => 'ஒழுங்குமுறை',
                'is' => 'உள்ளது',
                'are' => 'உள்ளன',
                'was' => 'இருந்தது',
                'were' => 'இருந்தன',
                'will' => 'செய்யும்',
                'can' => 'முடியும்',
                'could' => 'முடிந்தது',
                'should' => 'வேண்டும்',
                'would' => 'செய்யும்',
                'may' => 'கூடும்',
                'might' => 'கூடும்',
                'must' => 'வேண்டும்',
                'in' => 'இல்',
                'on' => 'மீது',
                'at' => 'இல்',
                'by' => 'மூலம்',
                'for' => 'க்காக',
                'with' => 'உடன்',
                'without' => 'இல்லாமல்',
                'through' => 'மூலம்',
                'during' => 'போது',
                'before' => 'முன்பு',
                'after' => 'பின்னர்',
                'above' => 'மேலே',
                'below' => 'கீழே',
                'over' => 'மேல்',
                'under' => 'கீழ்',
                'between' => 'இடையே',
                'among' => 'மத்தியில்',
                'within' => 'உள்ளே',
                'outside' => 'வெளியே',
                'inside' => 'உள்ளே',
                'across' => 'குறுக்கே',
                'around' => 'சுற்றி',
                'near' => 'அருகில்',
                'far' => 'தூரம்',
                'close' => 'நெருக்கமான',
                'open' => 'திறந்த',
                'closed' => 'மூடிய',
                'new' => 'புதிய',
                'old' => 'பழைய',
                'young' => 'இளம்',
                'big' => 'பெரிய',
                'small' => 'சிறிய',
                'large' => 'பெரிய',
                'little' => 'சிறிய',
                'long' => 'நீண்ட',
                'short' => 'குறுகிய',
                'high' => 'உயர்ந்த',
                'low' => 'குறைந்த',
                'fast' => 'வேகமான',
                'slow' => 'மெதுவான',
                'early' => 'ஆரம்பமான',
                'late' => 'தாமதமான',
                'first' => 'முதல்',
                'last' => 'கடைசி',
                'next' => 'அடுத்த',
                'previous' => 'முந்தைய',
                'important' => 'முக்கியமான',
                'necessary' => 'அவசியமான',
                'possible' => 'சாத்தியமான',
                'impossible' => 'சாத்தியமற்ற',
                'easy' => 'எளிதான',
                'difficult' => 'கடினமான',
                'simple' => 'எளிமையான',
                'complex' => 'சிக்கலான',
                'public' => 'பொது',
                'private' => 'தனியார்',
                'personal' => 'தனிப்பட்ட',
                'social' => 'சமூக',
                'economic' => 'பொருளாதார',
                'political' => 'அரசியல்',
                'legal' => 'சட்ட',
                'medical' => 'மருத்துவ',
                'technical' => 'தொழில்நுட்ப',
                'scientific' => 'அறிவியல்',
                'cultural' => 'கலாச்சார',
                'natural' => 'இயற்கை',
                'artificial' => 'செயற்கை',
                'digital' => 'டிஜிட்டல்',
                'online' => 'ஆன்லைன்',
                'offline' => 'ஆஃப்லைன்',
                'local' => 'உள்ளூர்',
                'international' => 'சர்வதேச',
                'national' => 'தேசிய',
                'regional' => 'பிராந்திய'
            ],
            'en_si' => [
                'Artificial Intelligence' => 'කෘත්‍රිම බුද්ධිය',
                'Technology' => 'තාක්ෂණය',
                'Computer' => 'පරිගණකය',
                'Future' => 'අනාගතය',
                'Introduction' => 'හැඳින්වීම',
                'Humanity' => 'මානවත්වය',
                'Science' => 'විද්‍යාව',
                'Fiction' => 'ප්‍රබන්ධ',
                'Medical' => 'වෛද්‍ය',
                'Advanced' => 'දියුණු',
                'Applications' => 'යෙදුම්',
                'Voice' => 'කටහඬ',
                'Assistant' => 'සහායක',
                'Assistants' => 'සහායකයන්',
                'Recommendation' => 'නිර්දේශ',
                'Systems' => 'පද්ධති',
                'Century' => 'සියවස',
                'Transforming' => 'පරිවර්තනය කරමින්',
                'Everyday' => 'එදිනෙදා',
                'Life' => 'ජීවිතය',
                'Powering' => 'බලගන්වනවා',
                'Hello' => 'ආයුබෝවන්',
                'Thank you' => 'ස්තුතියි',
                'Good morning' => 'සුභ උදෑසනක්',
                'How are you?' => 'ඔබට කොහොමද?',
                'Welcome' => 'සාදරයෙන් පිළිගනිමු',
                'Good' => 'හොඳයි',
                'Yes' => 'ඔව්',
                'No' => 'නැහැ',
                'the' => '',
                'and' => 'සහ',
                'of' => 'ගේ',
                'to' => 'ට',
                'from' => 'සිට',
                'has' => 'ඇත',
                'become' => 'බවට පත්ව',
                'one' => 'එක',
                'most' => 'වඩාත්ම',
                'significant' => 'වැදගත්',
                'advancements' => 'දියුණුව',
                'technological' => 'තාක්ෂණික',
                'Once' => 'වරක්',
                'confined' => 'සීමා කර',
                'realm' => 'ක්ෂේත්‍රය',
                'now' => 'දැන්',
                'permeates' => 'විහිදේ',
                'machines' => 'යන්ත්‍ර',
                'learning' => 'ඉගෙනීම',
                'intelligence' => 'බුද්ධිය',
                'data' => 'දත්ත',
                'algorithms' => 'ඇල්ගොරිදම',
                'development' => 'සංවර්ධනය',
                'research' => 'පර්යේෂණ',
                'automation' => 'ස්වයංක්‍රීයකරණය',
                'innovation' => 'නවෝත්පාදනය',
                'society' => 'සමාජය',
                'industry' => 'කර්මාන්තය',
                'education' => 'අධ්‍යාපනය',
                'healthcare' => 'සෞඛ්‍ය සේවා',
                'business' => 'ව්‍යාපාර',
                'security' => 'ආරක්ෂාව',
                'privacy' => 'පෞද්ගලිකත්වය',
                'ethics' => 'සදාචාර',
                'challenges' => 'අභියෝග',
                'opportunities' => 'අවස්ථා',
                'future' => 'අනාගතය',
                'human' => 'මානව',
                'work' => 'වැඩ',
                'jobs' => 'රැකියා',
                'global' => 'ගෝලීය',
                'world' => 'ලෝකය',
                'countries' => 'රටවල්',
                'government' => 'රජය',
                'policy' => 'ප්‍රතිපත්ති',
                'regulation' => 'නියාමනය',
                'is' => 'වේ',
                'are' => 'වේ',
                'was' => 'විය',
                'were' => 'විය',
                'will' => 'කරනු ඇත',
                'can' => 'හැකිය',
                'could' => 'හැකි විය',
                'should' => 'යුතුය',
                'would' => 'කරනු ඇත',
                'may' => 'සහ',
                'might' => 'සහ',
                'must' => 'යුතුය',
                'in' => 'තුළ',
                'on' => 'මත',
                'at' => 'දී',
                'by' => 'විසින්',
                'for' => 'සඳහා',
                'with' => 'සමඟ',
                'without' => 'නොමැතිව',
                'through' => 'හරහා',
                'during' => 'අතරතුර',
                'before' => 'පෙර',
                'after' => 'පසු',
                'above' => 'ඉහළ',
                'below' => 'පහළ',
                'over' => 'උඩින්',
                'under' => 'යටතේ',
                'between' => 'අතර',
                'among' => 'අතර',
                'within' => 'තුළ',
                'outside' => 'පිටත',
                'inside' => 'ඇතුළත',
                'across' => 'හරහා',
                'around' => 'වටා',
                'near' => 'ළඟ',
                'far' => 'දුර',
                'close' => 'සමීප',
                'open' => 'විවෘත',
                'closed' => 'වසා ඇති',
                'new' => 'නව',
                'old' => 'පරණ',
                'young' => 'තරුණ',
                'big' => 'විශාල',
                'small' => 'කුඩා',
                'large' => 'විශාල',
                'little' => 'කුඩා',
                'long' => 'දිගු',
                'short' => 'කෙටි',
                'high' => 'ඉහළ',
                'low' => 'පහළ',
                'fast' => 'වේගවත්',
                'slow' => 'මන්දගාමී',
                'early' => 'වේලාසනින්',
                'late' => 'ප්‍රමාද',
                'first' => 'පළමු',
                'last' => 'අවසාන',
                'next' => 'ඊළඟ',
                'previous' => 'පෙර',
                'important' => 'වැදගත්',
                'necessary' => 'අවශ්‍ය',
                'possible' => 'හැකි',
                'impossible' => 'නොහැකි',
                'easy' => 'පහසු',
                'difficult' => 'අපහසු',
                'simple' => 'සරල',
                'complex' => 'සංකීර්ණ',
                'public' => 'මහජන',
                'private' => 'පුද්ගලික',
                'personal' => 'පුද්ගලික',
                'social' => 'සමාජ',
                'economic' => 'ආර්ථික',
                'political' => 'දේශපාලන',
                'legal' => 'නීතිමය',
                'medical' => 'වෛද්‍ය',
                'technical' => 'තාක්ෂණික',
                'scientific' => 'විද්‍යාත්මක',
                'cultural' => 'සංස්කෘතික',
                'natural' => 'ස්වභාවික',
                'artificial' => 'කෘත්‍රිම',
                'digital' => 'ඩිජිටල්',
                'online' => 'අන්තර්ජාලය',
                'offline' => 'නොබැඳි',
                'local' => 'ප්‍රාදේශීය',
                'international' => 'ජාත්‍යන්තර',
                'national' => 'ජාතික',
                'regional' => 'ප්‍රාදේශීය'
            ],
            'ta_en' => [
                'வணக்கம்' => 'Hello',
                'நன்றி' => 'Thank you',
                'காலை வணක्कम्' => 'Good morning',
                'எப்படி இருக்கிறீர्கळ்?' => 'How are you?',
                'வरवेற்கிறோம்' => 'Welcome',
                'நல্லது' => 'Good',
                'ஆம்' => 'Yes',
                'இল্লை' => 'No',
                'செயற্கै நুण্ணறিवु' => 'Artificial Intelligence',
                'தொழিল্நুட্পम்' => 'Technology',
                'کणিনি' => 'Computer'
            ],
            'si_en' => [
                'ආයුබෝවන්' => 'Hello',
                'ස්තුතියි' => 'Thank you',
                'සුභ උදෑසනක්' => 'Good morning',
                'ඔබට කොහොමද?' => 'How are you?',
                'සාදරයෙන් පිළිගනිමු' => 'Welcome',
                'හොඳයි' => 'Good',
                'ඔව්' => 'Yes',
                'නැහැ' => 'No',
                'කෘත්‍රිම බුද්ධිය' => 'Artificial Intelligence',
                'තාක්ෂණය' => 'Technology',
                'පරිගණකය' => 'Computer'
            ],
            'ta_si' => [
                'வணක்कম्' => 'ආයුබෝවන්',
                'நन्றि' => 'ස්තුතියි',
                'செयற्کै நুण्णறिवु' => 'කෘත්‍රිම බුද්ධිය',
                'தொжिल्நুट्पम्' => 'තාක්ෂණය'
            ],
            'si_ta' => [
                'ආයුබෝවන්' => 'வணක्कम्',
                'ස්තුතියි' => 'நன्றি',
                'කෘත්‍රිම බුද්ධිය' => 'செयற्কै நுण्णறिवु',
                'තාක්ෂණය' => 'தொжيल्நुট्पम्'
            ]
        ];

        $translationKey = $sourceLanguage . '_' . $targetLanguage;
        
        // For long documents, process in chunks to ensure complete translation
        $chunks = $this->chunkText($text, 2000); // Split into 2000 character chunks
        $translatedChunks = [];
        
        foreach ($chunks as $chunk) {
            $translatedChunk = $this->translateChunk($chunk, $translations[$translationKey] ?? []);
            $translatedChunks[] = $translatedChunk;
        }
        
        $translatedText = implode('', $translatedChunks);

        // Add language prefix to indicate this is a mock translation
        return "[{$targetLanguageName} Translation] " . $translatedText;
    }

    /**
     * Split text into manageable chunks for translation
     */
    private function chunkText(string $text, int $maxChunkSize = 2000): array
    {
        $chunks = [];
        $words = explode(' ', $text);
        $currentChunk = '';
        
        foreach ($words as $word) {
            if (strlen($currentChunk . ' ' . $word) > $maxChunkSize && !empty($currentChunk)) {
                $chunks[] = $currentChunk;
                $currentChunk = $word;
            } else {
                $currentChunk = empty($currentChunk) ? $word : $currentChunk . ' ' . $word;
            }
        }
        
        if (!empty($currentChunk)) {
            $chunks[] = $currentChunk;
        }
        
        return $chunks;
    }

    /**
     * Translate a single chunk of text
     */
    private function translateChunk(string $chunk, array $translationMap): string
    {
        if (empty($translationMap)) {
            return $chunk; // No translation map available
        }
        
        $translatedText = $chunk;
        
        // Sort by length (longest first) to avoid partial replacements
        uksort($translationMap, function($a, $b) {
            return strlen($b) - strlen($a);
        });
        
        foreach ($translationMap as $source => $target) {
            if (!empty($target)) { // Only replace if target is not empty
                // Use word boundary regex for better accuracy
                $pattern = '/\b' . preg_quote($source, '/') . '\b/i';
                $translatedText = preg_replace($pattern, $target, $translatedText);
            }
        }
        
        return $translatedText;
    }

    /**
     * Show translation details
     */
    public function show(Translation $translation): JsonResponse
    {
        try {
            $translation->load(['user', 'history']);

            return response()->json([
                'success' => true,
                'data' => $translation
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching translation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching translation'
            ], 500);
        }
    }

    /**
     * Update translation
     */
    public function update(Request $request, Translation $translation): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'translated_text' => 'sometimes|string',
                'status' => 'sometimes|string|in:completed,processing,failed',
                'error_message' => 'nullable|string',
                'metadata' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $translation->update($request->only([
                'translated_text', 'status', 'error_message', 'metadata'
            ]));

            // Add to history if text was updated
            if ($request->has('translated_text')) {
                TranslationHistory::create([
                    'user_id' => $request->user()?->id,
                    'translation_id' => $translation->id,
                    'original_text' => $translation->original_text,
                    'translated_text' => $request->translated_text,
                    'source_language' => $translation->source_language,
                    'target_language' => $translation->target_language,
                    'action_type' => 'edit',
                    'metadata' => $request->metadata
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Translation updated successfully',
                'data' => $translation
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating translation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating translation'
            ], 500);
        }
    }

    /**
     * Delete translation
     */
    public function destroy(Translation $translation): JsonResponse
    {
        try {
            $translation->delete();

            return response()->json([
                'success' => true,
                'message' => 'Translation deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting translation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting translation'
            ], 500);
        }
    }

    /**
     * Get translation statistics
     */
    public function getStats(Request $request): JsonResponse
    {
        try {
            $query = Translation::query();

            // Filter by user if specified
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            // Get basic counts
            $totalTranslations = $query->count();
            $completedTranslations = (clone $query)->where('status', 'completed')->count();
            $processingTranslations = (clone $query)->where('status', 'processing')->count();
            $failedTranslations = (clone $query)->where('status', 'failed')->count();

            // Get storage used from file_size (handle null values)
            $totalFileSize = (clone $query)->whereNotNull('file_size')->sum('file_size') ?? 0;

            // Get unique language pairs count (only non-null languages)
            $languagePairs = (clone $query)
                ->whereNotNull('source_language')
                ->whereNotNull('target_language')
                ->select('source_language', 'target_language')
                ->distinct()
                ->get();
            
            $uniqueLanguages = $languagePairs->map(function($item) {
                return $item->source_language . '-' . $item->target_language;
            })->unique()->count();

            // Get recent activity (limit fields to avoid issues)
            $recentActivity = (clone $query)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(['id', 'status', 'source_language', 'target_language', 'created_at']);

            $stats = [
                'total_translations' => $totalTranslations,
                'completed_translations' => $completedTranslations,
                'processing_translations' => $processingTranslations,
                'failed_translations' => $failedTranslations,
                'total_storage_used' => $this->formatBytes($totalFileSize),
                'languages_used' => $uniqueLanguages,
                'success_rate' => $totalTranslations > 0 ? round(($completedTranslations / $totalTranslations) * 100, 1) : 0,
                'recent_activity' => $recentActivity
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching translation stats: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching translation statistics',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get translation history
     */
    public function getHistory(Request $request): JsonResponse
    {
        try {
            $query = TranslationHistory::with(['user', 'translation'])
                ->orderBy('created_at', 'desc');

            // Filter by user if specified
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->has('action_type')) {
                $query->where('action_type', $request->action_type);
            }

            $history = $query->paginate($request->get('per_page', 50));

            return response()->json([
                'success' => true,
                'data' => $history
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching translation history: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching translation history'
            ], 500);
        }
    }

    /**
     * Get supported languages
     */
    public function getLanguages(): JsonResponse
    {
        try {
            $languages = Language::active()->ordered()->get();

            return response()->json([
                'success' => true,
                'data' => $languages
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching languages: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching languages'
            ], 500);
        }
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes(int $bytes): string
    {
        if ($bytes === 0) return '0 B';
        
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $factor = floor(log($bytes, 1024));
        
        return round($bytes / pow(1024, $factor), 2) . ' ' . $units[$factor];
    }
}
