<?php

namespace App\Services;

use App\Models\SystemLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SystemLogService
{
    /**
     * Log system activity
     */
    public static function log(
        string $level,
        string $category,
        string $message,
        array $context = [],
        ?Request $request = null
    ): void {
        try {
            $logData = [
                'level' => $level,
                'category' => $category,
                'message' => $message,
                'context' => $context,
                'user_id' => $request?->user()?->id,
                'ip_address' => $request?->ip(),
                'user_agent' => $request?->userAgent(),
            ];

            SystemLog::create($logData);

            // Also log to Laravel's default logging system
            Log::log($level, "[{$category}] {$message}", $context);
        } catch (\Exception $e) {
            // Fallback to Laravel logging if database logging fails
            Log::error('Failed to log to database: ' . $e->getMessage());
            Log::log($level, "[{$category}] {$message}", $context);
        }
    }

    /**
     * Log info level message
     */
    public static function info(string $category, string $message, array $context = [], ?Request $request = null): void
    {
        self::log('info', $category, $message, $context, $request);
    }

    /**
     * Log warning level message
     */
    public static function warning(string $category, string $message, array $context = [], ?Request $request = null): void
    {
        self::log('warning', $category, $message, $context, $request);
    }

    /**
     * Log error level message
     */
    public static function error(string $category, string $message, array $context = [], ?Request $request = null): void
    {
        self::log('error', $category, $message, $context, $request);
    }

    /**
     * Log debug level message
     */
    public static function debug(string $category, string $message, array $context = [], ?Request $request = null): void
    {
        self::log('debug', $category, $message, $context, $request);
    }

    /**
     * Log user activity
     */
    public static function logUserActivity(string $action, array $context = [], ?Request $request = null): void
    {
        self::info('user', $action, $context, $request);
    }

    /**
     * Log translation activity
     */
    public static function logTranslationActivity(string $action, array $context = [], ?Request $request = null): void
    {
        self::info('translation', $action, $context, $request);
    }

    /**
     * Log system performance
     */
    public static function logPerformance(string $metric, float $value, string $unit = '', array $context = [], ?Request $request = null): void
    {
        $message = "Performance metric: {$metric} = {$value} {$unit}";
        self::info('performance', $message, $context, $request);
    }

    /**
     * Log system error
     */
    public static function logSystemError(string $error, array $context = [], ?Request $request = null): void
    {
        self::error('system', $error, $context, $request);
    }
} 