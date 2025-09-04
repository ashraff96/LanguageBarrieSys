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
     * Get translation history
     */
    public function history(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            $query = TranslationHistory::with(['translation'])
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc');

            $history = $query->paginate($request->get('per_page', 20));

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
     * Download translation as file
     */
    public function download(Translation $translation): \Illuminate\Http\Response
    {
        try {
            $fileName = $translation->file_name ?? 'translation_' . $translation->id . '.txt';
            $content = $translation->translated_text;

            return response($content)
                ->header('Content-Type', 'text/plain')
                ->header('Content-Disposition', 'attachment; filename="' . $fileName . '"');
        } catch (\Exception $e) {
            Log::error('Error downloading translation: ' . $e->getMessage());
            abort(500, 'Error downloading translation');
        }
    }

    /**
     * Get translation statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            $stats = [
                'total_translations' => Translation::where('user_id', $user->id)->count(),
                'completed_translations' => Translation::where('user_id', $user->id)->where('status', 'completed')->count(),
                'processing_translations' => Translation::where('user_id', $user->id)->where('status', 'processing')->count(),
                'failed_translations' => Translation::where('user_id', $user->id)->where('status', 'failed')->count(),
                'total_characters_translated' => Translation::where('user_id', $user->id)
                    ->where('status', 'completed')
                    ->sum(\Illuminate\Support\Facades\DB::raw('LENGTH(original_text)')),
                'languages_used' => Translation::where('user_id', $user->id)
                    ->distinct()
                    ->pluck('target_language')
                    ->count(),
                'recent_translations' => Translation::where('user_id', $user->id)
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get(['id', 'source_language', 'target_language', 'status', 'created_at'])
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching translation statistics: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching statistics'
            ], 500);
        }
    }
}
