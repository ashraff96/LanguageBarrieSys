<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RajabashaPaper extends Model
{
    use HasFactory;

    protected $table = 'rajabasha_papers';

    protected $fillable = [
        'title',
        'description',
        'language',
        'created_by',
    ];

    public function questions(): HasMany
    {
        return $this->hasMany(RajabashaQuestion::class, 'paper_id');
    }
} 