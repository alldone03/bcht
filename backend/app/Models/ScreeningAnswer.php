<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScreeningAnswer extends Model
{
    protected $fillable = ['question_id', 'answer', 'score', 'severity_color'];

    public function question(): BelongsTo
    {
        return $this->belongsTo(ScreeningQuestion::class, 'question_id');
    }
}
