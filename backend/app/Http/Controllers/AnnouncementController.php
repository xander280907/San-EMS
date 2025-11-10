<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AnnouncementController extends Controller
{
    /**
     * Get all announcements
     */
    public function index(Request $request)
    {
        $query = Announcement::with(['department', 'creator'])
            ->where('is_active', true);

        // Filter by visibility for employees
        $user = auth()->user();
        if ($user->isEmployee() && $user->employee) {
            $departmentId = $user->employee->department_id;
            $query->where(function($q) use ($departmentId) {
                $q->where('visibility', 'all')
                  ->orWhere(function($q2) use ($departmentId) {
                      $q2->where('visibility', 'department')
                         ->where('department_id', $departmentId);
                  });
            });
        }

        $announcements = $query->orderBy('is_urgent', 'desc')
            ->orderBy('published_at', 'desc')
            ->paginate(20);

        return response()->json($announcements);
    }

    /**
     * Create announcement
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'visibility' => 'required|in:all,department,specific',
            'department_id' => 'required_if:visibility,department|exists:departments,id',
            'is_urgent' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        $data = [
            'title' => $request->title,
            'content' => $request->content,
            'visibility' => $request->visibility,
            'created_by' => auth()->id(),
            'is_urgent' => $request->is_urgent ?? false,
            'published_at' => now(),
        ];

        // Only set department_id if visibility is 'department'
        if ($request->visibility === 'department') {
            $data['department_id'] = $request->department_id;
        } else {
            $data['department_id'] = null;
        }

        \Log::info('Creating announcement with data:', $data);

        $announcement = Announcement::create($data);

        $announcement->load(['department', 'creator']);

        return response()->json([
            'message' => 'Announcement created successfully',
            'data' => $announcement,
        ], 201);
    }

    /**
     * Get single announcement
     */
    public function show($id)
    {
        $announcement = Announcement::with(['department', 'creator'])->findOrFail($id);
        return response()->json($announcement);
    }

    /**
     * Update announcement
     */
    public function update(Request $request, $id)
    {
        $announcement = Announcement::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'visibility' => 'in:all,department,specific',
            'department_id' => 'required_if:visibility,department|exists:departments,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        $updateData = $request->only([
            'title', 'content', 'visibility', 'is_urgent', 'is_active'
        ]);

        // Handle department_id based on visibility
        if ($request->has('visibility')) {
            if ($request->visibility === 'department') {
                $updateData['department_id'] = $request->department_id;
            } else {
                $updateData['department_id'] = null;
            }
        }

        $announcement->update($updateData);

        $announcement->load(['department', 'creator']);

        return response()->json([
            'message' => 'Announcement updated successfully',
            'data' => $announcement,
        ]);
    }

    /**
     * Delete announcement
     */
    public function destroy($id)
    {
        $announcement = Announcement::findOrFail($id);
        $announcement->update(['is_active' => false]);

        return response()->json(['message' => 'Announcement deleted successfully']);
    }
}
