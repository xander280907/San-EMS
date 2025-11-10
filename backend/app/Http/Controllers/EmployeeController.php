<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EmployeeController extends Controller
{
    /**
     * Get all employees
     */
    public function index(Request $request)
    {
        $query = Employee::with(['user', 'department']);

        // Filter by department
        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $employees = $query->paginate(20);

        return response()->json($employees);
    }

    /**
     * Create new employee
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6',
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'employee_number' => 'required|unique:employees',
            'department_id' => 'required|exists:departments,id',
            'position' => 'required|string',
            'employment_type' => 'required|in:full-time,part-time,contract,probationary',
            'hire_date' => 'required|date',
            'base_salary' => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        // Get employee role
        $employeeRole = Role::where('name', 'employee')->first();
        if (!$employeeRole) {
            return response()->json(['error' => 'Employee role not found'], 500);
        }

        // Create user
        $user = User::create([
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'middle_name' => $request->middle_name ?? null,
            'phone' => $request->phone ?? null,
            'role_id' => $employeeRole->id,
            'email_verified_at' => now(),
        ]);

        // Create employee
        $employee = Employee::create([
            'user_id' => $user->id,
            'employee_number' => $request->employee_number,
            'department_id' => $request->department_id,
            'position' => $request->position,
            'employment_type' => $request->employment_type,
            'hire_date' => $request->hire_date,
            'base_salary' => $request->base_salary,
            'allowance' => $request->allowance ?? 0,
            'sss_number' => $request->sss_number ?? null,
            'philhealth_number' => $request->philhealth_number ?? null,
            'pagibig_number' => $request->pagibig_number ?? null,
            'tin_number' => $request->tin_number ?? null,
            'address' => $request->address ?? null,
            'gender' => $request->gender ?? null,
            'birth_date' => $request->birth_date ?? null,
            'marital_status' => $request->marital_status ?? null,
            'status' => $request->status ?? 'active',
        ]);

        $employee->load(['user', 'department']);

        return response()->json($employee, 201);
    }

    /**
     * Get single employee
     */
    public function show($id)
    {
        $employee = Employee::with(['user', 'department'])->findOrFail($id);
        return response()->json($employee);
    }

    /**
     * Update employee
     */
    public function update(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'department_id' => 'exists:departments,id',
            'employment_type' => 'in:full-time,part-time,contract,probationary',
            'base_salary' => 'numeric',
            'profile_picture' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:5120', // 5MB max
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        // Prepare update data
        // Note: hire_date is intentionally excluded - it should remain unchanged once set
        $updateData = $request->only([
            'department_id', 'position', 'employment_type', 'base_salary',
            'allowance', 'sss_number', 'philhealth_number', 'pagibig_number',
            'tin_number', 'address', 'gender', 'birth_date', 'marital_status',
            'emergency_contact_name', 'emergency_contact_phone', 'status'
        ]);

        // Handle profile picture upload
        if ($request->hasFile('profile_picture')) {
            try {
                $file = $request->file('profile_picture');
                $uploadPath = public_path('uploads/profiles');
                
                // Create directory if it doesn't exist
                if (!file_exists($uploadPath)) {
                    mkdir($uploadPath, 0755, true);
                }
                
                $fileName = 'profile_' . $employee->id . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move($uploadPath, $fileName);
                $updateData['profile_picture'] = '/uploads/profiles/' . $fileName;
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Employee profile picture upload error: ' . $e->getMessage());
                return response()->json([
                    'error' => 'Failed to upload profile picture',
                    'message' => config('app.debug') ? $e->getMessage() : null,
                ], 500);
            }
        }

        $employee->update($updateData);

        // Update user fields if provided
        if ($request->has('first_name') || $request->has('last_name') || $request->has('middle_name') || $request->has('phone')) {
            $userUpdateData = $request->only(['first_name', 'last_name', 'phone', 'middle_name']);
            $employee->user->update($userUpdateData);
        }

        $employee->load(['user', 'department']);

        return response()->json($employee);
    }

    /**
     * Delete employee
     */
    public function destroy($id)
    {
        $employee = Employee::findOrFail($id);
        $employee->user->delete();
        $employee->delete();

        return response()->json(['message' => 'Employee deleted successfully']);
    }
}
