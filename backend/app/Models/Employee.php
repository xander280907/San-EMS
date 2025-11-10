<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $user_id
 * @property int $department_id
 * @property-read User|null $user
 * @property-read Department|null $department
 */
class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'employee_number',
        'department_id',
        'position',
        'employment_type',
        'hire_date',
        'base_salary',
        'allowance',
        'sss_number',
        'philhealth_number',
        'pagibig_number',
        'tin_number',
        'address',
        'gender',
        'birth_date',
        'marital_status',
        'emergency_contact_name',
        'emergency_contact_phone',
        'profile_picture',
        'status',
    ];

    protected $casts = [
        'hire_date' => 'date',
        'birth_date' => 'date',
        'base_salary' => 'decimal:2',
        'allowance' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function leaves()
    {
        return $this->hasMany(Leave::class);
    }

    public function payrolls()
    {
        return $this->hasMany(Payroll::class);
    }
}
