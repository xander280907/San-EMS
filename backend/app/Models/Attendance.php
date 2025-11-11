<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'attendance_date',
        'clock_in',
        'clock_out',
        'hours_worked',
        'overtime_hours',
        'late_hours',
        'is_present',
        'is_holiday',
        'is_on_leave',
        'clock_in_location',
        'clock_out_location',
        'clock_in_selfie',
        'clock_in_selfie_status',
        'clock_in_selfie_reason',
        'clock_out_selfie',
        'clock_out_selfie_status',
        'clock_out_selfie_reason',
        // Morning session
        'morning_clock_in',
        'morning_clock_out',
        'morning_hours',
        'morning_clock_in_location',
        'morning_clock_out_location',
        'morning_clock_in_selfie',
        'morning_clock_in_selfie_status',
        'morning_clock_in_selfie_reason',
        'morning_clock_out_selfie',
        'morning_clock_out_selfie_status',
        'morning_clock_out_selfie_reason',
        // Afternoon session
        'afternoon_clock_in',
        'afternoon_clock_out',
        'afternoon_hours',
        'afternoon_clock_in_location',
        'afternoon_clock_out_location',
        'afternoon_clock_in_selfie',
        'afternoon_clock_in_selfie_status',
        'afternoon_clock_in_selfie_reason',
        'afternoon_clock_out_selfie',
        'afternoon_clock_out_selfie_status',
        'afternoon_clock_out_selfie_reason',
    ];

    protected $casts = [
        'attendance_date' => 'date',
        'clock_in' => 'datetime',
        'clock_out' => 'datetime',
        'morning_clock_in' => 'datetime',
        'morning_clock_out' => 'datetime',
        'afternoon_clock_in' => 'datetime',
        'afternoon_clock_out' => 'datetime',
        'hours_worked' => 'decimal:2',
        'overtime_hours' => 'decimal:2',
        'late_hours' => 'decimal:2',
        'morning_hours' => 'decimal:2',
        'afternoon_hours' => 'decimal:2',
        'is_present' => 'boolean',
        'is_holiday' => 'boolean',
        'is_on_leave' => 'boolean',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
