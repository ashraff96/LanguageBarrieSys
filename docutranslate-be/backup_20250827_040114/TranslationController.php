<?php

namespace App\Http\Controllers;

use App\Models\Translation;
use App\Models\TranslationHistory;
use App\Models\Language;
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
            $query = Translation::with(['user'])
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

            $stats = [
                'total_translations' => $query->count(),
                'completed_translations' => (clone $query)->where('status', 'completed')->count(),
                'processing_translations' => (clone $query)->where('status', 'processing')->count(),
                'failed_translations' => (clone $query)->where('status', 'failed')->count(),
                'total_storage_used' => $this->formatBytes((clone $query)->sum('file_size') ?? 0),
                'languages_used' => (clone $query)->distinct('source_language', 'target_language')->count()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching translation stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching translation statistics'
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