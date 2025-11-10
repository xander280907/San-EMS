import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { employeeAPI, authAPI } from '../services/api'
import { User, Mail, Phone, Calendar, MapPin, Heart, Shield, Save, Camera, Edit2 } from 'lucide-react'

export default function Profile() {
  const { user, updateUser } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    email: '',
    phone: '',
    address: '',
    gender: '',
    birth_date: '',
    marital_status: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  })
  
  const [employeeData, setEmployeeData] = useState(null)
  const [profilePicture, setProfilePicture] = useState(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await authAPI.me()
      const userData = response.data || response
      
      setProfileData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        middle_name: userData.middle_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.employee?.address || '',
        gender: userData.employee?.gender || '',
        birth_date: userData.employee?.birth_date || '',
        marital_status: userData.employee?.marital_status || '',
        emergency_contact_name: userData.employee?.emergency_contact_name || '',
        emergency_contact_phone: userData.employee?.emergency_contact_phone || '',
      })
      
      setEmployeeData(userData.employee || null)
      
      // Check user profile picture first, then employee profile picture
      const profilePic = userData.profile_picture || userData.employee?.profile_picture
      if (profilePic) {
        // Construct full URL for profile picture
        const pictureUrl = profilePic.startsWith('http') 
          ? profilePic 
          : `http://localhost:8000${profilePic}`
        setProfilePicturePreview(pictureUrl)
      }
    } catch (e) {
      console.error('Profile load error:', e)
      setError(e.response?.data?.error || e.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB')
        return
      }
      
      setProfilePicture(file)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    setSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      // If user has employee data, update via employee API
      if (employeeData?.id) {
        const formData = new FormData()
        
        formData.append('first_name', profileData.first_name)
        formData.append('last_name', profileData.last_name)
        formData.append('middle_name', profileData.middle_name || '')
        formData.append('phone', profileData.phone || '')
        
        formData.append('address', profileData.address || '')
        formData.append('gender', profileData.gender || '')
        formData.append('birth_date', profileData.birth_date || '')
        formData.append('marital_status', profileData.marital_status || '')
        formData.append('emergency_contact_name', profileData.emergency_contact_name || '')
        formData.append('emergency_contact_phone', profileData.emergency_contact_phone || '')
        
        if (profilePicture) {
          formData.append('profile_picture', profilePicture)
        }
        
        await employeeAPI.update(employeeData.id, formData)
      } else {
        // For users without employee records (like admins), use FormData if uploading image
        if (profilePicture) {
          const formData = new FormData()
          formData.append('first_name', profileData.first_name)
          formData.append('last_name', profileData.last_name)
          formData.append('middle_name', profileData.middle_name || '')
          formData.append('phone', profileData.phone || '')
          formData.append('profile_picture', profilePicture)
          
          await authAPI.updateProfile(formData)
        } else {
          // Regular JSON update if no image
          const userData = {
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            middle_name: profileData.middle_name || '',
            phone: profileData.phone || '',
          }
          
          await authAPI.updateProfile(userData)
        }
      }
      
      const updatedUserResponse = await authAPI.me()
      const updatedUserData = updatedUserResponse.data || updatedUserResponse
      
      // Update both localStorage and AuthContext state
      updateUser(updatedUserData)
      
      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      await fetchProfile()
    } catch (e) {
      console.error('Profile update error:', e)
      console.error('Error response:', e.response?.data)
      console.error('Error status:', e.response?.status)
      
      // Show detailed error message
      let errorMessage = 'Failed to update profile'
      
      if (e.response?.data) {
        // Handle validation errors
        if (e.response.data.errors) {
          const errors = e.response.data.errors
          errorMessage = Object.values(errors).flat().join(', ')
        } else if (e.response.data.error) {
          errorMessage = typeof e.response.data.error === 'string' 
            ? e.response.data.error 
            : JSON.stringify(e.response.data.error)
        } else if (e.response.data.message) {
          errorMessage = e.response.data.message
        }
      } else if (e.message) {
        errorMessage = e.message
      }
      
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">My Profile</h1>
          <p className="text-gray-600 mt-2 text-lg">Manage your personal information and settings</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            <Edit2 className="w-5 h-5" />
            Edit Profile
          </button>
        ) : (
          <button
            onClick={() => {
              setIsEditing(false)
              fetchProfile()
            }}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            Cancel
          </button>
        )}
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg shadow-sm flex items-center gap-3">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="font-medium">{success}</span>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg shadow-sm flex items-center gap-3">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Picture</h2>
              
              <div className="flex flex-col items-center">
                <div className="relative w-48 h-48 mb-6">
                  {profilePicturePreview ? (
                    <img
                      src={profilePicturePreview}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover border-4 border-primary-200 shadow-xl ring-4 ring-primary-50"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center border-4 border-primary-200 shadow-xl">
                      <User className="w-24 h-24 text-white" />
                    </div>
                  )}
                  
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-3 rounded-full cursor-pointer hover:bg-primary-700 shadow-xl transition-all duration-200 hover:scale-110 border-4 border-white">
                      <Camera className="w-5 h-5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                
                {isEditing && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center w-full">
                    <p className="text-sm text-blue-800 font-semibold mb-1">
                      📸 Click camera to upload
                    </p>
                    <p className="text-xs text-blue-600">
                      Max 5MB • JPG, PNG
                    </p>
                  </div>
                )}
              </div>

              {/* Employee Info - Only show if user has employee data */}
              {employeeData && (
                <div className="mt-6 pt-6 border-t-2 border-gray-200">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Employee Details</h3>
                  <div className="space-y-3">
                    <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg p-3 border border-primary-200">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Employee Number</p>
                      <p className="font-bold text-gray-900 text-lg mt-1">{employeeData?.employee_number || '-'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Department</p>
                      <p className="font-semibold text-gray-900 mt-1">{employeeData?.department?.name || '-'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Position</p>
                      <p className="font-semibold text-gray-900 mt-1">{employeeData?.position || '-'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Employment Type</p>
                      <p className="font-semibold text-gray-900 mt-1 capitalize">{employeeData?.employment_type || '-'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hire Date</p>
                      <p className="font-semibold text-gray-900 mt-1">{formatDate(employeeData?.hire_date)}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Show role info for non-employees */}
              {!employeeData && (
                <div className="mt-6 pt-6 border-t-2 border-gray-200">
                  <div className="space-y-3">
                    <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg p-3 border border-primary-200">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Role</p>
                      <p className="font-bold text-gray-900 text-lg mt-1 capitalize">{user?.role || '-'}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-700 font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Admin and HR users can only edit basic profile information.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profile Details Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1 text-primary-600" />
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={profileData.first_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 disabled:bg-gray-50 disabled:text-gray-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1 text-primary-600" />
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={profileData.last_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 disabled:bg-gray-50 disabled:text-gray-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1 text-primary-600" />
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middle_name"
                    value={profileData.middle_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 disabled:bg-gray-50 disabled:text-gray-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1 text-primary-600" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-2 italic flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1 text-primary-600" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 disabled:bg-gray-50 disabled:text-gray-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                  />
                </div>

                {/* Employee-specific fields - Only show if user has employee data */}
                {employeeData && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1 text-primary-600" />
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={profileData.gender}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 disabled:bg-gray-50 disabled:text-gray-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1 text-primary-600" />
                        Birth Date
                      </label>
                      <input
                        type="date"
                        name="birth_date"
                        value={profileData.birth_date}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 disabled:bg-gray-50 disabled:text-gray-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Heart className="w-4 h-4 inline mr-1 text-primary-600" />
                        Marital Status
                      </label>
                      <select
                        name="marital_status"
                        value={profileData.marital_status}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 disabled:bg-gray-50 disabled:text-gray-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                      >
                        <option value="">Select Status</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                        <option value="widowed">Widowed</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1 text-primary-600" />
                        Address
                      </label>
                      <textarea
                        name="address"
                        value={profileData.address}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        rows="3"
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 disabled:bg-gray-50 disabled:text-gray-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all resize-none"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Emergency Contact Section - Only for employees */}
              {employeeData && (
                <div className="mt-8 pt-6 border-t-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary-600" />
                    Emergency Contact
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        name="emergency_contact_name"
                        value={profileData.emergency_contact_name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 disabled:bg-gray-50 disabled:text-gray-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        name="emergency_contact_phone"
                        value={profileData.emergency_contact_phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 disabled:bg-gray-50 disabled:text-gray-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              {isEditing && (
                <div className="mt-8 pt-6 border-t-2 border-gray-200 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 font-semibold text-lg"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
