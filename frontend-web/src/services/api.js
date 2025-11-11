import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle token refresh and logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/login', credentials),
  register: (data) => api.post('/register', data),
  logout: () => api.post('/logout'),
  me: () => api.get('/me'),
  refresh: () => api.post('/refresh'),
  updateProfile: (data) => {
    if (data instanceof FormData) {
      // For FormData, use a direct axios instance without the default Content-Type
      const formDataApi = axios.create({
        baseURL: '/api',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      return formDataApi.post('/profile?_method=PUT', data)
    }
    return api.put('/profile', data)
  },
}

// Employee API
export const employeeAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => {
    if (data instanceof FormData) {
      // For FormData, use a direct axios instance without the default Content-Type
      const formDataApi = axios.create({
        baseURL: '/api',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      return formDataApi.post(`/employees/${id}?_method=PUT`, data)
    }
    return api.post(`/employees/${id}?_method=PUT`, data)
  },
  delete: (id) => api.delete(`/employees/${id}`), // Archive employee
  restore: (id) => api.post(`/employees/${id}/restore`), // Restore archived employee
}

// Payroll API
export const payrollAPI = {
  getAll: (params) => api.get('/payroll', { params }),
  getById: (id) => api.get(`/payroll/${id}`),
  checkDuplicate: (data) => api.post('/payroll/check-duplicate', data),
  process: (data) => api.post('/payroll/process', data),
  getEmployeePayrolls: (id) => api.get(`/payroll/employee/${id}`),
  generatePayslip: (id) => api.get(`/payroll/${id}/payslip`, { responseType: 'blob' }),
  unlock: (id) => api.post(`/payroll/${id}/unlock`),
  delete: (id) => api.delete(`/payroll/${id}`), // Archive payroll
  restore: (id) => api.post(`/payroll/${id}/restore`), // Restore archived payroll
}

// Attendance API
export const attendanceAPI = {
  getAll: (params) => api.get('/attendance', { params }),
  clockIn: (data) => api.post('/attendance/clock-in', data),
  clockOut: (data) => api.post('/attendance/clock-out', data),
  getEmployeeAttendance: (id) => api.get(`/attendance/employee/${id}`),
  getTodayStats: () => api.get('/attendance/stats/today'),
  approveSelfie: (id, sessionType) => api.post(`/attendance/${id}/selfie/approve`, { session_type: sessionType }),
  rejectSelfie: (id, sessionType, reason) => api.post(`/attendance/${id}/selfie/reject`, { session_type: sessionType, reason }),
}

// Leave API
export const leaveAPI = {
  getAll: (params) => api.get('/leaves', { params }),
  getById: (id) => api.get(`/leaves/${id}`),
  create: (data) => api.post('/leaves', data),
  approve: (id, data) => api.put(`/leaves/${id}/approve`, data),
  reject: (id, data) => api.put(`/leaves/${id}/reject`, data),
  delete: (id) => api.delete(`/leaves/${id}`),
}

// Department API
export const departmentAPI = {
  getAll: (params) => api.get('/departments', { params }),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`), // Archive department
  restore: (id) => api.post(`/departments/${id}/restore`), // Restore archived department
}

// Position API
export const positionAPI = {
  getAll: (params) => api.get('/positions', { params }),
  getById: (id) => api.get(`/positions/${id}`),
  create: (data) => api.post('/positions', data),
  update: (id, data) => api.put(`/positions/${id}`, data),
  delete: (id) => api.delete(`/positions/${id}`),
}

// Announcement API
export const announcementAPI = {
  getAll: (params) => api.get('/announcements', { params }),
  getById: (id) => api.get(`/announcements/${id}`),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
}

// Recruitment API
export const recruitmentAPI = {
  getJobs: (params) => api.get('/recruitment/jobs', { params }),
  getJob: (id) => api.get(`/recruitment/jobs/${id}`),
  createJob: (data) => api.post('/recruitment/jobs', data),
  updateJob: (id, data) => api.put(`/recruitment/jobs/${id}`, data),
  closeJob: (id) => api.put(`/recruitment/jobs/${id}/close`),
  deleteJob: (id) => api.delete(`/recruitment/jobs/${id}`),
  apply: (data) => api.post('/recruitment/apply', data),
  getApplications: (params) => api.get('/recruitment/applications', { params }),
  updateApplicationStatus: (id, data) => api.put(`/recruitment/applications/${id}/status`, data),
}

// Report API
export const reportAPI = {
  payroll: (params) => api.get('/reports/payroll', { params }),
  attendance: (params) => api.get('/reports/attendance', { params }),
  leaves: (params) => api.get('/reports/leaves', { params }),
  department: (params) => api.get('/reports/department', { params }),
}

// Public Recruitment API (no authentication required)
export const publicRecruitmentAPI = {
  getJobs: (params) => axios.get('/api/recruitment/jobs/public', { params }),
  apply: (data) => axios.post('/api/recruitment/apply/public', data),
}
