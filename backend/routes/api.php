<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\RecruitmentController;
use App\Http\Controllers\ReportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Public recruitment routes (no authentication required)
Route::prefix('recruitment')->group(function () {
    Route::get('/jobs/public', [RecruitmentController::class, 'getPublicJobs']);
    Route::post('/apply/public', [RecruitmentController::class, 'applyPublic']);
});

// Protected routes
Route::middleware('auth:api')->group(function () {
    
    // Authentication routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile', [AuthController::class, 'updateProfile']); // For FormData uploads with _method=PUT

    // Employee routes
    Route::prefix('employees')->group(function () {
        Route::get('/', [EmployeeController::class, 'index']);
        Route::post('/', [EmployeeController::class, 'store']);
        Route::get('/{id}', [EmployeeController::class, 'show']);
        Route::put('/{id}', [EmployeeController::class, 'update']);
        Route::post('/{id}', [EmployeeController::class, 'update']); // For FormData uploads with _method=PUT
        Route::delete('/{id}', [EmployeeController::class, 'destroy']); // Archive
        Route::post('/{id}/restore', [EmployeeController::class, 'restore']); // Restore archived
    });

    // Department routes
    Route::prefix('departments')->group(function () {
        Route::get('/', [DepartmentController::class, 'index']);
        Route::post('/', [DepartmentController::class, 'store']);
        Route::get('/{id}', [DepartmentController::class, 'show']);
        Route::put('/{id}', [DepartmentController::class, 'update']);
        Route::delete('/{id}', [DepartmentController::class, 'destroy']); // Archive
        Route::post('/{id}/restore', [DepartmentController::class, 'restore']); // Restore archived
    });

    // Position routes
    Route::prefix('positions')->group(function () {
        Route::get('/', [PositionController::class, 'index']);
        Route::post('/', [PositionController::class, 'store']);
        Route::get('/{id}', [PositionController::class, 'show']);
        Route::put('/{id}', [PositionController::class, 'update']);
        Route::delete('/{id}', [PositionController::class, 'destroy']);
    });

    // Payroll routes
    Route::prefix('payroll')->group(function () {
        Route::get('/', [PayrollController::class, 'index']);
        Route::post('/check-duplicate', [PayrollController::class, 'checkDuplicate']);
        Route::post('/process', [PayrollController::class, 'processPayroll']);
        Route::get('/{id}', [PayrollController::class, 'show']);
        Route::get('/employee/{employeeId}', [PayrollController::class, 'getEmployeePayrolls']);
        Route::get('/{id}/payslip', [PayrollController::class, 'generatePayslip']);
        Route::post('/{id}/unlock', [PayrollController::class, 'unlockPayroll']);
        Route::delete('/{id}', [PayrollController::class, 'destroy']); // Archive
        Route::post('/{id}/restore', [PayrollController::class, 'restore']); // Restore archived
    });

    // Attendance routes
    Route::prefix('attendance')->group(function () {
        Route::post('/clock-in', [AttendanceController::class, 'clockIn']);
        Route::post('/clock-out', [AttendanceController::class, 'clockOut']);
        Route::get('/stats/today', [AttendanceController::class, 'todayStats']);
        Route::get('/', [AttendanceController::class, 'index']);
        Route::get('/employee/{id}', [AttendanceController::class, 'getEmployeeAttendance']);
        Route::post('/{id}/selfie/approve', [AttendanceController::class, 'approveSelfie']);
        Route::post('/{id}/selfie/reject', [AttendanceController::class, 'rejectSelfie']);
    });

    // Leave routes
    Route::prefix('leaves')->group(function () {
        Route::get('/', [LeaveController::class, 'index']);
        Route::post('/', [LeaveController::class, 'store']);
        Route::get('/{id}', [LeaveController::class, 'show']);
        Route::put('/{id}/approve', [LeaveController::class, 'approve']);
        Route::put('/{id}/reject', [LeaveController::class, 'reject']);
        Route::delete('/{id}', [LeaveController::class, 'destroy']);
    });

    // Announcement routes
    Route::prefix('announcements')->group(function () {
        Route::get('/', [AnnouncementController::class, 'index']);
        Route::get('/{id}', [AnnouncementController::class, 'show']);
        
        // Admin and HR only routes
        Route::middleware('role:admin,hr')->group(function () {
            Route::post('/', [AnnouncementController::class, 'store']);
            Route::put('/{id}', [AnnouncementController::class, 'update']);
            Route::delete('/{id}', [AnnouncementController::class, 'destroy']);
        });
    });

    // Recruitment routes
    Route::prefix('recruitment')->group(function () {
        Route::get('/jobs', [RecruitmentController::class, 'getJobs']);
        Route::post('/jobs', [RecruitmentController::class, 'createJob']);
        Route::get('/jobs/{id}', [RecruitmentController::class, 'getJob']);
        Route::put('/jobs/{id}', [RecruitmentController::class, 'updateJob']);
        Route::put('/jobs/{id}/close', [RecruitmentController::class, 'closeJob']);
        Route::delete('/jobs/{id}', [RecruitmentController::class, 'deleteJob']);
        Route::post('/apply', [RecruitmentController::class, 'apply']);
        Route::get('/applications', [RecruitmentController::class, 'getApplications']);
        Route::put('/applications/{id}/status', [RecruitmentController::class, 'updateApplicationStatus']);
    });

    // Reports routes
    Route::prefix('reports')->group(function () {
        Route::get('/payroll', [ReportController::class, 'payrollReport']);
        Route::get('/attendance', [ReportController::class, 'attendanceReport']);
        Route::get('/leaves', [ReportController::class, 'leaveReport']);
        Route::get('/department', [ReportController::class, 'departmentReport']);
    });

});
