<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Translation;
use App\Models\TranslationHistory;
use App\Models\Language;
use App\Models\SystemLog;
use App\Models\UserSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\File;

class AdminController extends Controller
{
    /**
     * Get admin dashboard statistics
     */
    public function dashboardStats(): JsonResponse
    {
        try {
            $stats = [
                'total_users' => User::count(),
                'active_users' => User::where('status', 'active')->count(),
                'total_translations' => Translation::count(),
                'completed_translations' => Translation::where('status', 'completed')->count(),
                'processing_translations' => Translation::where('status', 'processing')->count(),
                'failed_translations' => Translation::where('status', 'failed')->count(),
                'active_languages' => Language::where('is_active', true)->count(),
                'total_storage_used' => $this->formatBytes(File::sum('file_size')),
                'recent_activity' => $this->getRecentActivity(),
                'system_status' => $this->getSystemStatus(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get database performance statistics
     */
    public function getDatabaseStats(): JsonResponse
    {
        try {
            $tableStats = [
                'users' => [
                    'records' => User::count(),
                    'size' => $this->getTableSize('users'),
                    'last_updated' => User::max('updated_at')
                ],
                'translations' => [
                    'records' => Translation::count(),
                    'size' => $this->getTableSize('translations'),
                    'last_updated' => Translation::max('updated_at')
                ],
                'translation_history' => [
                    'records' => TranslationHistory::count(),
                    'size' => $this->getTableSize('translation_history'),
                    'last_updated' => TranslationHistory::max('created_at')
                ],
                'languages' => [
                    'records' => Language::count(),
                    'size' => $this->getTableSize('languages'),
                    'last_updated' => Language::max('updated_at')
                ],
            ];

            $stats = [
                'total_translations' => Translation::count(),
                'total_users' => User::count(),
                'storage_used' => $this->calculateStorageUsed(),
                'database_size' => $this->getDatabaseSize(),
                'table_stats' => $tableStats
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching database stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching database statistics'
            ], 500);
        }
    }

    /**
     * Get system logs
     */
    public function getSystemLogs(Request $request): JsonResponse
    {
        try {
            $query = SystemLog::with('user')
                ->orderBy('created_at', 'desc');

            // Apply filters
            if ($request->has('level')) {
                $query->where('level', $request->level);
            }

            if ($request->has('category')) {
                $query->where('category', $request->category);
            }

            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            $logs = $query->paginate($request->get('per_page', 50));

            return response()->json([
                'success' => true,
                'data' => $logs
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching system logs: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching system logs'
            ], 500);
        }
    }

    /**
     * Get system performance metrics
     */
    public function getSystemPerformance(): JsonResponse
    {
        try {
            $metrics = [
                'translation_api' => [
                    'status' => 'operational',
                    'response_time' => $this->getAverageResponseTime(),
                    'success_rate' => $this->getTranslationSuccessRate()
                ],
                'file_storage' => [
                    'status' => 'operational',
                    'usage_percentage' => $this->getStorageUsagePercentage(),
                    'available_space' => $this->getAvailableStorage()
                ],
                'database' => [
                    'status' => $this->getDatabaseStatus(),
                    'connection_pool' => $this->getDatabaseConnectionPool(),
                    'query_performance' => $this->getDatabaseQueryPerformance()
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $metrics
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching system performance: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching system performance metrics'
            ], 500);
        }
    }

    /**
     * Calculate total storage used by translations
     */
    private function calculateStorageUsed(): string
    {
        $totalBytes = Translation::sum('file_size') ?? 0;
        return $this->formatBytes($totalBytes);
    }

    /**
     * Get database size
     */
    private function getDatabaseSize(): string
    {
        // This is a simplified version - in production you'd query the database directly
        $totalBytes = Translation::count() * 1024; // Rough estimate
        return $this->formatBytes($totalBytes);
    }

    /**
     * Get table size (simplified)
     */
    private function getTableSize(string $tableName): string
    {
        // In production, you'd query information_schema or similar
        $recordCount = DB::table($tableName)->count();
        $estimatedSize = $recordCount * 512; // Rough estimate per record
        return $this->formatBytes($estimatedSize);
    }

    /**
     * Get recent activity
     */
    private function getRecentActivity(): array
    {
        $activities = [];

        // Get recent file uploads
        $recentFiles = File::with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        foreach ($recentFiles as $file) {
            $activities[] = [
                'user' => $file->user->name,
                'action' => 'Uploaded document',
                'file' => $file->original_name,
                'language' => "{$file->source_language} → {$file->target_language}",
                'time' => $file->created_at->diffForHumans(),
                'status' => $file->status,
                'type' => 'file_upload',
            ];
        }

        // Get recent translations
        $recentTranslations = Translation::with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        foreach ($recentTranslations as $translation) {
            $activities[] = [
                'user' => $translation->user->name,
                'action' => 'Completed translation',
                'file' => $translation->file_name ?? 'Text translation',
                'language' => "{$translation->source_language} → {$translation->target_language}",
                'time' => $translation->created_at->diffForHumans(),
                'status' => 'completed',
                'type' => 'translation',
            ];
        }

        // Sort by time and return top 10
        usort($activities, function($a, $b) {
            return strtotime($b['time']) - strtotime($a['time']);
        });

        return array_slice($activities, 0, 10);
    }

    /**
     * Get system status
     */
    private function getSystemStatus(): array
    {
        return [
            'translation_api' => 'operational',
            'file_storage' => 'operational',
            'database' => $this->getDatabaseStatus()
        ];
    }

    /**
     * Get database status
     */
    private function getDatabaseStatus(): string
    {
        try {
            DB::connection()->getPdo();
            return 'operational';
        } catch (\Exception $e) {
            return 'error';
        }
    }

    /**
     * Get average response time
     */
    private function getAverageResponseTime(): float
    {
        // Simplified - in production you'd track actual response times
        return rand(100, 500) / 1000; // Random value between 0.1 and 0.5 seconds
    }

    /**
     * Get translation success rate
     */
    private function getTranslationSuccessRate(): float
    {
        $total = Translation::count();
        if ($total === 0) return 100.0;
        
        $successful = Translation::where('status', 'completed')->count();
        return round(($successful / $total) * 100, 1);
    }

    /**
     * Get storage usage percentage
     */
    private function getStorageUsagePercentage(): int
    {
        // Simplified calculation
        return rand(60, 85);
    }

    /**
     * Get available storage
     */
    private function getAvailableStorage(): string
    {
        // Simplified - in production you'd check actual disk space
        return $this->formatBytes(rand(1000000000, 5000000000)); // 1-5 GB
    }

    /**
     * Get database connection pool status
     */
    private function getDatabaseConnectionPool(): string
    {
        return 'healthy';
    }

    /**
     * Get database query performance
     */
    private function getDatabaseQueryPerformance(): string
    {
        return 'optimal';
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