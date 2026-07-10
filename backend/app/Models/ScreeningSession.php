<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ScreeningSession extends Model
{
    protected $fillable = ['participant_id', 'template_id', 'started_at', 'finished_at'];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function participant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'participant_id');
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(ScreeningTemplate::class, 'template_id');
    }

    public function sessionAnswers(): HasMany
    {
        return $this->hasMany(ScreeningSessionAnswer::class, 'session_id');
    }

    public function result(): HasOne
    {
        return $this->hasOne(ScreeningResult::class, 'session_id');
    }
}
