<?php

namespace App\Http\Controllers;

use App\Models\Payroll;
use App\Models\Employee;
use App\Services\PayrollService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PayrollController extends Controller
{
    protected $payrollService;

    public function __construct(PayrollService $payrollService)
    {
        $this->payrollService = $payrollService;
    }

    /**
     * Get all payroll records
     */
    public function index(Request $request)
    {
        $query = Payroll::with(['employee.user', 'employee.department']);

        // Filter archived payroll
        if ($request->has('archived') && $request->archived === 'true') {
            $query->onlyTrashed();
        } elseif ($request->has('archived') && $request->archived === 'all') {
            $query->withTrashed();
        }
        // Default: only active (non-archived) payroll

        // Filter by employee
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by period
        if ($request->has('period')) {
            $query->where('payroll_period', $request->period);
        }

        $payrolls = $query->paginate(20);

        return response()->json($payrolls);
    }

    /**
     * Check if payroll already exists for employee in a period
     */
    public function checkDuplicate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'payroll_period' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        $existing = Payroll::where('employee_id', $request->employee_id)
            ->where('payroll_period', $request->payroll_period)
            ->first();

        if ($existing) {
            return response()->json([
                'exists' => true,
                'payroll' => $existing,
                'message' => 'Payroll already exists for this employee in the selected period.',
            ]);
        }

        return response()->json([
            'exists' => false,
            'message' => 'No existing payroll found. You can proceed.',
        ]);
    }

    /**
     * Process payroll for an employee
     */
    public function processPayroll(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'payroll_period' => 'required|string',
            'pay_date' => 'nullable|date',
            'bonus' => 'nullable|numeric',
            'holiday_pay' => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        // Check for duplicate payroll
        $existing = Payroll::where('employee_id', $request->employee_id)
            ->where('payroll_period', $request->payroll_period)
            ->first();

        if ($existing) {
            return response()->json([
                'error' => 'Payroll already exists for this employee in the selected period. Please unlock the existing payroll first if you need to modify it.',
            ], 409);
        }

        $employee = Employee::find($request->employee_id);

        $payroll = $this->payrollService->processPayroll(
            $employee,
            $request->payroll_period,
            [
                'pay_date' => $request->pay_date,
                'bonus' => $request->bonus ?? 0,
                'holiday_pay' => $request->holiday_pay ?? 0,
                'custom_deductions' => $request->custom_deductions ?? [],
            ]
        );

        return response()->json([
            'message' => 'Payroll processed successfully',
            'data' => $payroll,
        ], 201);
    }

    /**
     * Get single payroll record
     */
    public function show($id)
    {
        $payroll = Payroll::with([
            'employee.user',
            'employee.department',
            'items.deductionType'
        ])->findOrFail($id);

        return response()->json($payroll);
    }

    /**
     * Get employee payroll history
     */
    public function getEmployeePayrolls($employeeId)
    {
        $payrolls = Payroll::where('employee_id', $employeeId)
            ->orderBy('payroll_period', 'desc')
            ->paginate(12);

        return response()->json($payrolls);
    }

    /**
     * Generate payslip
     */
    public function generatePayslip($id)
    {
        $payroll = Payroll::findOrFail($id);
        
        $pdf = $this->payrollService->generatePayslip($payroll);
        
        // Generate filename
        $employee = $payroll->employee;
        $employeeName = $employee->user->first_name . '_' . $employee->user->last_name;
        $period = str_replace('-', '_', $payroll->payroll_period);
        $filename = "Payslip_{$employeeName}_{$period}.pdf";

        // Return PDF as stream
        return $pdf->stream($filename);
    }

    /**
     * Unlock payroll (Admin only)
     */
    public function unlockPayroll($id)
    {
        $payroll = Payroll::findOrFail($id);
        
        $payroll->update(['is_locked' => false]);

        return response()->json([
            'message' => 'Payroll unlocked successfully',
            'data' => $payroll,
        ]);
    }

    /**
     * Archive payroll (soft delete)
     */
    public function destroy($id)
    {
        $payroll = Payroll::findOrFail($id);
        $payroll->delete(); // Soft delete

        return response()->json([
            'message' => 'Payroll archived successfully',
        ]);
    }

    /**
     * Restore archived payroll
     */
    public function restore($id)
    {
        $payroll = Payroll::withTrashed()->findOrFail($id);
        $payroll->restore();

        return response()->json([
            'message' => 'Payroll restored successfully',
            'payroll' => $payroll->load(['employee.user', 'employee.department'])
        ]);
    }
}
