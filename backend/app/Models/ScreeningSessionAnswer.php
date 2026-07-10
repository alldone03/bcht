<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScreeningSessionAnswer extends Model
{
    protected $fillable = ['session_id', 'question_id', 'answer_id', 'score'];

    public function session(): BelongsTo
    {
        return $this->belongsTo(ScreeningSession::class, 'session_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(ScreeningQuestion::class, 'question_id');
    }

    public function answer(): BelongsTo
    {
        return $this->belongsTo(ScreeningAnswer::class, 'answer_id');
    }
}
