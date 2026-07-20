<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormSubmission extends Model
{
    protected $fillable = [
        'form_id',
        'user_id',
        'filled_by',
        'diagnosis',
        'diagnosed_by',
        'diagnosed_at',
        'submitted_at'
    ];

    protected $casts = [
        'diagnosed_at' => 'datetime',
        'submitted_at' => 'datetime',
    ];

    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function filler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'filled_by');
    }

    public function diagnosedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diagnosed_by');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class, 'submission_id');
    }
}
