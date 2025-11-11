<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DepartmentController extends Controller
{
    /**
     * Get all departments
     */
    public function index(Request $request)
    {
        $query = Department::with(['manager.user']);

        // Filter archived departments
        if ($request->has('archived') && $request->archived === 'true') {
            $query->onlyTrashed();
        } elseif ($request->has('archived') && $request->archived === 'all') {
            $query->withTrashed();
        }
        // Default: only active (non-archived) departments

        $departments = $query->get();
        return response()->json($departments);
    }

    /**
     * Create new department
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:departments',
            'code' => 'nullable|string|unique:departments',
            'description' => 'nullable|string',
            'manager_id' => 'nullable|exists:employees,id',
            'positions' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        $department = Department::create($request->all());
        $department->load(['manager.user']);

        return response()->json($department, 201);
    }

    /**
     * Get single department
     */
    public function show($id)
    {
        $department = Department::with(['manager.user', 'employees.user'])->findOrFail($id);
        return response()->json($department);
    }

    /**
     * Update department
     */
    public function update(Request $request, $id)
    {
        $department = Department::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|unique:departments,name,' . $id,
            'code' => 'nullable|string|unique:departments,code,' . $id,
            'manager_id' => 'nullable|exists:employees,id',
            'positions' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        $department->update($request->all());
        $department->load(['manager.user']);

        return response()->json($department);
    }

    /**
     * Archive department (soft delete)
     */
    public function destroy($id)
    {
        $department = Department::findOrFail($id);
        $department->delete(); // Soft delete

        return response()->json(['message' => 'Department archived successfully']);
    }

    /**
     * Restore archived department
     */
    public function restore($id)
    {
        $department = Department::withTrashed()->findOrFail($id);
        $department->restore();

        return response()->json([
            'message' => 'Department restored successfully',
            'department' => $department->load(['manager.user'])
        ]);
    }
}
