<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScreeningQuestion extends Model
{
    protected $fillable = ['parameter_id', 'question'];

    public function parameter(): BelongsTo
    {
        return $this->belongsTo(ScreeningParameter::class, 'parameter_id');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(ScreeningAnswer::class, 'question_id');
    }
}
