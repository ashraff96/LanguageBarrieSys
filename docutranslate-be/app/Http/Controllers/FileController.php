<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\User;
use App\Services\SystemLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class FileController extends Controller
{
    /**
     * Upload a new file
     */
    public function upload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240', // 10MB max
            'original_name' => 'required|string|max:255',
            'file_type' => 'required|string|max:100',
            'file_size' => 'required|integer|min:1',
            'source_language' => 'required|string|max:10',
            'target_language' => 'required|string|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('file');
            $originalName = $request->input('original_name');
            $fileType = $request->input('file_type');
            $fileSize = $request->input('file_size');
            $sourceLanguage = $request->input('source_language');
            $targetLanguage = $request->input('target_language');

            // Generate unique filename
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            
            // Store file
            $path = $file->storeAs('uploads', $filename, 'public');

            // Create database record
            $fileRecord = File::create([
                'user_id' => Auth::id(), // Will be null for anonymous uploads
                'original_name' => $originalName,
                'file_name' => $filename,
                'file_path' => $path,
                'file_type' => $fileType,
                'file_size' => $fileSize,
                'source_language' => $sourceLanguage,
                'target_language' => $targetLanguage,
                'status' => 'uploaded',
                'translation_accuracy' => null,
            ]);

            // Log the upload
            SystemLogService::info(
                'file_management',
                'File uploaded successfully',
                ['file_id' => $fileRecord->id, 'filename' => $originalName],
                $request
            );

            return response()->json([
                'success' => true,
                'message' => 'File uploaded successfully',
                'data' => [
                    'id' => $fileRecord->id,
                    'original_name' => $fileRecord->original_name,
                    'file_name' => $fileRecord->file_name ?? null,
                    'file_type' => $fileRecord->file_type,
                    'file_size' => $fileRecord->file_size,
                    'status' => $fileRecord->status,
                    'uploaded_at' => $fileRecord->created_at
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'File upload failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get list of files with filters
     */
    public function index(Request $request)
    {
        $query = File::with(['user', 'translations']);

        // Apply filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('file_type')) {
            $query->where('file_type', $request->file_type);
        }

        // Apply search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('original_name', 'like', "%{$search}%")
                  ->orWhere('file_type', 'like', "%{$search}%");
            });
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $files = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $files
        ]);
    }

    /**
     * Get file statistics
     */
    public function stats()
    {
        $stats = [
            'total_files' => File::count(),
            'total_size' => File::sum('file_size'),
            'files_by_status' => File::selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status'),
            'files_by_type' => File::selectRaw('file_type, COUNT(*) as count')
                ->groupBy('file_type')
                ->pluck('count', 'file_type'),
            'recent_uploads' => File::with('user')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(['id', 'original_name', 'user_id', 'created_at', 'status'])
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Show a specific file
     */
    public function show(File $file)
    {
        // Check if user can view this file
        if (!Auth::user()->isAdmin() && $file->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        $file->load('user');

        return response()->json([
            'success' => true,
            'data' => $file
        ]);
    }

    /**
     * Update file status
     */
    public function updateStatus(Request $request, File $file)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:uploaded,processing,translated,completed,failed',
            'translation_accuracy' => 'nullable|numeric|min:0|max:100'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if user can update this file
        // Allow updates for anonymous files (user_id is null) or if user owns the file or is admin
        $user = Auth::user();
        if ($file->user_id !== null) {
            // File has an owner, check authorization
            if (!$user || (!$user->isAdmin() && $file->user_id !== $user->id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }
        }
        // Anonymous files (user_id = null) can be updated by anyone

        $oldStatus = $file->status;
        $file->update($request->only(['status', 'translation_accuracy']));

        // Log the status change
        SystemLogService::info(
            'file_management',
            "File status updated from {$oldStatus} to {$file->status}",
            ['file_id' => $file->id, 'old_status' => $oldStatus, 'new_status' => $file->status],
            $request
        );

        return response()->json([
            'success' => true,
            'message' => 'File status updated successfully',
            'data' => $file
        ]);
    }

    /**
     * Delete a file
     */
    public function destroy(File $file)
    {
        // Check if user can delete this file
        if (!Auth::user()->isAdmin() && $file->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        try {
            // Delete physical file
            if (Storage::disk('public')->exists($file->file_path)) {
                Storage::disk('public')->delete($file->file_path);
            }

            // Log the deletion
            SystemLogService::info(
                'file_management',
                'File deleted successfully',
                ['file_id' => $file->id, 'filename' => $file->original_name],
                $request
            );

            // Delete database record
            $file->delete();

            return response()->json([
                'success' => true,
                'message' => 'File deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'File deletion failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download a file
     */
    public function download(File $file)
    {
        // Check if user can download this file
        if (!Auth::user()->isAdmin() && $file->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        if (!Storage::disk('public')->exists($file->file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'File not found'
            ], 404);
        }

        // Log the download
        SystemLogService::info(
            'file_management',
            'File downloaded',
            ['file_id' => $file->id, 'filename' => $file->original_name],
            $request
        );

        return Storage::disk('public')->download(
            $file->file_path,
            $file->original_name
        );
    }

    /**
     * Helper method to format bytes
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = array('B', 'KB', 'MB', 'GB', 'TB');

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }
} 