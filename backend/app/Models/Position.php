<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $department_id
 * @property string $title
 * @property string|null $description
 * @property float|null $min_salary
 * @property float|null $max_salary
 * @property int $available_slots
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Department $department
 */
class Position extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'title',
        'description',
        'min_salary',
        'max_salary',
        'available_slots',
        'status',
    ];

    protected $casts = [
        'min_salary' => 'decimal:2',
        'max_salary' => 'decimal:2',
        'available_slots' => 'integer',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}
