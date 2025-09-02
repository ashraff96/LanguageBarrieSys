<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TranslationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\VoiceController;
use App\Http\Controllers\PracticeController;
use App\Http\Controllers\RajabashaController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::get('/languages', [TranslationController::class, 'getLanguages']);
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'timestamp' => now()->toISOString(),
        'version' => '1.0.0'
    ]);
});

// Authentication routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    
    // User info and session management
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    
    // User profile routes
    Route::prefix('user')->group(function () {
        Route::get('/profile', [UserController::class, 'profile']);
        Route::put('/profile', [UserController::class, 'updateProfile']);
        Route::get('/translations', [TranslationController::class, 'getUserTranslations']);
        Route::get('/translation-history', [TranslationController::class, 'getHistory']);
    });

    // Translation routes
    Route::prefix('translations')->group(function () {
        Route::post('/', [TranslationController::class, 'store']);
        Route::post('/translate', [TranslationController::class, 'translateText']);
        Route::get('/stats', [TranslationController::class, 'getStats']);
        Route::get('/history', [TranslationController::class, 'getHistory']);
        Route::get('/{translation}', [TranslationController::class, 'show']);
        Route::put('/{translation}', [TranslationController::class, 'update']);
        Route::delete('/{translation}', [TranslationController::class, 'destroy']);
    });

    // Voice translator routes
    Route::prefix('voice')->group(function () {
        Route::post('/transcribe-translate', [VoiceController::class, 'transcribeAndTranslate']);
    });

    // Language practice routes
    Route::prefix('practice')->group(function () {
        Route::post('/sessions', [PracticeController::class, 'startSession']);
        Route::post('/attempts', [PracticeController::class, 'submitAttempt']);
    });

    // File management routes
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('/files/upload', [FileController::class, 'upload']);
        Route::get('/files', [FileController::class, 'index']);
        Route::get('/files/stats', [FileController::class, 'stats']);
        Route::get('/files/{file}', [FileController::class, 'show']);
        Route::patch('/files/{file}/status', [FileController::class, 'updateStatus']);
        Route::delete('/files/{file}', [FileController::class, 'destroy']);
        Route::get('/files/{file}/download', [FileController::class, 'download']);
    });

    // Rajabasha routes
    Route::get('/rajabasha/papers', [RajabashaController::class, 'listPapers']);
    Route::post('/rajabasha/papers', [RajabashaController::class, 'createPaper']);
    Route::get('/rajabasha/papers/{paperId}/questions', [RajabashaController::class, 'listQuestions']);
    Route::post('/rajabasha/papers/{paperId}/questions', [RajabashaController::class, 'createQuestion']);
    Route::post('/rajabasha/papers/{paperId}/attempts', [RajabashaController::class, 'submitAttempt']);

    // Admin routes (require admin role)
    Route::middleware('admin')->group(function () {
        
        // Admin dashboard
        Route::prefix('admin')->group(function () {
            Route::get('/dashboard-stats', [AdminController::class, 'getDashboardStats']);
            Route::get('/database-stats', [AdminController::class, 'getDatabaseStats']);
            Route::get('/system-logs', [AdminController::class, 'getSystemLogs']);
            Route::get('/system-performance', [AdminController::class, 'getSystemPerformance']);
            
            // Database management
            Route::post('/database/backup', [AdminController::class, 'createDatabaseBackup']);
            Route::post('/database/optimize', [AdminController::class, 'optimizeDatabase']);
            Route::post('/database/cleanup', [AdminController::class, 'cleanupDatabase']);
            
            // Settings management
            Route::get('/settings', [AdminController::class, 'getSettings']);
            Route::post('/settings', [AdminController::class, 'updateSettings']);
            
            // System management
            Route::post('/cache/clear', [AdminController::class, 'clearCache']);
        });

        // User management (admin only)
        Route::prefix('admin/users')->group(function () {
            Route::get('/', [UserController::class, 'index']);
            Route::get('/stats', [UserController::class, 'getUserStats']);
            Route::post('/', [UserController::class, 'store']);
            Route::get('/{user}', [UserController::class, 'show']);
            Route::put('/{user}', [UserController::class, 'update']);
            Route::patch('/{user}/status', [UserController::class, 'updateStatus']);
            Route::delete('/{user}', [UserController::class, 'destroy']);
        });

        // Translation management (admin only)
        Route::prefix('admin/translations')->group(function () {
            Route::get('/', [TranslationController::class, 'index']);
            Route::get('/stats', [TranslationController::class, 'getStats']);
            Route::get('/stats-debug', function() {
                try {
                    $count = \App\Models\Translation::count();
                    $sample = \App\Models\Translation::first();
                    return response()->json([
                        'success' => true,
                        'count' => $count,
                        'sample' => $sample,
                        'message' => 'Debug info'
                    ]);
                } catch (\Exception $e) {
                    return response()->json([
                        'success' => false,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ], 500);
                }
            });
            Route::get('/history', [TranslationController::class, 'getHistory']);
        });
    });
}); 