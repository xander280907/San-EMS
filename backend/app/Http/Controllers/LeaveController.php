<?php

namespace App\Http\Controllers;

use App\Models\Leave;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class LeaveController extends Controller
{
    /**
     * Get all leaves
     */
    public function index(Request $request)
    {
        $query = Leave::with(['employee.user', 'leaveType', 'approver']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('leave_type_id')) {
            $query->where('leave_type_id', $request->leave_type_id);
        }

        $leaves = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($leaves);
    }

    /**
     * Create leave request
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        $user = auth()->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['error' => 'Employee record not found'], 404);
        }

        // Calculate days
        $start = Carbon::parse($request->start_date);
        $end = Carbon::parse($request->end_date);
        $daysCount = $start->diffInDays($end) + 1;

        $leave = Leave::create([
            'employee_id' => $employee->id,
            'leave_type_id' => $request->leave_type_id,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'days_count' => $daysCount,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        $leave->load(['employee.user', 'leaveType']);

        return response()->json([
            'message' => 'Leave request submitted successfully',
            'data' => $leave,
        ], 201);
    }

    /**
     * Get single leave
     */
    public function show($id)
    {
        $leave = Leave::with(['employee.user', 'leaveType', 'approver'])->findOrFail($id);
        return response()->json($leave);
    }

    /**
     * Approve leave
     */
    public function approve(Request $request, $id)
    {
        $leave = Leave::findOrFail($id);

        if ($leave->status !== 'pending') {
            return response()->json(['error' => 'Leave request already processed'], 400);
        }

        $leave->status = 'approved';
        $leave->approved_by = auth()->id();
        $leave->approved_at = now();
        $leave->notes = $request->notes ?? null;
        $leave->save();

        $leave->load(['employee.user', 'leaveType', 'approver']);

        return response()->json([
            'message' => 'Leave approved successfully',
            'data' => $leave,
        ]);
    }

    /**
     * Reject leave
     */
    public function reject(Request $request, $id)
    {
        $leave = Leave::findOrFail($id);

        if ($leave->status !== 'pending') {
            return response()->json(['error' => 'Leave request already processed'], 400);
        }

        $leave->status = 'rejected';
        $leave->approved_by = auth()->id();
        $leave->approved_at = now();
        $leave->notes = $request->notes ?? null;
        $leave->save();

        $leave->load(['employee.user', 'leaveType', 'approver']);

        return response()->json([
            'message' => 'Leave rejected',
            'data' => $leave,
        ]);
    }

    /**
     * Delete leave request
     */
    public function destroy($id)
    {
        $leave = Leave::findOrFail($id);
        $user = auth()->user();

        // Only allow deletion if:
        // 1. User is admin (can delete any)
        // 2. User is the employee who created it and status is pending
        // Note: role can be either a string or a Role model object
        $roleName = is_string($user->role) ? $user->role : ($user->role->name ?? null);
        $isAdmin = strtolower($roleName) === 'admin';
        
        // Check ownership only if user has an employee record
        $isOwner = $user->employee && $leave->employee_id === $user->employee->id;
        $isPending = $leave->status === 'pending';

        if (!$isAdmin && (!$isOwner || !$isPending)) {
            return response()->json([
                'error' => 'You are not authorized to delete this leave request'
            ], 403);
        }

        $leave->delete();

        return response()->json([
            'message' => 'Leave request deleted successfully',
        ]);
    }
}
