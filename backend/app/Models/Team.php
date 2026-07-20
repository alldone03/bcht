<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Team extends Model
{
    protected $fillable = ['name', 'location'];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
