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
     * Perform the actual translation
     * In a real application, this would call an external translation service like Google Translate, AWS Translate, etc.
     */
    private function performTranslation(string $text, string $sourceLanguage, string $targetLanguage): string
    {
        // Language mapping for demonstration
        $languageNames = [
            'en' => 'English',
            'ta' => 'Tamil',
            'si' => 'Sinhala'
        ];

        $sourceLanguageName = $languageNames[$sourceLanguage] ?? $sourceLanguage;
        $targetLanguageName = $languageNames[$targetLanguage] ?? $targetLanguage;

        // Mock translation logic - in production, integrate with Google Translate API, AWS Translate, etc.
        if ($sourceLanguage === $targetLanguage) {
            return $text; // Same language, return original
        }

        // Sample translations for demonstration
        $translations = [
            'en_ta' => [
                'Hello' => 'வணக்கம்',
                'Thank you' => 'நன்றி',
                'Good morning' => 'காலை வணக்கம்',
                'How are you?' => 'எப்படி இருக்கிறீர்கள்?',
                'Welcome' => 'வரவேற்கிறோம்',
                'Good' => 'நல்லது',
                'Yes' => 'ஆம்',
                'No' => 'இல்லை'
            ],
            'en_si' => [
                'Hello' => 'ආයුබෝවන්',
                'Thank you' => 'ස්තුතියි',
                'Good morning' => 'සුභ උදෑසනක්',
                'How are you?' => 'ඔබට කොහොමද?',
                'Welcome' => 'සාදරයෙන් පිළිගනිමු',
                'Good' => 'හොඳයි',
                'Yes' => 'ඔව්',
                'No' => 'නැහැ'
            ],
            'ta_en' => [
                'வணக்கம்' => 'Hello',
                'நன்றி' => 'Thank you',
                'காலை வணක்கம்' => 'Good morning',
                'எப்படி இருக்கிறீர்கள்?' => 'How are you?',
                'வரவேற்கிறோம்' => 'Welcome',
                'நல்லது' => 'Good',
                'ஆம்' => 'Yes',
                'இல்லை' => 'No'
            ],
            'si_en' => [
                'ආයුබෝවන්' => 'Hello',
                'ස්තුතියි' => 'Thank you',
                'සුභ උදෑසනක්' => 'Good morning',
                'ඔබට කොහොමද?' => 'How are you?',
                'සාදරයෙන් පිළිගනිමු' => 'Welcome',
                'හොඳයි' => 'Good',
                'ඔව්' => 'Yes',
                'නැහැ' => 'No'
            ]
        ];

        $translationKey = $sourceLanguage . '_' . $targetLanguage;
        
        // Check if we have predefined translations
        if (isset($translations[$translationKey])) {
            $translationMap = $translations[$translationKey];
            
            // Try to find exact matches first
            foreach ($translationMap as $source => $target) {
                if (stripos($text, $source) !== false) {
                    $text = str_ireplace($source, $target, $text);
                }
            }
        }

        // For longer texts, add a translation prefix to indicate the target language
        if (strlen($text) > 100) {
            $prefix = "[$targetLanguageName Translation] ";
            return $prefix . $text;
        }

        // If no specific translation found, return with language indicator
        return "[$targetLanguageName] " . $text;
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