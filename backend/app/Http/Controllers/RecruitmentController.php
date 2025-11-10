<?php

namespace App\Http\Controllers;

use App\Models\JobPosting;
use App\Models\Applicant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RecruitmentController extends Controller
{
    /**
     * Get all job postings
     */
    public function getJobs(Request $request)
    {
        $query = JobPosting::with(['department', 'creator'])
            ->where('status', 'open');

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        $jobs = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($jobs);
    }

    /**
     * Create job posting
     */
    public function createJob(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string',
            'description' => 'required|string',
            'requirements' => 'required|string',
            'department_id' => 'required|exists:departments,id',
            'employment_type' => 'required|in:full-time,part-time,contract,internship',
            'location' => 'required|string',
            'salary_range_min' => 'nullable|numeric',
            'salary_range_max' => 'nullable|numeric',
            'application_deadline' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        $job = JobPosting::create([
            'title' => $request->title,
            'description' => $request->description,
            'requirements' => $request->requirements,
            'department_id' => $request->department_id,
            'employment_type' => $request->employment_type,
            'location' => $request->location,
            'salary_range_min' => $request->salary_range_min ?? null,
            'salary_range_max' => $request->salary_range_max ?? null,
            'application_deadline' => $request->application_deadline ?? null,
            'status' => 'open',
            'created_by' => auth()->id(),
        ]);

        $job->load(['department', 'creator']);

        return response()->json([
            'message' => 'Job posting created successfully',
            'data' => $job,
        ], 201);
    }

    /**
     * Get single job posting
     */
    public function getJob($id)
    {
        $job = JobPosting::with(['department', 'creator', 'applicants'])->findOrFail($id);
        return response()->json($job);
    }

    /**
     * Submit job application
     */
    public function apply(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'job_posting_id' => 'required|exists:job_postings,id',
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'email' => 'required|email',
            'phone' => 'required|string',
            'cover_letter' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        $application = Applicant::create([
            'job_posting_id' => $request->job_posting_id,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'cover_letter' => $request->cover_letter ?? null,
            'status' => 'applied',
        ]);

        $application->load(['jobPosting']);

        return response()->json([
            'message' => 'Application submitted successfully',
            'data' => $application,
        ], 201);
    }

    /**
     * Update job posting
     */
    public function updateJob(Request $request, $id)
    {
        $job = JobPosting::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'required|string',
            'description' => 'required|string',
            'requirements' => 'required|string',
            'department_id' => 'required|exists:departments,id',
            'employment_type' => 'required|in:full-time,part-time,contract,internship',
            'location' => 'required|string',
            'salary_range_min' => 'nullable|numeric',
            'salary_range_max' => 'nullable|numeric',
            'application_deadline' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        $job->update([
            'title' => $request->title,
            'description' => $request->description,
            'requirements' => $request->requirements,
            'department_id' => $request->department_id,
            'employment_type' => $request->employment_type,
            'location' => $request->location,
            'salary_range_min' => $request->salary_range_min ?? null,
            'salary_range_max' => $request->salary_range_max ?? null,
            'application_deadline' => $request->application_deadline ?? null,
        ]);

        $job->load(['department', 'creator']);

        return response()->json([
            'message' => 'Job posting updated successfully',
            'data' => $job,
        ]);
    }

    /**
     * Close/deactivate job posting
     */
    public function closeJob($id)
    {
        $job = JobPosting::findOrFail($id);
        $job->update(['status' => 'closed']);

        return response()->json([
            'message' => 'Job posting closed successfully',
            'data' => $job,
        ]);
    }

    /**
     * Delete job posting
     */
    public function deleteJob($id)
    {
        $job = JobPosting::findOrFail($id);
        $job->delete();

        return response()->json([
            'message' => 'Job posting deleted successfully',
        ]);
    }

    /**
     * Get all applications
     */
    public function getApplications(Request $request)
    {
        $query = Applicant::with(['jobPosting', 'reviewer']);

        if ($request->has('job_posting_id')) {
            $query->where('job_posting_id', $request->job_posting_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $applications = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($applications);
    }

    /**
     * Get public job postings (no authentication required)
     */
    public function getPublicJobs(Request $request)
    {
        $query = JobPosting::with(['department'])
            ->where('status', 'open');

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        $jobs = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $jobs
        ]);
    }

    /**
     * Submit public job application (no authentication required)
     */
    public function applyPublic(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'job_posting_id' => 'required|exists:job_postings,id',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'cover_letter' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if job posting is still open
        $jobPosting = JobPosting::findOrFail($request->job_posting_id);
        if ($jobPosting->status !== 'open') {
            return response()->json([
                'message' => 'This job posting is no longer accepting applications'
            ], 400);
        }

        // Check if application deadline has passed
        if ($jobPosting->application_deadline && now() > $jobPosting->application_deadline) {
            return response()->json([
                'message' => 'The application deadline for this position has passed'
            ], 400);
        }

        // Create application
        $application = Applicant::create([
            'job_posting_id' => $request->job_posting_id,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'cover_letter' => $request->cover_letter,
            'status' => 'applied',
        ]);

        return response()->json([
            'message' => 'Application submitted successfully! We will review your application and contact you soon.',
            'data' => $application,
        ], 201);
    }

    /**
     * Update application status
     */
    public function updateApplicationStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:applied,reviewing,accepted,rejected',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $application = Applicant::findOrFail($id);
        $application->update([
            'status' => $request->status,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        $application->load(['jobPosting', 'reviewer']);

        return response()->json([
            'message' => 'Application status updated successfully',
            'data' => $application,
        ]);
    }
}
