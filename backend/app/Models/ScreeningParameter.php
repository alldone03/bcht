<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ScreeningParameter extends Model
{
    protected $fillable = ['template_id', 'name', 'order_number'];

    public function template(): BelongsTo
    {
        return $this->belongsTo(ScreeningTemplate::class, 'template_id');
    }

    public function question(): HasOne
    {
        return $this->hasOne(ScreeningQuestion::class, 'parameter_id');
    }
}
