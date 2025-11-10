import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { publicRecruitmentAPI } from '../services/api'
import { 
  Briefcase, 
  Search, 
  MapPin, 
  Calendar, 
  Banknote, 
  Building2, 
  Clock, 
  X, 
  Send,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react'

export default function JobApplications() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [applyFormData, setApplyFormData] = useState({
    job_posting_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    cover_letter: '',
  })

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await publicRecruitmentAPI.getJobs()
      const data = response.data?.data || response.data || []
      // Filter only open jobs
      const openJobs = Array.isArray(data) ? data.filter(job => job.status === 'open') : []
      setJobs(openJobs)
    } catch (err) {
      setError('Failed to load job postings. Please try again later.')
      console.error('Error fetching jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyClick = (job) => {
    setSelectedJob(job)
    setApplyFormData({
      job_posting_id: job.id,
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      cover_letter: '',
    })
    setShowApplyModal(true)
    setSuccess(false)
  }

  const handleApplySubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    
    try {
      await publicRecruitmentAPI.apply(applyFormData)
      setSuccess(true)
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowApplyModal(false)
        resetApplyForm()
        setSuccess(false)
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetApplyForm = () => {
    setApplyFormData({
      job_posting_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      cover_letter: '',
    })
    setSelectedJob(null)
  }

  const filteredJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatEmploymentType = (type) => {
    const types = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      'contract': 'Contract',
      'internship': 'Internship'
    }
    return types[type] || type
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Home</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EMS Careers
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Join Our Team
            </h1>
            <p className="text-lg sm:text-xl text-blue-100">
              Explore exciting career opportunities and apply today
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search jobs by title, location, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && !showApplyModal && (
          <div className="max-w-4xl mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Job Listings */}
        {loading ? (
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
            <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading job openings...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Jobs Available</h3>
            <p className="text-gray-600">
              {searchTerm ? 'No jobs match your search criteria. Try different keywords.' : 'There are no open positions at the moment. Please check back later.'}
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{job.title}</h2>
                    
                    {/* Salary Badge - Prominent Display */}
                    {(job.salary_range_min || job.salary_range_max) && (
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700 rounded-lg font-bold text-lg">
                          <Banknote className="w-5 h-5" />
                          ₱{job.salary_range_min?.toLocaleString() || '0'} - ₱{job.salary_range_max?.toLocaleString() || 'Negotiable'}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                      )}
                      {job.employment_type && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                          {formatEmploymentType(job.employment_type)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleApplyClick(job)}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 whitespace-nowrap"
                  >
                    <Send className="w-4 h-4" />
                    Apply Now
                  </button>
                </div>

                <p className="text-gray-700 mb-4 leading-relaxed">{job.description}</p>

                {job.requirements && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Requirements:</h3>
                    <p className="text-gray-700 whitespace-pre-line">{job.requirements}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-4 border-t border-gray-200">
                  {job.application_deadline && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {job.department?.name && (
                    <div className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      <span>{job.department.name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Apply for {selectedJob.title}</h2>
              <button
                onClick={() => {
                  setShowApplyModal(false)
                  resetApplyForm()
                  setError(null)
                  setSuccess(false)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {success ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted!</h3>
                <p className="text-gray-600">
                  Thank you for your interest. We'll review your application and get back to you soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={applyFormData.first_name}
                      onChange={(e) =>
                        setApplyFormData({ ...applyFormData, first_name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={applyFormData.last_name}
                      onChange={(e) =>
                        setApplyFormData({ ...applyFormData, last_name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={applyFormData.email}
                    onChange={(e) =>
                      setApplyFormData({ ...applyFormData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={applyFormData.phone}
                    onChange={(e) =>
                      setApplyFormData({ ...applyFormData, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+63 912 345 6789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter
                  </label>
                  <textarea
                    value={applyFormData.cover_letter}
                    onChange={(e) =>
                      setApplyFormData({ ...applyFormData, cover_letter: e.target.value })
                    }
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowApplyModal(false)
                      resetApplyForm()
                      setError(null)
                    }}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Application
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">EMS</span>
            </div>
            <p className="text-gray-400 text-center">
              &copy; {new Date().getFullYear()} EMS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
