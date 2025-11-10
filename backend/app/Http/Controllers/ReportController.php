<?php

namespace App\Http\Controllers;

use App\Models\Payroll;
use App\Models\Attendance;
use App\Models\Leave;
use App\Models\Department;
use App\Models\Employee;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Generate payroll report
     */
    public function payrollReport(Request $request)
    {
        $validator = $request->validate([
            'period' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
        ]);

        $query = Payroll::with(['employee.user', 'employee.department']);

        if ($request->filled('period')) {
            $query->where('payroll_period', $request->period);
        }

        if ($request->filled('department_id')) {
            $query->whereHas('employee', function($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        $payrolls = $query->orderBy('payroll_period', 'desc')
                          ->orderBy('id', 'desc')
                          ->get();

        $summary = [
            'total_employees' => $payrolls->count(),
            'total_earnings' => $payrolls->sum('total_earnings'),
            'total_deductions' => $payrolls->sum('total_deductions'),
            'total_net_pay' => $payrolls->sum('net_pay'),
            'total_philhealth' => $payrolls->sum('philhealth'),
            'total_sss' => $payrolls->sum('sss'),
            'total_pagibig' => $payrolls->sum('pagibig'),
            'total_tax' => $payrolls->sum('withholding_tax'),
        ];

        return response()->json([
            'summary' => $summary,
            'data' => $payrolls,
        ]);
    }

    /**
     * Generate attendance report
     */
    public function attendanceReport(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'department_id' => 'nullable|exists:departments,id',
        ]);

        $query = Attendance::with(['employee.user', 'employee.department']);

        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('attendance_date', [
                $request->date_from,
                $request->date_to
            ]);
        }

        if ($request->filled('department_id')) {
            $query->whereHas('employee', function($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        $attendances = $query->orderBy('attendance_date', 'desc')
                             ->orderBy('id', 'desc')
                             ->get();

        // Transform data for frontend compatibility
        $transformedData = $attendances->map(function($attendance) {
            try {
                // Handle time formatting safely
                $timeIn = null;
                $timeOut = null;
                
                if ($attendance->clock_in) {
                    $timeIn = is_string($attendance->clock_in) ? 
                        $attendance->clock_in : 
                        $attendance->clock_in->format('H:i:s');
                }
                
                if ($attendance->clock_out) {
                    $timeOut = is_string($attendance->clock_out) ? 
                        $attendance->clock_out : 
                        $attendance->clock_out->format('H:i:s');
                }
                
                // Handle attendance date safely
                $attendanceDate = $attendance->attendance_date;
                if (is_object($attendanceDate) && method_exists($attendanceDate, 'format')) {
                    $attendanceDate = $attendanceDate->format('Y-m-d');
                } elseif (!is_string($attendanceDate)) {
                    $attendanceDate = (string) $attendanceDate;
                }
                
                return [
                    'id' => $attendance->id,
                    'employee' => $attendance->employee,
                    'attendance_date' => $attendanceDate,
                    'time_in' => $timeIn,
                    'time_out' => $timeOut,
                    'hours_worked' => (float) $attendance->hours_worked ?? 0,
                    'overtime_hours' => (float) $attendance->overtime_hours ?? 0,
                    'late_hours' => (float) $attendance->late_hours ?? 0,
                    'is_present' => (bool) $attendance->is_present ?? false,
                ];
            } catch (\Exception $e) {
                \Log::error('Error transforming attendance data: ' . $e->getMessage(), [
                    'attendance_id' => $attendance->id ?? 'unknown'
                ]);
                return null;
            }
        })->filter(); // Remove any null entries from failed transformations

        $summary = [
            'total_records' => $attendances->count(),
            'total_hours_worked' => $attendances->sum('hours_worked'),
            'total_overtime_hours' => $attendances->sum('overtime_hours'),
            'total_late_hours' => $attendances->sum('late_hours'),
            'present_days' => $attendances->where('is_present', true)->count(),
        ];

        return response()->json([
            'summary' => $summary,
            'data' => $transformedData,
        ]);
    }

    /**
     * Generate leave report
     */
    public function leaveReport(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'status' => 'nullable|in:pending,approved,rejected,cancelled',
            'leave_type_id' => 'nullable|exists:leave_types,id',
        ]);

        $query = Leave::with(['employee.user', 'leaveType', 'approver']);

        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('start_date', [
                $request->date_from,
                $request->date_to
            ]);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('leave_type_id')) {
            $query->where('leave_type_id', $request->leave_type_id);
        }

        $leaves = $query->orderBy('start_date', 'desc')
                        ->orderBy('id', 'desc')
                        ->get();

        $summary = [
            'total_requests' => $leaves->count(),
            'total_days' => $leaves->sum('days_count'),
            'approved' => $leaves->where('status', 'approved')->count(),
            'pending' => $leaves->where('status', 'pending')->count(),
            'rejected' => $leaves->where('status', 'rejected')->count(),
        ];

        return response()->json([
            'summary' => $summary,
            'data' => $leaves,
        ]);
    }

    /**
     * Generate department report
     */
    public function departmentReport(Request $request)
    {
        $request->validate([
            'department_id' => 'nullable|exists:departments,id',
        ]);

        $query = Department::with('employees');

        if ($request->filled('department_id')) {
            $query->where('id', $request->department_id);
        }

        $departments = $query->get()->map(function($dept) {
            return [
                'id' => $dept->id,
                'name' => $dept->name,
                'total_employees' => $dept->employees->count(),
                'active_employees' => $dept->employees->where('status', 'active')->count(),
            ];
        });

        return response()->json([
            'departments' => $departments,
        ]);
    }
}
