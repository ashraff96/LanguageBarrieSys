<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\User;
use App\Services\SystemLogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class FileController extends Controller
{
    protected $systemLogService;

    public function __construct(SystemLogService $systemLogService)
    {
        $this->systemLogService = $systemLogService;
    }

    /**
     * Upload a new file.
     */
    public function upload(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240', // 10MB max
            'source_language' => 'required|string|max:10',
            'target_language' => 'required|string|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $file = $request->file('file');
            $user = auth()->user();
            
            // Generate unique filename
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $fileName = Str::random(40) . '.' . $extension;
            
            // Store file
            $filePath = $file->storeAs('uploads/' . $user->id, $fileName, 'public');
            
            // Create file record
            $fileRecord = File::create([
                'original_name' => $originalName,
                'file_name' => $fileName,
                'file_path' => $filePath,
                'file_size' => $file->getSize(),
                'file_type' => $file->getMimeType(),
                'user_id' => $user->id,
                'status' => 'uploaded',
                'source_language' => $request->source_language,
                'target_language' => $request->target_language,
                'metadata' => [
                    'uploaded_at' => now()->toISOString(),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ],
            ]);

            // Log activity
            $this->systemLogService->log(
                'info',
                'file_upload',
                "User {$user->name} uploaded file: {$originalName}",
                [
                    'user_id' => $user->id,
                    'file_id' => $fileRecord->id,
                    'file_size' => $file->getSize(),
                    'languages' => "{$request->source_language} → {$request->target_language}",
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'File uploaded successfully',
                'data' => $fileRecord,
            ], 201);

        } catch (\Exception $e) {
            $this->systemLogService->log(
                'error',
                'file_upload_failed',
                "File upload failed: " . $e->getMessage(),
                ['user_id' => auth()->id()]
            );

            return response()->json([
                'success' => false,
                'message' => 'File upload failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all files with optional filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = File::with('user:id,name,email');

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

        // Pagination
        $perPage = $request->get('per_page', 15);
        $files = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $files->items(),
            'total' => $files->total(),
            'current_page' => $files->currentPage(),
            'last_page' => $files->lastPage(),
        ]);
    }

    /**
     * Get file statistics.
     */
    public function stats(): JsonResponse
    {
        try {
            $stats = [
                'total_files' => File::count(),
                'processing_files' => File::where('status', 'processing')->count(),
                'translated_files' => File::where('status', 'translated')->count(),
                'failed_files' => File::where('status', 'failed')->count(),
                'average_accuracy' => File::whereNotNull('translation_accuracy')
                    ->avg('translation_accuracy') ?? 0,
                'total_storage_used' => $this->formatBytes(File::sum('file_size')),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch file statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a specific file.
     */
    public function show(File $file): JsonResponse
    {
        // Check if user can access this file
        if (auth()->user()->id !== $file->user_id && !auth()->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to file',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $file->load('user:id,name,email'),
        ]);
    }

    /**
     * Update file status.
     */
    public function updateStatus(Request $request, File $file): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:uploaded,processing,translated,failed',
            'translation_accuracy' => 'nullable|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $oldStatus = $file->status;
            
            $file->update([
                'status' => $request->status,
                'translation_accuracy' => $request->translation_accuracy,
            ]);

            // Log status change
            $this->systemLogService->log(
                'info',
                'file_status_changed',
                "File status changed from {$oldStatus} to {$request->status}",
                [
                    'file_id' => $file->id,
                    'user_id' => $file->user_id,
                    'old_status' => $oldStatus,
                    'new_status' => $request->status,
                    'accuracy' => $request->translation_accuracy,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'File status updated successfully',
                'data' => $file,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update file status',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a file.
     */
    public function destroy(File $file): JsonResponse
    {
        try {
            // Check if user can delete this file
            if (auth()->user()->id !== $file->user_id && !auth()->user()->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to delete this file',
                ], 403);
            }

            // Delete physical file
            if (Storage::disk('public')->exists($file->file_path)) {
                Storage::disk('public')->delete($file->file_path);
            }

            // Log deletion
            $this->systemLogService->log(
                'info',
                'file_deleted',
                "File deleted: {$file->original_name}",
                [
                    'file_id' => $file->id,
                    'user_id' => $file->user_id,
                    'file_size' => $file->file_size,
                ]
            );

            $file->delete();

            return response()->json([
                'success' => true,
                'message' => 'File deleted successfully',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete file',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download a file.
     */
    public function download(File $file): JsonResponse
    {
        // Check if user can access this file
        if (auth()->user()->id !== $file->user_id && !auth()->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to file',
            ], 403);
        }

        try {
            if (!Storage::disk('public')->exists($file->file_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found on disk',
                ], 404);
            }

            $fileUrl = Storage::disk('public')->url($file->file_path);

            return response()->json([
                'success' => true,
                'data' => [
                    'download_url' => $fileUrl,
                    'file_name' => $file->original_name,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate download link',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Format bytes to human readable format.
     */
    private function formatBytes($bytes, $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }
} 