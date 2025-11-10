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
     * Clock in
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

        // Check if already clocked in today
        /** @var Attendance|null $existingAttendance */
        $existingAttendance = Attendance::where('employee_id', $employee->id)
            ->where('attendance_date', $today)
            ->first();

        if ($existingAttendance) {
            return response()->json(['error' => 'Already clocked in today'], 400);
        }

        /** @var Attendance $attendance */
        $attendance = Attendance::create([
            'employee_id' => $employee->id,
            'attendance_date' => $today,
            'clock_in' => Carbon::now(),
            'clock_in_location' => $request->location ?? null,
            'is_present' => true,
        ]);

        return response()->json([
            'message' => 'Clocked in successfully',
            'data' => $attendance,
        ], 201);
    }

    /**
     * Clock out
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

        /** @var Attendance|null $attendance */
        $attendance = Attendance::where('employee_id', $employee->id)
            ->where('attendance_date', $today)
            ->first();

        if (!$attendance) {
            return response()->json(['error' => 'Not clocked in today'], 400);
        }

        if ($attendance->clock_out) {
            return response()->json(['error' => 'Already clocked out today'], 400);
        }

        $clockOut = Carbon::now();
        $attendance->clock_out = $clockOut;
        $attendance->clock_out_location = $request->location ?? null;

        // Calculate hours worked (in decimal format for precision)
        /** @var \Carbon\Carbon $clockIn */
        $clockIn = Carbon::parse($attendance->clock_in);
        /** @var \DateTimeInterface $clockOut */
        $minutesWorked = $clockIn->diffInMinutes($clockOut);
        $hoursWorked = round($minutesWorked / 60, 2);
        $attendance->hours_worked = $hoursWorked;

        // Calculate overtime (if more than 8 hours)
        if ($hoursWorked > 8) {
            $attendance->overtime_hours = round($hoursWorked - 8, 2);
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
}
