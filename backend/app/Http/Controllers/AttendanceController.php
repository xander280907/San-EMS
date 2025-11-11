<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    /**
     * Clock in (supports morning and afternoon sessions)
     */
    public function clockIn(Request $request)
    {
        /** @var User|null $user */
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        /** @var Employee|null $employee */
        $employee = $user->employee;
        
        if (!$employee) {
            return response()->json(['error' => 'Employee record not found'], 404);
        }

        $today = Carbon::today();
        $session = $request->input('session', 'morning'); // 'morning' or 'afternoon'

        // Get or create today's attendance record
        /** @var Attendance|null $attendance */
        $attendance = Attendance::where('employee_id', $employee->id)
            ->where('attendance_date', $today)
            ->first();

        if (!$attendance) {
            $attendance = new Attendance([
                'employee_id' => $employee->id,
                'attendance_date' => $today,
                'is_present' => true,
            ]);
        }

        // Check session and clock in
        if ($session === 'morning') {
            if ($attendance->morning_clock_in) {
                return response()->json(['error' => 'Already clocked in for morning session'], 400);
            }
            $attendance->morning_clock_in = Carbon::now();
            $attendance->morning_clock_in_location = $request->location ?? null;
            $attendance->morning_clock_in_selfie = $request->selfie ?? null;
            // Also set main clock_in for backward compatibility
            if (!$attendance->clock_in) {
                $attendance->clock_in = Carbon::now();
                $attendance->clock_in_location = $request->location ?? null;
                $attendance->clock_in_selfie = $request->selfie ?? null;
            }
        } elseif ($session === 'afternoon') {
            if ($attendance->afternoon_clock_in) {
                return response()->json(['error' => 'Already clocked in for afternoon session'], 400);
            }
            $attendance->afternoon_clock_in = Carbon::now();
            $attendance->afternoon_clock_in_location = $request->location ?? null;
            $attendance->afternoon_clock_in_selfie = $request->selfie ?? null;
        } else {
            return response()->json(['error' => 'Invalid session type. Use "morning" or "afternoon"'], 400);
        }

        $attendance->save();

        return response()->json([
            'message' => ucfirst($session) . ' clock-in successful',
            'data' => $attendance,
        ], 201);
    }

    /**
     * Clock out (supports morning and afternoon sessions)
     */
    public function clockOut(Request $request)
    {
        /** @var User|null $user */
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        /** @var Employee|null $employee */
        $employee = $user->employee;
        
        if (!$employee) {
            return response()->json(['error' => 'Employee record not found'], 404);
        }

        $today = Carbon::today();
        $session = $request->input('session', 'morning'); // 'morning' or 'afternoon'

        /** @var Attendance|null $attendance */
        $attendance = Attendance::where('employee_id', $employee->id)
            ->where('attendance_date', $today)
            ->first();

        if (!$attendance) {
            return response()->json(['error' => 'Not clocked in today'], 400);
        }

        $clockOut = Carbon::now();

        // Handle session-based clock out
        if ($session === 'morning') {
            if (!$attendance->morning_clock_in) {
                return response()->json(['error' => 'Not clocked in for morning session'], 400);
            }
            if ($attendance->morning_clock_out) {
                return response()->json(['error' => 'Already clocked out for morning session'], 400);
            }
            $attendance->morning_clock_out = $clockOut;
            $attendance->morning_clock_out_location = $request->location ?? null;
            $attendance->morning_clock_out_selfie = $request->selfie ?? null;
            
            // Calculate morning hours
            $clockIn = Carbon::parse($attendance->morning_clock_in);
            $minutesWorked = $clockIn->diffInMinutes($clockOut);
            $attendance->morning_hours = round($minutesWorked / 60, 2);
            
        } elseif ($session === 'afternoon') {
            if (!$attendance->afternoon_clock_in) {
                return response()->json(['error' => 'Not clocked in for afternoon session'], 400);
            }
            if ($attendance->afternoon_clock_out) {
                return response()->json(['error' => 'Already clocked out for afternoon session'], 400);
            }
            $attendance->afternoon_clock_out = $clockOut;
            $attendance->afternoon_clock_out_location = $request->location ?? null;
            $attendance->afternoon_clock_out_selfie = $request->selfie ?? null;
            
            // Calculate afternoon hours
            $clockIn = Carbon::parse($attendance->afternoon_clock_in);
            $minutesWorked = $clockIn->diffInMinutes($clockOut);
            $attendance->afternoon_hours = round($minutesWorked / 60, 2);
            
            // Also set main clock_out for backward compatibility
            $attendance->clock_out = $clockOut;
            $attendance->clock_out_location = $request->location ?? null;
            $attendance->clock_out_selfie = $request->selfie ?? null;
        } else {
            return response()->json(['error' => 'Invalid session type. Use "morning" or "afternoon"'], 400);
        }

        // Calculate total hours worked from both sessions
        $totalHours = $attendance->morning_hours + $attendance->afternoon_hours;
        $attendance->hours_worked = round($totalHours, 2);

        // Calculate overtime (if more than 8 hours total)
        if ($totalHours > 8) {
            $attendance->overtime_hours = round($totalHours - 8, 2);
        }

        $attendance->save();

        return response()->json([
            'message' => 'Clocked out successfully',
            'data' => $attendance,
        ]);
    }

    /**
     * Get attendance records
     */
    public function index(Request $request)
    {
        /** @var \Illuminate\Database\Eloquent\Builder $query */
        $query = Attendance::with(['employee.user']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->has('date_from') && $request->has('date_to')) {
            $query->whereBetween('attendance_date', [
                $request->date_from,
                $request->date_to
            ]);
        }

        $attendances = $query->paginate(20);

        return response()->json($attendances);
    }

    /**
     * Get employee attendance
     */
    public function getEmployeeAttendance($id)
    {
        $attendances = Attendance::where('employee_id', $id)
            ->orderBy('attendance_date', 'desc')
            ->paginate(30);

        return response()->json($attendances);
    }

    /**
     * Get today's attendance stats
     */
    public function todayStats()
    {
        $today = Carbon::today();
        
        // Get all active employees (status = 'active')
        $totalActiveEmployees = Employee::where('status', 'active')->count();
        
        // Get today's attendance records with clock_in
        $todayAttendances = Attendance::where('attendance_date', $today)
            ->whereNotNull('clock_in')
            ->get();
        
        // Count present (has clock_in)
        $presentToday = $todayAttendances->count();
        
        // Count late arrivals (clock_in after 9:00 AM)
        $lateToday = $todayAttendances->filter(function ($attendance) {
            $clockIn = Carbon::parse($attendance->clock_in);
            return $clockIn->hour > 9 || ($clockIn->hour === 9 && $clockIn->minute > 0);
        })->count();
        
        // Calculate total hours worked today
        $totalHoursToday = $todayAttendances->sum(function ($attendance) {
            if ($attendance->clock_out && $attendance->hours_worked) {
                return (float) $attendance->hours_worked;
            }
            // If clocked out but hours not calculated, calculate it
            if ($attendance->clock_out) {
                $clockIn = Carbon::parse($attendance->clock_in);
                $clockOut = Carbon::parse($attendance->clock_out);
                $minutesWorked = $clockIn->diffInMinutes($clockOut);
                return round($minutesWorked / 60, 2);
            }
            return 0;
        });
        
        // Count absences (active employees who haven't clocked in today)
        $absences = $totalActiveEmployees - $presentToday;
        
        return response()->json([
            'data' => [
                'presentToday' => $presentToday,
                'lateToday' => $lateToday,
                'totalHoursToday' => round($totalHoursToday, 2),
                'absences' => max(0, $absences), // Ensure non-negative
                'totalActiveEmployees' => $totalActiveEmployees,
                'lastUpdated' => Carbon::now()->toIso8601String(),
            ]
        ]);
    }

    /**
     * Approve selfie verification
     */
    public function approveSelfie(Request $request, $id)
    {
        $attendance = Attendance::findOrFail($id);
        $sessionType = $request->input('session_type'); // e.g., 'morning_clock_in', 'afternoon_clock_out'
        
        if (!$sessionType) {
            return response()->json(['error' => 'Session type is required'], 400);
        }
        
        $statusField = $sessionType . '_selfie_status';
        
        // Validate field exists
        if (!in_array($statusField, $attendance->getFillable())) {
            return response()->json(['error' => 'Invalid session type'], 400);
        }
        
        $attendance->$statusField = 'approved';
        $attendance->save();
        
        return response()->json([
            'message' => 'Selfie approved successfully',
            'data' => $attendance
        ]);
    }

    /**
     * Reject selfie verification
     */
    public function rejectSelfie(Request $request, $id)
    {
        $attendance = Attendance::findOrFail($id);
        $sessionType = $request->input('session_type'); // e.g., 'morning_clock_in', 'afternoon_clock_out'
        $reason = $request->input('reason');
        
        if (!$sessionType) {
            return response()->json(['error' => 'Session type is required'], 400);
        }
        
        if (!$reason) {
            return response()->json(['error' => 'Rejection reason is required'], 400);
        }
        
        $statusField = $sessionType . '_selfie_status';
        $reasonField = $sessionType . '_selfie_reason';
        
        // Validate field exists
        if (!in_array($statusField, $attendance->getFillable())) {
            return response()->json(['error' => 'Invalid session type'], 400);
        }
        
        $attendance->$statusField = 'rejected';
        $attendance->$reasonField = $reason;
        $attendance->save();
        
        return response()->json([
            'message' => 'Selfie rejected successfully',
            'data' => $attendance
        ]);
    }
}
