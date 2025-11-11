import { useEffect, useMemo, useState, memo } from 'react'
import { employeeAPI, departmentAPI } from '../services/api'
import EmployeeForm from '../components/employees/EmployeeForm'
import EmployeeView from '../components/employees/EmployeeView'
import { useAuth } from '../context/AuthContext'
import { Users, Building2, UserCheck, UserX, Download, ArrowUpDown, ArrowUp, ArrowDown, Search, Archive, RotateCcw } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Move Modal outside and memoize to prevent recreation on every render
const Modal = memo(({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  </div>
))

export default function Employees() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('')
  const [hireDateFrom, setHireDateFrom] = useState('')
  const [hireDateTo, setHireDateTo] = useState('')
  const [archivedFilter, setArchivedFilter] = useState('active') // 'active', 'archived', 'all'

  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(null)
  const [showView, setShowView] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [serverErrors, setServerErrors] = useState(null)

  // Sorting state
  const [sortField, setSortField] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    departments: {}
  })

  // Permission check
  const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name
  const canManage = roleName === 'admin' || roleName === 'hr'

  const totalPages = useMemo(() => {
    if (!total || !perPage) return 1
    return Math.max(1, Math.ceil(total / perPage))
  }, [total, perPage])

  useEffect(() => {
    fetchDepartments()
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [page, search, statusFilter, departmentFilter, employmentTypeFilter, hireDateFrom, hireDateTo, sortField, sortDirection, archivedFilter])

  const fetchDepartments = async () => {
    try {
      const res = await departmentAPI.getAll()
      const data = res.data?.data || res.data || []
      setDepartments(Array.isArray(data) ? data : [])
    } catch (e) {
      // ignore for now; select will be empty
    }
  }

  const fetchEmployees = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, per_page: perPage }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      if (departmentFilter) params.department_id = departmentFilter
      if (employmentTypeFilter) params.employment_type = employmentTypeFilter
      if (hireDateFrom) params.hire_date_from = hireDateFrom
      if (hireDateTo) params.hire_date_to = hireDateTo
      if (sortField) {
        params.sort_by = sortField
        params.sort_direction = sortDirection
      }
      // Add archived filter
      if (archivedFilter === 'archived') {
        params.archived = 'true'
      } else if (archivedFilter === 'all') {
        params.archived = 'all'
      }
      // Default: active only (no archived param)

      const res = await employeeAPI.getAll(params)
      const raw = res.data
      const data = raw?.data || raw || []
      let employeeList = Array.isArray(data) ? data : []
      
      // Client-side search filtering (in case backend doesn't support it fully)
      if (search && search.trim()) {
        const searchLower = search.toLowerCase().trim()
        employeeList = employeeList.filter(emp => {
          const firstName = emp.user?.first_name?.toLowerCase() || ''
          const lastName = emp.user?.last_name?.toLowerCase() || ''
          const fullName = `${firstName} ${lastName}`.trim()
          const email = emp.user?.email?.toLowerCase() || ''
          const empNumber = emp.employee_number?.toLowerCase() || ''
          
          return fullName.includes(searchLower) || 
                 email.includes(searchLower) || 
                 empNumber.includes(searchLower)
        })
      }
      
      // Apply client-side sorting if server doesn't support it
      let sortedData = [...employeeList]
      if (sortField && employeeList.length > 0) {
        sortedData.sort((a, b) => {
          let aVal = a[sortField]
          let bVal = b[sortField]
          
          // Handle nested properties
          if (sortField === 'name') {
            aVal = a.user ? `${a.user.first_name} ${a.user.last_name}` : ''
            bVal = b.user ? `${b.user.first_name} ${b.user.last_name}` : ''
          } else if (sortField === 'email') {
            aVal = a.user?.email || ''
            bVal = b.user?.email || ''
          } else if (sortField === 'department') {
            aVal = a.department?.name || ''
            bVal = b.department?.name || ''
          }
          
          if (typeof aVal === 'string') {
            return sortDirection === 'asc' 
              ? aVal.localeCompare(bVal) 
              : bVal.localeCompare(aVal)
          }
          return sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (bVal > aVal ? 1 : -1)
        })
      }
      
      setItems(sortedData)
      const count = raw?.total
      setTotal(typeof count === 'number' ? count : employeeList.length)
      
      // Calculate stats
      calculateStats(employeeList)
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (employeeList) => {
    const active = employeeList.filter(e => e.status === 'active').length
    const inactive = employeeList.filter(e => e.status === 'inactive').length
    
    const deptCount = {}
    employeeList.forEach(emp => {
      const deptName = emp.department?.name || 'Unassigned'
      deptCount[deptName] = (deptCount[deptName] || 0) + 1
    })
    
    setStats({
      total: employeeList.length,
      active,
      inactive,
      departments: deptCount
    })
  }

  const handleArchive = async (id) => {
    if (!confirm('Archive this employee? You can restore them later from the Archived tab.')) return
    setActionLoading(true)
    try {
      await employeeAPI.delete(id)
      await fetchEmployees()
      alert('Employee archived successfully!')
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to archive employee')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRestore = async (id) => {
    if (!confirm('Restore this employee?')) return
    setActionLoading(true)
    try {
      await employeeAPI.restore(id)
      await fetchEmployees()
      alert('Employee restored successfully!')
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to restore employee')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreate = async (payload) => {
    setServerErrors(null)
    setActionLoading(true)
    try {
      await employeeAPI.create(payload)
      setShowCreate(false)
      await fetchEmployees()
    } catch (e) {
      const errors = e.response?.data?.error
      if (errors) setServerErrors(errors)
      else alert(e.message || 'Failed to create employee')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = async (payload) => {
    if (!showEdit?.id) return
    setServerErrors(null)
    setActionLoading(true)
    try {
      await employeeAPI.update(showEdit.id, payload)
      setShowEdit(null)
      await fetchEmployees()
    } catch (e) {
      const errors = e.response?.data?.error
      if (errors) setServerErrors(errors)
      else alert(e.message || 'Failed to update employee')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />
  }

  const exportToPDF = () => {
    // Check if there's data to export
    if (!items || items.length === 0) {
      alert('No employee data to export. Please wait for employees to load or add some employees first.')
      return
    }

    const doc = new jsPDF('l') // landscape orientation for more columns
    
    // Add title
    doc.setFontSize(16)
    doc.text('Employee Report', 14, 15)
    
    // Add date
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22)
    
    // Prepare table data
    const headers = [['Employee #', 'Name', 'Email', 'Department', 'Position', 'Type', 'Hire Date', 'Status']]
    const rows = items.map(emp => [
      emp.employee_number,
      emp.user ? `${emp.user.first_name} ${emp.user.last_name}` : '',
      emp.user?.email || '',
      emp.department?.name || '',
      emp.position || '',
      emp.employment_type || '',
      emp.hire_date || '',
      emp.status || ''
    ])

    // Add table
    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 28,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 }
    })
    
    // Save PDF
    doc.save(`employees_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const getInitials = (emp) => {
    if (!emp.user) return '?'
    const firstName = emp.user.first_name || ''
    const lastName = emp.user.last_name || ''
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || '?'
  }

  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ]
    const charCode = name ? name.charCodeAt(0) : 0
    return colors[charCode % colors.length]
  }

  const getProfilePictureUrl = (url) => {
    if (!url) return null
    return url.startsWith('http') ? url : `http://localhost:8000${url}`
  }

  const formatHireDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const options = { month: 'short', day: 'numeric', year: 'numeric', weekday: 'short' }
    return date.toLocaleDateString('en-US', options)
  }

  const Pagination = () => (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
      <div className="flex items-center gap-2">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  )

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Employees</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={exportToPDF}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
          {canManage && (
            <button onClick={() => { setShowCreate(true); setServerErrors(null) }} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
              New Employee
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Employees</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-full">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Active</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{stats.active}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-full">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Inactive</p>
              <p className="text-2xl font-bold text-gray-700 mt-1">{stats.inactive}</p>
            </div>
            <div className="bg-gray-500 p-3 rounded-full">
              <UserX className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Departments</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">{Object.keys(stats.departments).length}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-full">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Archive Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-4 p-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setArchivedFilter('active'); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              archivedFilter === 'active' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Active Employees
          </button>
          <button
            onClick={() => { setArchivedFilter('archived'); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              archivedFilter === 'archived' 
                ? 'bg-orange-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Archive className="w-4 h-4" />
            Archived
          </button>
          <button
            onClick={() => { setArchivedFilter('all'); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              archivedFilter === 'all' 
                ? 'bg-gray-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Employees
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="relative sm:col-span-2 md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              placeholder="Search name or email" 
              value={search} 
              onChange={(e) => { setPage(1); setSearch(e.target.value) }} 
              onKeyPress={(e) => e.key === 'Enter' && fetchEmployees()}
              className="w-full pl-10 pr-3 py-2 border rounded" 
            />
          </div>
          <select value={departmentFilter} onChange={(e) => { setPage(1); setDepartmentFilter(e.target.value) }} className="border rounded px-3 py-2">
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select value={employmentTypeFilter} onChange={(e) => { setPage(1); setEmploymentTypeFilter(e.target.value) }} className="border rounded px-3 py-2">
            <option value="">All Types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="probationary">Probationary</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }} className="border rounded px-3 py-2">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Hire Date From</label>
            <input 
              type="date" 
              value={hireDateFrom} 
              onChange={(e) => { setPage(1); setHireDateFrom(e.target.value) }} 
              className="border rounded px-3 py-2 w-full" 
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Hire Date To</label>
            <input 
              type="date" 
              value={hireDateTo} 
              onChange={(e) => { setPage(1); setHireDateTo(e.target.value) }} 
              className="border rounded px-3 py-2 w-full" 
            />
          </div>
        </div>
        <div className="mt-3">
          <button 
            onClick={() => { 
              setSearch(''); 
              setDepartmentFilter(''); 
              setStatusFilter(''); 
              setEmploymentTypeFilter('');
              setHireDateFrom('');
              setHireDateTo('');
              setArchivedFilter('active');
              setPage(1);
            }} 
            className="px-4 py-2 border rounded hover:bg-gray-50 text-sm"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200 text-red-700">{error}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  onClick={() => handleSort('employee_number')}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Emp #
                    {getSortIcon('employee_number')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('name')}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Name
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('email')}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Email
                    {getSortIcon('email')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('department')}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Department
                    {getSortIcon('department')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('position')}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Position
                    {getSortIcon('position')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('employment_type')}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Type
                    {getSortIcon('employment_type')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('hire_date')}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Hire Date
                    {getSortIcon('hire_date')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Status
                    {getSortIcon('status')}
                  </div>
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-6 text-center text-gray-600">Loading...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-6 text-center text-gray-600">No employees found.</td>
                </tr>
              ) : (
                items.map((emp) => {
                  const fullName = emp.user ? `${emp.user.first_name} ${emp.user.last_name}` : '-'
                  // Check user profile picture first, then employee profile picture
                  const profilePic = emp.user?.profile_picture || emp.profile_picture
                  return (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{emp.employee_number}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {profilePic ? (
                            <img 
                              src={getProfilePictureUrl(profilePic)} 
                              alt={fullName}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-10 h-10 rounded-full ${getAvatarColor(fullName)} flex items-center justify-center text-white font-semibold`}
                            style={{ display: profilePic ? 'none' : 'flex' }}
                          >
                            {getInitials(emp)}
                          </div>
                          <span className="text-sm text-gray-900 font-medium">{fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{emp.user?.email || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {emp.department?.name ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                            {emp.department.name}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{emp.position || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className="capitalize">{emp.employment_type?.replace('-', ' ') || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatHireDate(emp.hire_date)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {emp.status || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="px-3 py-1 border rounded hover:bg-gray-50 text-sm flex items-center gap-1" onClick={() => setShowView(emp)}>
                            View
                          </button>
                          {canManage && !emp.deleted_at && (
                            <button className="px-3 py-1 border rounded hover:bg-blue-50 text-blue-700 text-sm" onClick={() => { setShowEdit(emp); setServerErrors(null) }}>
                              Edit
                            </button>
                          )}
                          {roleName === 'admin' && (
                            <>
                              {emp.deleted_at ? (
                                <button 
                                  className="px-3 py-1 border rounded hover:bg-green-50 text-green-700 text-sm flex items-center gap-1" 
                                  disabled={actionLoading} 
                                  onClick={() => handleRestore(emp.id)}
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  Restore
                                </button>
                              ) : (
                                <button 
                                  className="px-3 py-1 border rounded hover:bg-orange-50 text-orange-700 text-sm flex items-center gap-1" 
                                  disabled={actionLoading} 
                                  onClick={() => handleArchive(emp.id)}
                                >
                                  <Archive className="w-3 h-3" />
                                  Archive
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t">
          <Pagination />
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Create Employee" onClose={() => setShowCreate(false)}>
          <EmployeeForm
            key="create-employee-form"
            initialData={null}
            departments={departments}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            loading={actionLoading}
            serverErrors={serverErrors}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <Modal title="Edit Employee" onClose={() => setShowEdit(null)}>
          <EmployeeForm
            key={`edit-employee-${showEdit.id}`}
            initialData={showEdit}
            departments={departments}
            onSubmit={handleEdit}
            onCancel={() => setShowEdit(null)}
            loading={actionLoading}
            serverErrors={serverErrors}
          />
        </Modal>
      )}

      {/* View Modal */}
      {showView && (
        <Modal title="Employee Details" onClose={() => setShowView(null)}>
          <EmployeeView employee={showView} />
        </Modal>
      )}
    </div>
  )
}

