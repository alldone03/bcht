<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Question extends Model
{
    protected $fillable = [
        'form_id',
        'question_code',
        'text',
        'type',
        'options',
        'order_number',
        'trigger_condition',
        'trigger_action_text'
    ];

    protected $casts = [
        'options' => 'array',
        'trigger_condition' => 'array',
    ];

    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }
}
