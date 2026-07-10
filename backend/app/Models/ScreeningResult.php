<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScreeningResult extends Model
{
    protected $fillable = [
        'session_id', 
        'total_score', 
        'highest_score', 
        'classification', 
        'recommendation', 
        'status', 
        'doctor_id', 
        'doctor_notes', 
        'reviewed_at'
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(ScreeningSession::class, 'session_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }
}
