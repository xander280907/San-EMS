<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $name
 * @property string|null $code
 * @property string|null $description
 * @property int|null $positions
 * @property int|null $manager_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Employee> $employees
 * @property-read \Illuminate\Database\Eloquent\Collection<int, JobPosting> $jobPostings
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Announcement> $announcements
 * @property-read User|null $manager
 */
class Department extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'positions',
        'manager_id',
    ];

    protected $appends = ['employees_count'];

    public function getEmployeesCountAttribute()
    {
        return $this->employees()->count();
    }

    public function manager()
    {
        return $this->belongsTo(Employee::class, 'manager_id');
    }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    public function jobPostings()
    {
        return $this->hasMany(JobPosting::class);
    }

    public function announcements()
    {
        return $this->hasMany(Announcement::class);
    }

    public function positions()
    {
        return $this->hasMany(Position::class);
    }
}
