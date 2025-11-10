import { useEffect, useState } from 'react'
import { recruitmentAPI, departmentAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Briefcase, Plus, Edit, X, Search, MapPin, Calendar, Banknote, Users, Send, Clock, CheckCircle, XCircle, Ban, Trash2, Eye } from 'lucide-react'

export default function Recruitment() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showJobModal, setShowJobModal] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('jobs')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  
  const [jobFormData, setJobFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    department_id: '',
    employment_type: 'full-time',
    location: '',
    salary_range_min: '',
    salary_range_max: '',
    application_deadline: '',
  })

  const [applyFormData, setApplyFormData] = useState({
    job_posting_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    cover_letter: '',
  })

  const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name
  const canManage = roleName === 'admin' || roleName === 'hr'

  useEffect(() => {
    fetchJobs()
    if (canManage) {
      fetchDepartments()
      fetchApplications()
    }
  }, [canManage])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const response = await recruitmentAPI.getJobs()
      const data = response.data?.data || response.data || []
      setJobs(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Failed to load job postings')
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await departmentAPI.getAll()
      setDepartments(response.data || [])
    } catch (err) {
      console.error('Error fetching departments:', err)
    }
  }

  const fetchApplications = async () => {
    try {
      const response = await recruitmentAPI.getApplications()
      const data = response.data?.data || response.data || []
      setApplications(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching applications:', err)
    }
  }

  const handleJobSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const payload = { ...jobFormData }
      if (editingJob) {
        await recruitmentAPI.updateJob(editingJob.id, payload)
      } else {
        await recruitmentAPI.createJob(payload)
      }
      setShowJobModal(false)
      resetJobForm()
      await fetchJobs()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save job posting')
    }
  }

  const handleApplySubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await recruitmentAPI.apply(applyFormData)
      setShowApplyModal(false)
      resetApplyForm()
      alert('Application submitted successfully!')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application')
    }
  }

  const handleEditJob = (job) => {
    setEditingJob(job)
    // Convert ISO date to yyyy-MM-dd format for date input
    let deadlineDate = ''
    if (job.application_deadline) {
      const date = new Date(job.application_deadline)
      deadlineDate = date.toISOString().split('T')[0]
    }
    setJobFormData({
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      department_id: job.department_id || '',
      employment_type: job.employment_type,
      location: job.location,
      salary_range_min: job.salary_range_min || '',
      salary_range_max: job.salary_range_max || '',
      application_deadline: deadlineDate,
    })
    setShowJobModal(true)
  }

  const handleApplyClick = (job) => {
    setSelectedJob(job)
    setApplyFormData({
      job_posting_id: job.id,
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: '',
      cover_letter: '',
    })
    setShowApplyModal(true)
  }

  const handleCloseJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to close this job posting? No more applications will be accepted.')) return
    setError(null)
    try {
      await recruitmentAPI.closeJob(jobId)
      setShowJobModal(false)
      resetJobForm()
      await fetchJobs()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close job posting')
    }
  }

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) return
    setError(null)
    try {
      await recruitmentAPI.deleteJob(jobId)
      setShowJobModal(false)
      resetJobForm()
      await fetchJobs()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete job posting')
    }
  }

  const handleViewDetails = (application) => {
    setSelectedApplication(application)
    setShowDetailsModal(true)
  }

  const handleUpdateApplicationStatus = async (applicationId, newStatus) => {
    setError(null)
    setSuccessMessage(null)
    setUpdatingStatus(true)
    
    try {
      await recruitmentAPI.updateApplicationStatus(applicationId, { status: newStatus })
      await fetchApplications()
      
      // Update selected application if it's the one being viewed
      if (selectedApplication?.id === applicationId) {
        const updatedApp = applications.find(app => app.id === applicationId)
        if (updatedApp) {
          setSelectedApplication({ ...updatedApp, status: newStatus })
        }
      }
      
      // Show success message
      const statusMessages = {
        'reviewing': 'Application marked as under review',
        'accepted': 'Application accepted successfully',
        'rejected': 'Application rejected'
      }
      setSuccessMessage(statusMessages[newStatus] || 'Status updated successfully')
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update application status')
      console.error('Error updating application status:', err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const resetJobForm = () => {
    setJobFormData({
      title: '', description: '', requirements: '', department_id: '',
      employment_type: 'full-time', location: '', salary_range_min: '',
      salary_range_max: '', application_deadline: '',
    })
    setEditingJob(null)
  }

  const resetApplyForm = () => {
    setApplyFormData({
      job_posting_id: '', first_name: '', last_name: '',
      email: '', phone: '', cover_letter: '',
    })
    setSelectedJob(null)
  }

  const filteredJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status) => {
    const config = {
      applied: { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Applied' },
      reviewing: { color: 'bg-yellow-100 text-yellow-700', icon: Users, label: 'Reviewing' },
      accepted: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Accepted' },
      rejected: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejected' },
    }[status] || { color: 'bg-gray-100 text-gray-700', icon: Clock, label: status }
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />{config.label}
      </span>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Recruitment</h1>
        {canManage && (
          <button onClick={() => setShowJobModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus className="w-5 h-5" />Post New Job
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {canManage && (
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-4">
            <button onClick={() => setActiveTab('jobs')}
              className={`py-2 px-4 border-b-2 font-medium ${activeTab === 'jobs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
              Job Postings
            </button>
            <button onClick={() => setActiveTab('applications')}
              className={`py-2 px-4 border-b-2 font-medium ${activeTab === 'applications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
              Applications ({applications.length})
            </button>
          </nav>
        </div>
      )}

      {activeTab === 'jobs' ? (
        <>
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="text" placeholder="Search jobs..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchJobs()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <button
                onClick={fetchJobs}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">Loading job postings...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center py-8">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No job postings available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                  <div className="flex justify-between mb-3">
                    <h2 className="text-xl font-bold text-gray-800">{job.title}</h2>
                    {canManage && (
                      <button onClick={() => handleEditJob(job)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" /><span>{job.location}</span>
                    </div>
                    {(job.salary_range_min || job.salary_range_max) && (
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4" />
                        <span>₱{job.salary_range_min || '0'} - ₱{job.salary_range_max || 'Negotiable'}</span>
                      </div>
                    )}
                    {job.application_deadline && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Deadline: {new Date(job.application_deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  {!canManage && (
                    <button onClick={() => handleApplyClick(job)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      <Send className="w-4 h-4" />Apply Now
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {applications.length === 0 ? (
            <div className="p-6 text-center py-8">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No applications received yet.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {app.first_name} {app.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {app.job_posting?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {app.email}<br />{app.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(app.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button 
                        onClick={() => handleViewDetails(app)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                        title="View Details">
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Job Modal */}
      {showJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between p-6 border-b">
              <h2 className="text-2xl font-bold">{editingJob ? 'Edit' : 'Create'} Job Posting</h2>
              <button onClick={() => { setShowJobModal(false); resetJobForm(); }}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleJobSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Job Title *</label>
                <input type="text" required value={jobFormData.title}
                  onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Department *</label>
                  <select required value={jobFormData.department_id}
                    onChange={(e) => setJobFormData({ ...jobFormData, department_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Select department</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Employment Type *</label>
                  <select required value={jobFormData.employment_type}
                    onChange={(e) => setJobFormData({ ...jobFormData, employment_type: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location *</label>
                <input type="text" required value={jobFormData.location}
                  onChange={(e) => setJobFormData({ ...jobFormData, location: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Min Salary (₱)</label>
                  <input type="number" value={jobFormData.salary_range_min}
                    onChange={(e) => setJobFormData({ ...jobFormData, salary_range_min: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Salary (₱)</label>
                  <input type="number" value={jobFormData.salary_range_max}
                    onChange={(e) => setJobFormData({ ...jobFormData, salary_range_max: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Deadline</label>
                  <input type="date" value={jobFormData.application_deadline}
                    onChange={(e) => setJobFormData({ ...jobFormData, application_deadline: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea required value={jobFormData.description} rows={4}
                  onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Requirements *</label>
                <textarea required value={jobFormData.requirements} rows={4}
                  onChange={(e) => setJobFormData({ ...jobFormData, requirements: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex justify-between pt-4 border-t">
                <div className="flex gap-2">
                  {editingJob && (
                    <>
                      <button type="button" onClick={() => handleCloseJob(editingJob.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200">
                        <Ban className="w-4 h-4" />Close Job
                      </button>
                      <button type="button" onClick={() => handleDeleteJob(editingJob.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                        <Trash2 className="w-4 h-4" />Delete
                      </button>
                    </>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setShowJobModal(false); resetJobForm(); }}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    {editingJob ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between p-6 border-b">
              <h2 className="text-2xl font-bold">Apply for {selectedJob.title}</h2>
              <button onClick={() => { setShowApplyModal(false); resetApplyForm(); }}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleApplySubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name *</label>
                  <input type="text" required value={applyFormData.first_name}
                    onChange={(e) => setApplyFormData({ ...applyFormData, first_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name *</label>
                  <input type="text" required value={applyFormData.last_name}
                    onChange={(e) => setApplyFormData({ ...applyFormData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input type="email" required value={applyFormData.email}
                  onChange={(e) => setApplyFormData({ ...applyFormData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone *</label>
                <input type="tel" required value={applyFormData.phone}
                  onChange={(e) => setApplyFormData({ ...applyFormData, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cover Letter</label>
                <textarea value={applyFormData.cover_letter} rows={6}
                  onChange={(e) => setApplyFormData({ ...applyFormData, cover_letter: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us why you're interested in this position..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowApplyModal(false); resetApplyForm(); }}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between p-6 border-b">
              <h2 className="text-2xl font-bold">Application Details</h2>
              <button onClick={() => { setShowDetailsModal(false); setSelectedApplication(null); }}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <XCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                  <button onClick={() => setError(null)} className="ml-auto">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Applicant Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Applicant Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900">{selectedApplication.first_name} {selectedApplication.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedApplication.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">{selectedApplication.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Applied Date</label>
                    <p className="text-gray-900">{new Date(selectedApplication.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Job Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Job Position</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xl font-bold text-gray-900 mb-2">{selectedApplication.job_posting?.title || 'N/A'}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {selectedApplication.job_posting?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedApplication.job_posting.location}</span>
                      </div>
                    )}
                    {selectedApplication.job_posting?.employment_type && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {selectedApplication.job_posting.employment_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Application Status</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {getStatusBadge(selectedApplication.status)}
                </div>
              </div>

              {/* Cover Letter */}
              {selectedApplication.cover_letter && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Cover Letter</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Actions</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  {selectedApplication.status !== 'reviewing' && selectedApplication.status !== 'accepted' && selectedApplication.status !== 'rejected' && (
                    <button 
                      onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'reviewing')}
                      disabled={updatingStatus}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Clock className="w-5 h-5" />
                      {updatingStatus ? 'Updating...' : 'Mark as Reviewing'}
                    </button>
                  )}
                  {selectedApplication.status !== 'accepted' && (
                    <button 
                      onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'accepted')}
                      disabled={updatingStatus}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {updatingStatus ? 'Updating...' : 'Accept Application'}
                    </button>
                  )}
                  {selectedApplication.status !== 'rejected' && (
                    <button 
                      onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'rejected')}
                      disabled={updatingStatus}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="w-5 h-5" />
                      {updatingStatus ? 'Updating...' : 'Reject Application'}
                    </button>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={() => { 
                      setShowDetailsModal(false); 
                      setSelectedApplication(null); 
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    disabled={updatingStatus}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
