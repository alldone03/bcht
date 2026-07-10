<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScreeningTemplate extends Model
{
    protected $fillable = ['name', 'description'];

    public function parameters(): HasMany
    {
        return $this->hasMany(ScreeningParameter::class, 'template_id')->orderBy('order_number');
    }
}
