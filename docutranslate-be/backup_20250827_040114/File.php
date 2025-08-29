<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class File extends Model
{
    use HasFactory;

    protected $fillable = [
        'original_name',
        'file_name',
        'file_path',
        'file_size',
        'file_type',
        'user_id',
        'status',
        'source_language',
        'target_language',
        'translation_accuracy',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'translation_accuracy' => 'float',
    ];

    /**
     * Get the user that owns the file.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to only include files with a specific status.
     */
    public function scopeWithStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to only include files for a specific user.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope a query to only include files with translation accuracy.
     */
    public function scopeWithAccuracy($query)
    {
        return $query->whereNotNull('translation_accuracy');
    }

    /**
     * Get the file size in human readable format.
     */
    public function getHumanReadableSizeAttribute(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Check if the file is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'translated';
    }

    /**
     * Check if the file is processing.
     */
    public function isProcessing(): bool
    {
        return $this->status === 'processing';
    }

    /**
     * Check if the file has failed.
     */
    public function hasFailed(): bool
    {
        return $this->status === 'failed';
    }
} 