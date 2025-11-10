<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;


/**
 * @method middleware(string|array $middleware, array $options = [])
 */
class AuthController extends Controller
{
    /**
     * Create a new AuthController instance.
     */
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['login', 'register']]);
    }

    /**
     * Get a JWT via given credentials.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        $credentials = $request->only(['email', 'password']);

        try {
            if (!$token = JWTAuth::attempt($credentials)) {
                return response()->json(['error' => 'Invalid credentials'], 401);
            }
        } catch (JWTException $e) {
            Log::error('JWT Exception: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'error' => 'Could not create token',
                'message' => $e->getMessage(),
                'file' => config('app.debug') ? $e->getFile() : null,
                'line' => config('app.debug') ? $e->getLine() : null,
            ], 500);
        } catch (\Exception $e) {
            Log::error('Login attempt exception: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'error' => 'Authentication error',
                'message' => $e->getMessage(),
                'file' => config('app.debug') ? $e->getFile() : null,
                'line' => config('app.debug') ? $e->getLine() : null,
            ], 500);
        }

        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json(['error' => 'User not found'], 500);
            }
            
            // Load role relationship
            $user->load('role');
            
            // Get role name
            $roleName = $user->role?->name ?? 'employee';
            
            // Get permissions based on role
            $rolePermissions = [
                'admin' => ['*'],
                'hr' => ['employees', 'payroll', 'attendance', 'leaves', 'departments', 'announcements', 'dashboard'],
                'employee' => ['attendance', 'leaves', 'profile', 'myPayslips', 'dashboard'],
            ];
            
            $permissions = $rolePermissions[$roleName] ?? [];
            
            // Load employee with department - may be null for admin/HR users (that's okay)
            $employee = null;
            if (!$user->relationLoaded('employee')) {
                try {
                    $user->load('employee.department');
                } catch (\Exception $e) {
                    // If loading fails, try loading employee without department
                    try {
                        $user->load('employee');
                        if ($user->employee) {
                            $user->employee->load('department');
                        }
                    } catch (\Exception $e2) {
                        // Employee doesn't exist - that's fine for admin/HR
                        Log::debug('Employee relationship not found for user: ' . $user->id);
                    }
                }
            }
            $employee = $user->employee;

            // Get TTL safely - config returns minutes, convert to seconds
            $ttl = config('jwt.ttl', 60) * 60;
            
            return response()->json([
                'token' => $token,
                'token_type' => 'bearer',
                'expires_in' => $ttl,
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'middle_name' => $user->middle_name,
                    'phone' => $user->phone,
                    'employee_code' => $user->employee_code,
                    'profile_picture' => $user->profile_picture,
                    'role' => $roleName,
                    'department' => $user->department,
                    'position' => $user->position,
                    'permissions' => $permissions,
                    'employee' => $employee ? [
                        'id' => $employee->id,
                        'employee_number' => $employee->employee_number ?? null,
                        'department' => ($employee->department ?? null) ? $employee->department->name : null,
                        'position' => $employee->position ?? null,
                    ] : null,
                ],
            ]);
        } catch (\Exception $e) {
            $user = auth()->user();
            $userId = $user ? $user->id : null;
            $errorDetails = [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                'user_id' => $userId,
            ];
            
            Log::error('Login error', $errorDetails);
            
            // Always return detailed error in development
            $isDebug = config('app.debug', false);
            
            return response()->json([
                'error' => 'An error occurred during login. Please try again.',
                'message' => $e->getMessage(),
                'file' => $isDebug ? $e->getFile() : null,
                'line' => $isDebug ? $e->getLine() : null,
                'class' => $isDebug ? get_class($e) : null,
                'trace' => $isDebug ? $e->getTraceAsString() : null,
            ], 500);
        }
    }

    /**
     * Register a new user.
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'first_name' => 'required|string|max:50',
            'last_name' => 'required|string|max:50',
            'role_id' => 'required|exists:roles,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        $user = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'middle_name' => $request->middle_name ?? null,
            'phone' => $request->phone ?? null,
            'role_id' => $request->role_id,
            'email_verified_at' => now(),
        ]);

        // Auto-create employee record for the user
        try {
            \App\Models\Employee::create([
                'user_id' => $user->id,
                'employee_number' => 'EMP-' . str_pad($user->id, 6, '0', STR_PAD_LEFT),
                'department_id' => null, // To be assigned later
                'position' => null, // To be assigned later
                'employment_type' => null,
                'hire_date' => now(),
                'base_salary' => null,
                'status' => 'active',
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to create employee record for user: ' . $user->id, [
                'error' => $e->getMessage()
            ]);
        }

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'message' => 'User created successfully',
            'token' => $token,
            'user' => $user,
        ], 201);
    }

    /**
     * Get the authenticated User.
     */
    public function me()
    {
        try {
            $user = auth()->user();
            
            // Load role relationship
            $user->load('role');
            
            // Get role name
            $roleName = $user->role?->name ?? 'employee';
            
            // Get permissions based on role
            $rolePermissions = [
                'admin' => ['*'],
                'hr' => ['employees', 'payroll', 'attendance', 'leaves', 'departments', 'announcements', 'dashboard'],
                'employee' => ['attendance', 'leaves', 'profile', 'myPayslips', 'dashboard'],
            ];
            
            $permissions = $rolePermissions[$roleName] ?? [];
            
            // Load employee and department separately if employee exists
            if ($user->employee) {
                $user->load('employee.department');
            }
            
            $employee = $user->employee;
            
            return response()->json([
                'id' => $user->id,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'middle_name' => $user->middle_name,
                'phone' => $user->phone,
                'employee_code' => $user->employee_code,
                'profile_picture' => $user->profile_picture,
                'role' => $roleName,
                'department' => $user->department,
                'position' => $user->position,
                'date_hired' => $user->date_hired,
                'permissions' => $permissions,
                'employee' => $employee,
            ]);
        } catch (\Exception $e) {
            Log::error('Me endpoint error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => auth()->id(),
            ]);
            return response()->json([
                'error' => 'An error occurred. Please try again.',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request)
    {
        try {
            $user = auth()->user();
            
            Log::info('Profile update request received', [
                'user_id' => $user->id,
                'user_role' => $user->role?->name,
                'has_file' => $request->hasFile('profile_picture'),
                'request_method' => $request->method(),
                'all_keys' => array_keys($request->all())
            ]);
            
            // Get only the fields we want to validate (exclude _method)
            $dataToValidate = $request->only([
                'first_name', 
                'last_name', 
                'middle_name', 
                'phone', 
                'profile_picture'
            ]);
            
            $validator = Validator::make($dataToValidate, [
                'first_name' => 'nullable|string|max:255',
                'last_name' => 'nullable|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20',
                'profile_picture' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:5120', // 5MB max
            ]);

            if ($validator->fails()) {
                Log::error('Profile update validation failed', [
                    'errors' => $validator->errors()->toArray(),
                    'user_id' => $user->id
                ]);
                return response()->json([
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Prepare data to update
            $updateData = [];
            
            // Update individual name fields
            if ($request->filled('first_name')) {
                $updateData['first_name'] = $request->first_name;
            }
            if ($request->filled('last_name')) {
                $updateData['last_name'] = $request->last_name;
            }
            if ($request->has('middle_name')) {
                $updateData['middle_name'] = $request->middle_name;
            }
            if ($request->has('phone')) {
                $updateData['phone'] = $request->phone;
            }

            // Handle profile picture upload
            if ($request->hasFile('profile_picture')) {
                try {
                    $file = $request->file('profile_picture');
                    $uploadPath = public_path('uploads/profiles');
                    
                    // Create directory if it doesn't exist
                    if (!file_exists($uploadPath)) {
                        mkdir($uploadPath, 0755, true);
                    }
                    
                    $fileName = 'user_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
                    $file->move($uploadPath, $fileName);
                    $updateData['profile_picture'] = '/uploads/profiles/' . $fileName;
                } catch (\Exception $e) {
                    Log::error('Profile picture upload error: ' . $e->getMessage());
                    return response()->json([
                        'error' => 'Failed to upload profile picture',
                        'message' => config('app.debug') ? $e->getMessage() : null,
                    ], 500);
                }
            }

            // Update user with prepared data
            if (!empty($updateData)) {
                Log::info('Updating user profile', [
                    'user_id' => $user->id,
                    'fields' => array_keys($updateData)
                ]);
                $user->update($updateData);
            } else {
                Log::info('No data to update for user profile', [
                    'user_id' => $user->id
                ]);
            }

            // Refresh the user model to get updated data
            $user->refresh();
            
            // Load role relationship
            $user->load('role');
            
            // Get role name
            $roleName = $user->role?->name ?? 'employee';
            
            // Get permissions based on role
            $rolePermissions = [
                'admin' => ['*'],
                'hr' => ['employees', 'payroll', 'attendance', 'leaves', 'departments', 'announcements', 'dashboard'],
                'employee' => ['attendance', 'leaves', 'profile', 'myPayslips', 'dashboard'],
            ];
            
            $permissions = $rolePermissions[$roleName] ?? [];
            
            // Load employee and department separately if employee exists
            $employee = null;
            try {
                if ($user->employee) {
                    $user->load('employee.department');
                    $employee = $user->employee;
                }
            } catch (\Exception $e) {
                Log::warning('Could not load employee relationship', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage()
                ]);
                // Employee might not exist for admin/HR - that's okay
            }

            return response()->json([
                'message' => 'Profile updated successfully',
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'middle_name' => $user->middle_name,
                    'phone' => $user->phone,
                    'employee_code' => $user->employee_code,
                    'profile_picture' => $user->profile_picture,
                    'role' => $roleName,
                    'department' => $user->department,
                    'position' => $user->position,
                    'date_hired' => $user->date_hired,
                    'permissions' => $permissions,
                    'employee' => $employee,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Profile update error: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return response()->json([
                'error' => 'Failed to update profile',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred while updating your profile',
                'debug' => config('app.debug') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString()
                ] : null,
            ], 500);
        }
    }

    /**
     * Log the user out (Invalidate the token).
     */
    public function logout()
    {
        JWTAuth::invalidate(JWTAuth::getToken());

        return response()->json(['message' => 'Successfully logged out']);
    }

    /**
     * Refresh a token.
     */
    public function refresh()
    {
        $token = JWTAuth::refresh(JWTAuth::getToken());

        return response()->json([
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl', 60) * 60,
        ]);
    }
}
