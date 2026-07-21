<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role', 'role_id', 'team_id', 'tanggal_lahir', 'participant_id'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function roleRelation()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function getRoleAttribute()
    {
        return $this->roleRelation ? $this->roleRelation->name : ($this->attributes['role'] ?? 'PESERTA');
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function companions()
    {
        return $this->belongsToMany(User::class, 'companions', 'user_id', 'companion_id')->withTimestamps();
    }

    public function hasRole(string $roleName): bool
    {
        return $this->roleRelation && $this->roleRelation->name === strtoupper($roleName);
    }

    public function hasPermission(string $permissionName): bool
    {
        if (!$this->roleRelation) {
            return false;
        }

        if ($this->hasRole('ADMIN')) {
            return true;
        }

        return $this->roleRelation->permissions()->where('name', $permissionName)->exists();
    }
}
