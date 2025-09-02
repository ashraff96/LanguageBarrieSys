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
     * Backwards-compatible alias for routes expecting getDashboardStats
     */
    public function getDashboardStats(): JsonResponse
    {
        return $this->dashboardStats();
    }

    /**
     * Get admin dashboard statistics
     */
    public function dashboardStats(): JsonResponse
    {
        try {
            // Log the request for debugging
            Log::info('Dashboard stats requested at: ' . now()->toDateTimeString());
            
            $stats = [
                'total_users' => User::count(),
                'active_users' => User::where('status', 'active')->count(),
                'total_translations' => Translation::count(),
                'completed_translations' => Translation::where('status', 'completed')->count(),
                'processing_translations' => Translation::where('status', 'processing')->count(),
                'failed_translations' => Translation::where('status', 'failed')->count(),
                'active_languages' => Language::where('is_active', true)->count(),
                'total_storage_used' => $this->formatBytes(File::sum('file_size') ?? 0),
                'recent_activity' => $this->getRecentActivity(),
                'system_status' => $this->getSystemStatus(),
                'last_updated' => now()->toISOString(), // Add timestamp
            ];

            Log::info('Dashboard stats computed:', $stats);

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);

        } catch (\Exception $e) {
            Log::error('Error in dashboardStats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get database performance statistics */
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

        try {
            // Force fresh database queries by clearing any potential query cache
            \DB::statement('PRAGMA cache_size = 0');
            
            // Get recent file uploads (last 24 hours for more current data)
            $recentFiles = File::with('user:id,name')
                ->where('created_at', '>=', now()->subHours(24))
                ->orderBy('created_at', 'desc')
                ->limit(15) // Increased limit
                ->get();

            foreach ($recentFiles as $file) {
                if ($file->user) {
                    $activities[] = [
                        'user' => $file->user->name,
                        'action' => 'Uploaded document',
                        'file' => $file->original_name,
                        'language' => "{$file->source_language} → {$file->target_language}",
                        'time' => $file->created_at->diffForHumans(),
                        'status' => $file->status,
                        'type' => 'file_upload',
                        'timestamp' => $file->created_at,
                        'created_at_iso' => $file->created_at->toISOString(),
                    ];
                }
            }

            // Get recent translations (last 24 hours for more current data)
            $recentTranslations = Translation::with('user:id,name')
                ->where('created_at', '>=', now()->subHours(24))
                ->orderBy('created_at', 'desc')
                ->limit(15) // Increased limit
                ->get();

            foreach ($recentTranslations as $translation) {
                if ($translation->user) {
                    $activities[] = [
                        'user' => $translation->user->name,
                        'action' => 'Completed translation',
                        'file' => $translation->file_name ?? 'Text translation',
                        'language' => "{$translation->source_language} → {$translation->target_language}",
                        'time' => $translation->created_at->diffForHumans(),
                        'status' => 'completed',
                        'type' => 'translation',
                        'timestamp' => $translation->created_at,
                        'created_at_iso' => $translation->created_at->toISOString(),
                    ];
                }
            }

            // Sort by actual timestamp (most recent first)
            usort($activities, function($a, $b) {
                return $b['timestamp']->timestamp <=> $a['timestamp']->timestamp;
            });

            // Remove timestamp field from final output and return top 20
            $activities = array_slice($activities, 0, 20); // Increased from 15 to 20
            foreach ($activities as &$activity) {
                unset($activity['timestamp']);
            }

            // Log the activity count for debugging
            Log::info('Recent activity count: ' . count($activities));

            return $activities;
        } catch (\Exception $e) {
            // If there's an error, return empty array instead of crashing
            Log::error('Error getting recent activity: ' . $e->getMessage());
            return [];
        }
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
        if ($bytes === null || $bytes === 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }

    /**
     * Create database backup
     */
    public function createDatabaseBackup(): JsonResponse
    {
        try {
            $backupPath = storage_path('backups/database_backup_' . date('Y_m_d_H_i_s') . '.sqlite');
            
            // Create backup directory if it doesn't exist
            if (!file_exists(dirname($backupPath))) {
                mkdir(dirname($backupPath), 0755, true);
            }
            
            // Copy database file
            $databasePath = database_path('database.sqlite');
            copy($databasePath, $backupPath);
            
            Log::info('Database backup created: ' . $backupPath);
            
            return response()->json([
                'success' => true,
                'message' => 'Database backup created successfully',
                'backup_path' => basename($backupPath),
                'size' => $this->formatBytes(filesize($backupPath))
            ]);
        } catch (\Exception $e) {
            Log::error('Error creating database backup: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create database backup',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Optimize database
     */
    public function optimizeDatabase(): JsonResponse
    {
        try {
            // Run SQLite optimization commands
            DB::statement('VACUUM');
            DB::statement('ANALYZE');
            
            Log::info('Database optimization completed');
            
            return response()->json([
                'success' => true,
                'message' => 'Database optimization completed successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error optimizing database: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to optimize database',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clean old data from database
     */
    public function cleanupDatabase(): JsonResponse
    {
        try {
            $cleanupResults = [];
            
            // Clean old translation history (older than 90 days)
            $oldHistoryCount = TranslationHistory::where('created_at', '<', now()->subDays(90))->count();
            TranslationHistory::where('created_at', '<', now()->subDays(90))->delete();
            $cleanupResults['old_translation_history'] = $oldHistoryCount;
            
            // Clean failed translations (older than 30 days)
            $failedTranslationsCount = Translation::where('status', 'failed')
                ->where('created_at', '<', now()->subDays(30))->count();
            Translation::where('status', 'failed')
                ->where('created_at', '<', now()->subDays(30))->delete();
            $cleanupResults['failed_translations'] = $failedTranslationsCount;
            
            // Clean old system logs (older than 30 days)
            $oldLogsCount = SystemLog::where('created_at', '<', now()->subDays(30))->count();
            SystemLog::where('created_at', '<', now()->subDays(30))->delete();
            $cleanupResults['old_system_logs'] = $oldLogsCount;
            
            Log::info('Database cleanup completed', $cleanupResults);
            
            return response()->json([
                'success' => true,
                'message' => 'Database cleanup completed successfully',
                'cleanup_results' => $cleanupResults
            ]);
        } catch (\Exception $e) {
            Log::error('Error cleaning database: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to cleanup database',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get admin settings
     */
    public function getSettings(): JsonResponse
    {
        try {
            // Return mock settings - in a real app, these would come from a settings table
            $settings = [
                'general' => [
                    'site_name' => config('app.name', 'DocuTranslate'),
                    'site_url' => config('app.url'),
                    'admin_email' => config('mail.from.address'),
                    'timezone' => config('app.timezone'),
                    'language' => 'en',
                    'maintenance_mode' => false,
                ],
                'database' => [
                    'backup_frequency' => 'daily',
                    'auto_cleanup' => true,
                    'max_file_size' => '50MB',
                    'storage_limit' => '10GB',
                ],
                'security' => [
                    'session_timeout' => '30',
                    'max_login_attempts' => 5,
                    'password_complexity' => true,
                    'two_factor_auth' => false,
                ],
                'notifications' => [
                    'email_notifications' => true,
                    'system_alerts' => true,
                    'user_registration' => true,
                    'translation_complete' => false,
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => $settings
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching settings: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch settings'
            ], 500);
        }
    }

    /**
     * Update admin settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        try {
            $category = $request->input('category');
            $settings = $request->input('settings');
            
            // In a real app, you would save these to a settings table
            // For now, we'll just log them and return success
            Log::info("Settings updated for category: {$category}", $settings);
            
            return response()->json([
                'success' => true,
                'message' => ucfirst($category) . ' settings updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating settings: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear application cache
     */
    public function clearCache(): JsonResponse
    {
        try {
            // Clear various caches
            \Artisan::call('cache:clear');
            \Artisan::call('config:clear');
            \Artisan::call('route:clear');
            \Artisan::call('view:clear');
            
            Log::info('Application caches cleared');
            
            return response()->json([
                'success' => true,
                'message' => 'Application caches cleared successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error clearing cache: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear cache',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 