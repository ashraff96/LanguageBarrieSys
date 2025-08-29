<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TranslationHistory extends Model
{
    use HasFactory;

    protected $table = 'translation_history';

    protected $fillable = [
        'user_id',
        'translation_id',
        'original_text',
        'translated_text',
        'source_language',
        'target_language',
        'action_type',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    /**
     * Get the user that performed the action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the translation that this history record belongs to.
     */
    public function translation(): BelongsTo
    {
        return $this->belongsTo(Translation::class);
    }
} 