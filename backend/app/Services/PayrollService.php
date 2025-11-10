<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Payroll;
use App\Models\PayrollItem;
use App\Models\DeductionType;
use App\Models\Attendance;
use App\Services\TaxCalculationService;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class PayrollService
{
    protected $taxService;

    public function __construct(TaxCalculationService $taxService)
    {
        $this->taxService = $taxService;
    }

    /**
     * Process payroll for an employee
     */
    public function processPayroll(Employee $employee, string $payrollPeriod, array $additionalData = [])
    {
        // Calculate earnings
        $baseSalary = $employee->base_salary;
        $allowance = $employee->allowance ?? 0;
        $overtimePay = $this->calculateOvertimePay($employee, $payrollPeriod);
        $holidayPay = $additionalData['holiday_pay'] ?? 0;
        $bonus = $additionalData['bonus'] ?? 0;

        $totalEarnings = $baseSalary + $allowance + $overtimePay + $holidayPay + $bonus;

        // Calculate Philippine standard deductions
        $philhealth = $this->calculatePhilHealth($totalEarnings);
        $sss = $this->calculateSSS($baseSalary);
        $pagibig = $this->calculatePagIbig($baseSalary);
        $withholdingTax = $this->taxService->calculateWithholdingTax($totalEarnings, $employee);

        $totalDeductions = $philhealth + $sss + $pagibig + $withholdingTax;

        // Calculate net pay
        $netPay = $totalEarnings - $totalDeductions;

        // Create payroll record
        $payroll = Payroll::create([
            'employee_id' => $employee->id,
            'payroll_period' => $payrollPeriod,
            'pay_date' => $additionalData['pay_date'] ?? now()->endOfMonth(),
            'base_salary' => $baseSalary,
            'overtime_pay' => $overtimePay,
            'holiday_pay' => $holidayPay,
            'allowance' => $allowance,
            'bonus' => $bonus,
            'total_earnings' => $totalEarnings,
            'philhealth' => $philhealth,
            'sss' => $sss,
            'pagibig' => $pagibig,
            'withholding_tax' => $withholdingTax,
            'total_deductions' => $totalDeductions,
            'net_pay' => $netPay,
            'status' => 'processed',
            'is_locked' => true, // Lock payroll after processing to prevent duplicates
        ]);

        // Add custom deductions if any
        if (isset($additionalData['custom_deductions'])) {
            foreach ($additionalData['custom_deductions'] as $deduction) {
                PayrollItem::create([
                    'payroll_id' => $payroll->id,
                    'deduction_type_id' => $deduction['type_id'] ?? null,
                    'item_type' => 'deduction',
                    'description' => $deduction['description'],
                    'amount' => $deduction['amount'],
                ]);
            }
        }

        return $payroll;
    }

    /**
     * Calculate PhilHealth contribution
     * Based on 2024 PhilHealth circular, 2% shared equally by employer and employee
     */
    private function calculatePhilHealth($monthlyIncome)
    {
        // PhilHealth contribution rates
        $rates = [
            ['min' => 0, 'max' => 10000, 'rate' => 0.01],           // 1%
            ['min' => 10000.01, 'max' => 80000, 'rate' => 0.02],    // 2%
            ['min' => 80000.01, 'max' => 999999, 'rate' => 1600],   // Fixed 1600
        ];

        $contribution = 0;

        foreach ($rates as $rate) {
            if ($monthlyIncome >= $rate['min'] && $monthlyIncome <= $rate['max']) {
                if (is_numeric($rate['rate'])) {
                    $contribution = $rate['rate'];
                    if ($rate['rate'] < 1) {
                        $contribution = $monthlyIncome * $rate['rate'];
                    }
                }
                break;
            }
        }

        // Employee share is 50% of total contribution
        return $contribution / 2;
    }

    /**
     * Calculate SSS contribution
     * Based on SSS contribution schedule
     */
    private function calculateSSS($monthlySalary)
    {
        // SSS contribution table (2024)
        $sssRanges = [
            ['min' => 0, 'max' => 4250, 'ee_share' => 170.00],
            ['min' => 4250.01, 'max' => 4749.99, 'ee_share' => 180.00],
            ['min' => 4750.00, 'max' => 5249.99, 'ee_share' => 190.00],
            ['min' => 5250.00, 'max' => 5749.99, 'ee_share' => 200.00],
            ['min' => 5750.00, 'max' => 6249.99, 'ee_share' => 210.00],
            ['min' => 6250.00, 'max' => 6749.99, 'ee_share' => 220.00],
            ['min' => 6750.00, 'max' => 7249.99, 'ee_share' => 230.00],
            ['min' => 7250.00, 'max' => 7749.99, 'ee_share' => 240.00],
            ['min' => 7750.00, 'max' => 8249.99, 'ee_share' => 250.00],
            ['min' => 8250.00, 'max' => 8749.99, 'ee_share' => 260.00],
            ['min' => 8750.00, 'max' => 9249.99, 'ee_share' => 270.00],
            ['min' => 9250.00, 'max' => 9749.99, 'ee_share' => 280.00],
            ['min' => 9750.00, 'max' => 10249.99, 'ee_share' => 290.00],
            ['min' => 10250.00, 'max' => 10749.99, 'ee_share' => 300.00],
            ['min' => 10750.00, 'max' => 11249.99, 'ee_share' => 310.00],
            ['min' => 11250.00, 'max' => 11749.99, 'ee_share' => 320.00],
            ['min' => 11750.00, 'max' => 12249.99, 'ee_share' => 330.00],
            ['min' => 12250.00, 'max' => 12749.99, 'ee_share' => 340.00],
            ['min' => 12750.00, 'max' => 13249.99, 'ee_share' => 350.00],
            ['min' => 13250.00, 'max' => 13749.99, 'ee_share' => 360.00],
            ['min' => 13750.00, 'max' => 14249.99, 'ee_share' => 370.00],
            ['min' => 14250.00, 'max' => 14749.99, 'ee_share' => 380.00],
            ['min' => 14750.00, 'max' => 15249.99, 'ee_share' => 390.00],
            ['min' => 15250.00, 'max' => 15749.99, 'ee_share' => 400.00],
            ['min' => 15750.00, 'max' => 16249.99, 'ee_share' => 410.00],
            ['min' => 16250.00, 'max' => 16749.99, 'ee_share' => 420.00],
            ['min' => 16750.00, 'max' => 17249.99, 'ee_share' => 430.00],
            ['min' => 17250.00, 'max' => 17749.99, 'ee_share' => 440.00],
            ['min' => 17750.00, 'max' => 18249.99, 'ee_share' => 450.00],
            ['min' => 18250.00, 'max' => 18749.99, 'ee_share' => 460.00],
            ['min' => 18750.00, 'max' => 19249.99, 'ee_share' => 470.00],
            ['min' => 19250.00, 'max' => 19749.99, 'ee_share' => 480.00],
            ['min' => 19750.00, 'max' => 20249.99, 'ee_share' => 490.00],
            ['min' => 20250.00, 'max' => 20749.99, 'ee_share' => 500.00],
            ['min' => 20750.00, 'max' => 999999.00, 'ee_share' => 500.00],
        ];

        foreach ($sssRanges as $range) {
            if ($monthlySalary >= $range['min'] && $monthlySalary <= $range['max']) {
                return $range['ee_share'];
            }
        }

        return 500.00; // Maximum contribution
    }

    /**
     * Calculate Pag-IBIG contribution
     * Based on Pag-IBIG rates
     */
    private function calculatePagIbig($monthlySalary)
    {
        // Pag-IBIG contribution (2024)
        // Up to 1,500: 1% each for employee and employer
        // Above 1,500: 2% each for employee and employer
        if ($monthlySalary <= 1500) {
            return $monthlySalary * 0.01;
        } else {
            return $monthlySalary * 0.02;
        }
    }

    /**
     * Calculate overtime pay
     * Based on Philippine labor law: 125% of hourly rate
     */
    private function calculateOvertimePay(Employee $employee, string $payrollPeriod)
    {
        $period = Carbon::parse($payrollPeriod . '-01');
        $startDate = $period->copy()->startOfMonth();
        $endDate = $period->copy()->endOfMonth();

        // Get attendance records for the period
        $attendances = Attendance::where('employee_id', $employee->id)
            ->whereBetween('attendance_date', [$startDate, $endDate])
            ->sum('overtime_hours');

        // Calculate hourly rate (assuming 8 hours per day, 22 working days per month)
        $hoursPerMonth = 8 * 22;
        $hourlyRate = $employee->base_salary / $hoursPerMonth;

        // Overtime rate is 125% of hourly rate
        $overtimeRate = $hourlyRate * 1.25;

        return $attendances * $overtimeRate;
    }

    /**
     * Generate payslip PDF
     */
    public function generatePayslip(Payroll $payroll)
    {
        $employee = $payroll->employee->load('user', 'department');
        $customDeductions = PayrollItem::where('payroll_id', $payroll->id)
            ->where('item_type', '!=', 'earning')
            ->get();

        $data = [
            'payroll' => $payroll,
            'employee' => $employee,
            'custom_deductions' => $customDeductions,
        ];

        // Generate PDF using the payslip view
        $pdf = Pdf::loadView('payslip', $data);
        
        // Set paper size and orientation
        $pdf->setPaper('a4', 'portrait');

        return $pdf;
    }
}
