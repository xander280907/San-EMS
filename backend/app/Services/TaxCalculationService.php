<?php

namespace App\Services;

use App\Models\Employee;

class TaxCalculationService
{
    /**
     * Calculate BIR Withholding Tax
     * Based on BIR tables under TRAIN Law
     */
    public function calculateWithholdingTax($monthlyIncome, Employee $employee)
    {
        // Determine if employee has dependents
        $hasDependents = $employee->marital_status === 'married' ? 1 : 0;
        
        // Calculate annual income
        $annualIncome = $monthlyIncome * 12;
        
        // Determine tax bracket
        if ($annualIncome <= 250000) {
            $tax = 0;
        } elseif ($annualIncome <= 400000) {
            $excess = $annualIncome - 250000;
            $tax = $excess * 0.20;
        } elseif ($annualIncome <= 800000) {
            $excess = $annualIncome - 400000;
            $tax = 30000 + ($excess * 0.25);
        } elseif ($annualIncome <= 2000000) {
            $excess = $annualIncome - 800000;
            $tax = 130000 + ($excess * 0.30);
        } elseif ($annualIncome <= 8000000) {
            $excess = $annualIncome - 2000000;
            $tax = 490000 + ($excess * 0.32);
        } else {
            $excess = $annualIncome - 8000000;
            $tax = 2410000 + ($excess * 0.35);
        }

        // Monthly withholding tax
        return $tax / 12;
    }

    /**
     * Calculate 13th month pay
     * Equal to one month's salary
     */
    public function calculateThirteenthMonthPay(Employee $employee)
    {
        return $employee->base_salary;
    }

    /**
     * Calculate holiday pay
     * Based on Philippine labor laws
     */
    public function calculateHolidayPay(Employee $employee, $isRegularHoliday = true)
    {
        // Regular holiday: 200% of daily rate
        // Special holiday: 130% of daily rate
        $dailyRate = $employee->base_salary / 22;
        
        if ($isRegularHoliday) {
            return $dailyRate * 2;
        } else {
            return $dailyRate * 1.3;
        }
    }
}
