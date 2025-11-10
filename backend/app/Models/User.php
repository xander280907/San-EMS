<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

/**
 * @property int $id
 * @property string $email
 * @property string $password
 * @property string $first_name
 * @property string|null $last_name
 * @property string|null $middle_name
 * @property string|null $phone
 * @property string|null $profile_picture
 * @property int $role_id
 * @property \Illuminate\Support\Carbon|null $email_verified_at
 * @property string|null $remember_token
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Employee|null $employee
 * @property-read Role|null $role
 * 
 * @method static \Illuminate\Database\Eloquent\Builder|User newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|User newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|User query()
 * @method static \Illuminate\Database\Eloquent\Builder|User create(array $attributes = [])
 * @method bool relationLoaded(string $relation)
 * @method User load(string|array $relations)
 */
class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'employee_code',
        'name',
        'email',
        'password',
        'role_id',
        'department',
        'position',
        'date_hired',
        'profile_picture',
        'first_name',
        'last_name',
        'middle_name',
        'phone',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // JWT Methods
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    // Relationships
    public function employee()
    {
        return $this->hasOne(Employee::class);
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    // Helper Methods
    public function isAdmin()
    {
        return $this->role?->name === 'admin';
    }

    public function isHR()
    {
        return $this->role?->name === 'hr';
    }

    public function isEmployee()
    {
        return $this->role?->name === 'employee';
    }

    public function hasPermission($permission)
    {
        // Admin has all permissions
        if ($this->role?->name === 'admin') {
            return true;
        }
        
        // Check role permissions from database
        $permissions = $this->role?->permissions ?? [];
        
        // Check if user has wildcard permission
        if (in_array('*', $permissions)) {
            return true;
        }

        // Check exact permission or wildcard match
        foreach ($permissions as $rolePermission) {
            if ($rolePermission === $permission) {
                return true;
            }
            // Check wildcard patterns like 'employees.*'
            if (str_ends_with($rolePermission, '.*')) {
                $prefix = substr($rolePermission, 0, -2);
                if (str_starts_with($permission, $prefix . '.')) {
                    return true;
                }
            }
        }

        return false;
    }
}
