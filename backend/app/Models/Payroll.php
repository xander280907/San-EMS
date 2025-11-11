<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payroll extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_id',
        'payroll_period',
        'pay_date',
        'base_salary',
        'overtime_pay',
        'holiday_pay',
        'allowance',
        'bonus',
        'total_earnings',
        'philhealth',
        'sss',
        'pagibig',
        'withholding_tax',
        'total_deductions',
        'net_pay',
        'status',
        'is_locked',
    ];

    protected $casts = [
        'pay_date' => 'date',
        'base_salary' => 'decimal:2',
        'overtime_pay' => 'decimal:2',
        'holiday_pay' => 'decimal:2',
        'allowance' => 'decimal:2',
        'bonus' => 'decimal:2',
        'total_earnings' => 'decimal:2',
        'philhealth' => 'decimal:2',
        'sss' => 'decimal:2',
        'pagibig' => 'decimal:2',
        'withholding_tax' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'net_pay' => 'decimal:2',
        'is_locked' => 'boolean',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function items()
    {
        return $this->hasMany(PayrollItem::class);
    }
}
