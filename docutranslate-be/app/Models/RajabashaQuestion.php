<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RajabashaQuestion extends Model
{
    use HasFactory;

    protected $table = 'rajabasha_questions';

    protected $fillable = [
        'paper_id',
        'question_text',
        'question_type',
        'options',
        'answer_key',
        'marks',
    ];

    protected $casts = [
        'options' => 'array',
    ];

    public function paper(): BelongsTo
    {
        return $this->belongsTo(RajabashaPaper::class, 'paper_id');
    }
} 