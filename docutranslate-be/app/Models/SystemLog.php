<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemLog extends Model
{
    use HasFactory;

    protected $table = 'system_logs';

    protected $fillable = [
        'level',
        'category',
        'message',
        'context',
        'user_agent',
        'ip_address',
        'user_id',
    ];

    protected $casts = [
        'context' => 'array',
    ];

    /**
     * Get the user that triggered this log entry.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to only include logs of a specific level.
     */
    public function scopeLevel($query, $level)
    {
        return $query->where('level', $level);
    }

    /**
     * Scope a query to only include logs of a specific category.
     */
    public function scopeCategory($query, $category)
    {
        return $query->where('category', $category);
    }
} 