import { useEffect, useState } from 'react'
import { announcementAPI, departmentAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Megaphone, AlertCircle, Plus, Edit, Trash2, X, Search } from 'lucide-react'

export default function Announcements() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterUrgent, setFilterUrgent] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    visibility: 'all',
    department_id: '',
    is_urgent: false,
  })

  // Check if user can manage announcements (admin or hr)
  const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name
  const canManage = roleName === 'admin' || roleName === 'hr'

  useEffect(() => {
    fetchAnnouncements()
    if (canManage) {
      fetchDepartments()
    }
  }, [canManage])

  const fetchAnnouncements = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await announcementAPI.getAll()
      console.log('Announcements response:', response.data)
      
      // Handle paginated response from Laravel
      let data = []
      if (response.data) {
        // Check if it's a paginated response (has 'data' property)
        if (response.data.data && Array.isArray(response.data.data)) {
          data = response.data.data
        } 
        // Otherwise, check if response.data itself is an array
        else if (Array.isArray(response.data)) {
          data = response.data
        }
      }
      
      console.log('Extracted announcements:', data)
      setAnnouncements(data)
    } catch (err) {
      console.error('Error fetching announcements:', err)
      console.error('Error details:', err.response)
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to load announcements')
      setAnnouncements([]) // Set to empty array on error
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      // Build payload - only include department_id if visibility is 'department'
      const payload = {
        title: formData.title,
        content: formData.content,
        visibility: formData.visibility,
        is_urgent: Boolean(formData.is_urgent),
      }

      // Only add department_id if visibility is 'department' and a department is selected
      if (formData.visibility === 'department' && formData.department_id) {
        payload.department_id = formData.department_id
      }

      console.log('Submitting announcement:', payload)
      console.log('Form data:', formData)

      let response
      if (editingAnnouncement) {
        response = await announcementAPI.update(editingAnnouncement.id, payload)
      } else {
        response = await announcementAPI.create(payload)
      }

      console.log('Announcement saved successfully:', response.data)

      // Close modal and reset form first
      setShowModal(false)
      resetForm()
      
      // Then fetch announcements
      await fetchAnnouncements()
    } catch (err) {
      console.error('Error saving announcement:', err)
      console.error('Error response:', err.response)
      
      // Extract error message
      let errorMessage = 'Failed to save announcement'
      if (err.response?.data?.error) {
        // Handle validation errors object
        if (typeof err.response.data.error === 'object') {
          errorMessage = Object.values(err.response.data.error).flat().join(', ')
        } else {
          errorMessage = err.response.data.error
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      // Don't close modal if there's an error
    }
  }

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      content: announcement.content,
      visibility: announcement.visibility,
      department_id: announcement.department_id || '',
      is_urgent: announcement.is_urgent,
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return
    }

    try {
      await announcementAPI.delete(id)
      fetchAnnouncements()
    } catch (err) {
      console.error('Error deleting announcement:', err)
      setError(err.response?.data?.error || err.message || 'Failed to delete announcement')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      visibility: 'all',
      department_id: '',
      is_urgent: false,
    })
    setEditingAnnouncement(null)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    resetForm()
  }

  // Filter announcements
  const filteredAnnouncements = announcements.filter(announcement => {
    try {
      // Ensure announcement has required properties
      if (!announcement || !announcement.id) {
        console.warn('Invalid announcement object:', announcement)
        return false
      }
      
      const matchesSearch = announcement.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           announcement.content?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesUrgent = !filterUrgent || Boolean(announcement.is_urgent)
      return matchesSearch && matchesUrgent
    } catch (err) {
      console.error('Error filtering announcement:', announcement, err)
      return false
    }
  })

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Announcements</h1>
        {canManage && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            <span className="whitespace-nowrap">New Announcement</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchAnnouncements()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterUrgent}
              onChange={(e) => setFilterUrgent(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Urgent only</span>
          </label>
          <button
            onClick={fetchAnnouncements}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Loading announcements...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm || filterUrgent
                ? 'No announcements match your filters.'
                : 'No announcements available at the moment.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                announcement.is_urgent
                  ? 'border-red-500'
                  : 'border-blue-500'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start justify-between mb-3 gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 w-full">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 break-words">
                    {announcement.title || 'Untitled Announcement'}
                  </h2>
                  {announcement.is_urgent && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                      <AlertCircle className="w-3 h-3" />
                      Urgent
                    </span>
                  )}
                </div>
                {canManage && (
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="text-gray-700 whitespace-pre-wrap mb-4">
                {announcement.content}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-gray-500 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-3">
                  {announcement.visibility === 'department' && announcement.department && (
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {announcement.department.name}
                    </span>
                  )}
                  {announcement.visibility === 'all' && (
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      All Employees
                    </span>
                  )}
                  {announcement.creator && (
                    <span>
                      By: {announcement.creator.first_name} {announcement.creator.last_name}
                    </span>
                  )}
                </div>
                {announcement.published_at && (() => {
                  try {
                    const date = new Date(announcement.published_at)
                    if (isNaN(date.getTime())) {
                      return <span>{announcement.published_at}</span>
                    }
                    return (
                      <span>
                        {date.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )
                  } catch (err) {
                    console.error('Error formatting date:', announcement.published_at, err)
                    return <span>{announcement.published_at}</span>
                  }
                })()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter announcement content"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value, department_id: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Employees</option>
                  <option value="department">Specific Department</option>
                </select>
              </div>

              {formData.visibility === 'department' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_urgent"
                  checked={formData.is_urgent}
                  onChange={(e) => setFormData({ ...formData, is_urgent: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
                <label htmlFor="is_urgent" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Mark as urgent
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingAnnouncement ? 'Update' : 'Create'} Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
