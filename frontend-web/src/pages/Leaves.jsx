import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { leaveAPI } from '../services/api'
import LeaveForm from '../components/leaves/LeaveForm'
import LeaveView from '../components/leaves/LeaveView'
import { Calendar, Clock, CheckCircle, XCircle, Download, Search, ArrowUpDown, ArrowUp, ArrowDown, FileText, Trash2, AlertTriangle } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Leaves() {
  const { user } = useAuth()
  
  // Annual leave limit
  const ANNUAL_LEAVE_LIMIT = 15
  
  // Role-based access control
  const isAdmin = user?.role === 'admin'
  const isEmployee = user?.role === 'employee'
  const canManageLeaves = isAdmin
  
  // Admin should default to 'all' tab since they don't have "My Requests"
  const [tab, setTab] = useState(isEmployee ? 'my' : 'all') // 'my' | 'all'
  const [myItems, setMyItems] = useState([])
  const [allItems, setAllItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Sorting
  const [sortField, setSortField] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalDays: 0,
    usedDays: 0,
    remainingDays: ANNUAL_LEAVE_LIMIT
  })

  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [total, setTotal] = useState(0)

  const [showCreate, setShowCreate] = useState(false)
  const [showView, setShowView] = useState(null)
  const [serverErrors, setServerErrors] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  // In a real app we would fetch leave types; for now use a small fallback list
  const [leaveTypes, setLeaveTypes] = useState([
    { id: 1, name: 'Vacation' },
    { id: 2, name: 'Sick' },
    { id: 3, name: 'Emergency' },
  ])

  const totalPages = useMemo(() => {
    if (!total || !perPage) return 1
    return Math.max(1, Math.ceil(total / perPage))
  }, [total, perPage])

  useEffect(() => {
    // Employees can only access their own requests
    if (tab === 'my' || isEmployee) fetchMy()
    else fetchAll()
  }, [tab, page, statusFilter, dateFrom, dateTo, leaveTypeFilter, searchTerm, sortField, sortDirection])

  const extractList = (raw) => {
    const data = raw?.data || raw || []
    return Array.isArray(data) ? data : []
  }

  const extractTotal = (raw, list) => {
    const count = raw?.total
    return typeof count === 'number' ? count : (Array.isArray(list) ? list.length : 0)
  }

  const fetchMy = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, per_page: perPage }
      if (statusFilter) params.status = statusFilter
      if (leaveTypeFilter) params.leave_type_id = leaveTypeFilter
      if (dateFrom && dateTo) { params.date_from = dateFrom; params.date_to = dateTo }
      
      // For employees, filter by their employee_id at the API level
      const employeeId = user?.employee?.id
      if (isEmployee && employeeId) {
        params.employee_id = employeeId
      }

      const res = await leaveAPI.getAll(params)
      let list = extractList(res.data)
      // Additional client-side filter as fallback
      let mine = (isEmployee && employeeId) ? list.filter(l => l.employee_id === employeeId) : list

      // Apply sorting
      mine = applySort(mine)

      setMyItems(mine)
      setTotal(extractTotal(res.data, mine))
      calculateStats(mine)
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to load leaves')
    } finally {
      setLoading(false)
    }
  }

  const fetchAll = async () => {
    // Employees should not access this function
    if (isEmployee) {
      console.warn('Employees cannot access all leave requests')
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const params = { page, per_page: perPage }
      if (statusFilter) params.status = statusFilter
      if (leaveTypeFilter) params.leave_type_id = leaveTypeFilter
      if (dateFrom && dateTo) { params.date_from = dateFrom; params.date_to = dateTo }

      const res = await leaveAPI.getAll(params)
      let list = extractList(res.data)

      // Client-side search
      if (searchTerm) {
        list = list.filter(l => {
          const name = l.employee?.user ? `${l.employee.user.first_name} ${l.employee.user.last_name}`.toLowerCase() : ''
          const reason = l.reason?.toLowerCase() || ''
          return name.includes(searchTerm.toLowerCase()) || reason.includes(searchTerm.toLowerCase())
        })
      }

      // Apply sorting
      list = applySort(list)

      setAllItems(list)
      setTotal(extractTotal(res.data, list))
      calculateStats(list)
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to load leaves')
    } finally {
      setLoading(false)
    }
  }

  const applySort = (list) => {
    if (!sortField || list.length === 0) return list

    return [...list].sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      if (sortField === 'employee') {
        aVal = a.employee?.user ? `${a.employee.user.first_name} ${a.employee.user.last_name}` : ''
        bVal = b.employee?.user ? `${b.employee.user.first_name} ${b.employee.user.last_name}` : ''
      } else if (sortField === 'type') {
        aVal = displayType(a)
        bVal = displayType(b)
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      if (typeof aVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })
  }

  const calculateStats = (list) => {
    const pending = list.filter(l => l.status === 'pending').length
    const approved = list.filter(l => l.status === 'approved').length
    const rejected = list.filter(l => l.status === 'rejected').length
    const totalDays = list.reduce((sum, l) => sum + (parseInt(l.days_count) || 0), 0)

    // Calculate used days for current year (only approved leaves)
    const currentYear = new Date().getFullYear()
    const usedDays = list
      .filter(l => {
        if (l.status !== 'approved') return false
        const startDate = new Date(l.start_date)
        return startDate.getFullYear() === currentYear
      })
      .reduce((sum, l) => sum + (parseInt(l.days_count) || 0), 0)
    
    const remainingDays = Math.max(0, ANNUAL_LEAVE_LIMIT - usedDays)

    setStats({ pending, approved, rejected, totalDays, usedDays, remainingDays })
  }

  const handleCreate = async (payload) => {
    setServerErrors(null)
    setActionLoading(true)
    try {
      await leaveAPI.create(payload)
      setShowCreate(false)
      if (tab === 'my') await fetchMy(); else await fetchAll()
    } catch (e) {
      const errors = e.response?.data?.error
      if (errors) setServerErrors(errors)
      else alert(e.message || 'Failed to submit leave request')
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async (id) => {
    setActionLoading(true)
    try {
      await leaveAPI.approve(id, { notes: '' })
      if (tab === 'my') await fetchMy(); else await fetchAll()
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to approve')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (id) => {
    const notes = prompt('Optional notes for rejection:') || ''
    setActionLoading(true)
    try {
      await leaveAPI.reject(id, { notes })
      if (tab === 'my') await fetchMy(); else await fetchAll()
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to reject')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setActionLoading(true)
    try {
      await leaveAPI.delete(id)
      setShowDeleteConfirm(null)
      if (tab === 'my') await fetchMy(); else await fetchAll()
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to delete leave request')
    } finally {
      setActionLoading(false)
    }
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

  const Modal = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )

  const ConfirmDeleteModal = ({ leave, onClose, onConfirm }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Confirm Delete</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this leave request?
            {leave && (
              <span className="block mt-2 text-sm">
                <strong>Type:</strong> {displayType(leave)}<br />
                <strong>Dates:</strong> {leave.start_date} to {leave.end_date}
              </span>
            )}
          </p>
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const displayType = (l) => {
    if (l.leaveType?.name) return l.leaveType.name
    const fallback = leaveTypes.find(t => String(t.id) === String(l.leave_type_id))
    if (fallback?.name) return fallback.name
    return `#${l.leave_type_id ?? ''}`
  }

  const formatDateWithDay = (dateString) => {
    if (!dateString) return ''
    // Extract just the date part (YYYY-MM-DD) from ISO format
    const dateOnly = dateString.split('T')[0]
    const date = new Date(dateOnly + 'T00:00:00')
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayName = days[date.getDay()]
    return `${dateOnly} (${dayName})`
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
    const data = tab === 'my' ? myItems : allItems
    
    // Check if there's data to export
    if (!data || data.length === 0) {
      alert('No leave data to export. Please wait for leave requests to load or create some leave requests first.')
      return
    }

    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(16)
    doc.text(`Leave Report - ${tab === 'my' ? 'My Requests' : 'All Requests'}`, 14, 15)
    
    // Add date
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22)
    
    // Prepare table data
    const headers = tab === 'all' 
      ? [['Employee', 'Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status']]
      : [['Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status']]

    const rows = data.map(l => {
      const row = [
        displayType(l),
        l.start_date || '',
        l.end_date || '',
        l.days_count || '',
        l.reason || '',
        l.status || ''
      ]
      if (tab === 'all') {
        const empName = l.employee?.user ? `${l.employee.user.first_name} ${l.employee.user.last_name}` : `#${l.employee_id}`
        row.unshift(empName)
      }
      return row
    })

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
    doc.save(`leaves_${tab}_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const Table = ({ data, showEmployee }) => (
    <div className="bg-white rounded-lg shadow">
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200 text-red-700">{error}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {showEmployee && (
                <th 
                  onClick={() => handleSort('employee')}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-1">
                    Employee
                    {getSortIcon('employee')}
                  </div>
                </th>
              )}
              <th 
                onClick={() => handleSort('type')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  Type
                  {getSortIcon('type')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('start_date')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  Start
                  {getSortIcon('start_date')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('end_date')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  End
                  {getSortIcon('end_date')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('days_count')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  Days
                  {getSortIcon('days_count')}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
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
              <tr><td colSpan={showEmployee ? 8 : 7} className="px-4 py-6 text-center text-gray-600">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={showEmployee ? 8 : 7} className="px-4 py-6 text-center text-gray-600">No leaves found.</td></tr>
            ) : (
              data.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  {showEmployee && (
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {l.employee?.user ? `${l.employee.user.first_name} ${l.employee.user.last_name}` : `#${l.employee_id}`}
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                      {displayType(l)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDateWithDay(l.start_date)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDateWithDay(l.end_date)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-semibold text-gray-900">{l.days_count}</span>
                    <span className="text-gray-500 text-xs ml-1">days</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 truncate max-w-xs" title={l.reason}>{l.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                      l.status === 'approved' ? 'bg-green-100 text-green-800' : l.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>{l.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        className="px-3 py-1 border rounded hover:bg-gray-50 text-gray-700 transition-colors" 
                        onClick={() => setShowView(l)}
                      >
                        View
                      </button>
                      {tab === 'all' && l.status === 'pending' && canManageLeaves && (
                        <>
                          <button 
                            className="px-3 py-1 border border-green-600 rounded hover:bg-green-50 text-green-700 transition-colors" 
                            disabled={actionLoading} 
                            onClick={() => handleApprove(l.id)}
                          >
                            Approve
                          </button>
                          <button 
                            className="px-3 py-1 border border-red-600 rounded hover:bg-red-50 text-red-700 transition-colors" 
                            disabled={actionLoading} 
                            onClick={() => handleReject(l.id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {/* Show delete button for own requests (pending only) or admin can delete any */}
                      {((tab === 'my' && l.status === 'pending') || (isAdmin && tab === 'all')) && (
                        <button 
                          className="p-2 border border-red-600 rounded hover:bg-red-50 text-red-700 transition-colors" 
                          disabled={actionLoading} 
                          onClick={() => setShowDeleteConfirm(l)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t">
        <Pagination />
      </div>
    </div>
  )

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Leaves</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={exportToPDF}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
          {isEmployee && (
            <button 
              onClick={() => { setShowCreate(true); setServerErrors(null) }} 
              disabled={stats.remainingDays === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title={stats.remainingDays === 0 ? 'No leave days remaining' : ''}
            >
              Request Leave
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">{isEmployee ? 'My Pending' : 'Pending'}</p>
              <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.pending}</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-full">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">{isEmployee ? 'My Approved' : 'Approved'}</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{stats.approved}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">{isEmployee ? 'My Rejected' : 'Rejected'}</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{stats.rejected}</p>
            </div>
            <div className="bg-red-500 p-3 rounded-full">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">{isEmployee ? 'My Total Days' : 'Total Days'}</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{stats.totalDays}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Leave Balance Card - Only for Employees */}
      {isEmployee && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Annual Leave Balance</h3>
              <div className="flex items-baseline gap-3">
                <div>
                  <p className="text-xs opacity-90">Used This Year</p>
                  <p className="text-3xl font-bold">{stats.usedDays}</p>
                </div>
                <div className="text-2xl font-light opacity-75">/</div>
                <div>
                  <p className="text-xs opacity-90">Total Allowed</p>
                  <p className="text-3xl font-bold">{ANNUAL_LEAVE_LIMIT}</p>
                </div>
                <div className="text-2xl font-light opacity-75">=</div>
                <div>
                  <p className="text-xs opacity-90">Remaining</p>
                  <p className={`text-3xl font-bold ${stats.remainingDays <= 3 ? 'text-yellow-300' : stats.remainingDays === 0 ? 'text-red-300' : ''}`}>
                    {stats.remainingDays}
                  </p>
                </div>
              </div>
              {stats.remainingDays === 0 && (
                <div className="mt-3 bg-white/20 backdrop-blur-sm rounded px-3 py-2 text-sm">
                  ⚠️ You have reached your annual leave limit. Limit resets on January 1st.
                </div>
              )}
              {stats.remainingDays > 0 && stats.remainingDays <= 3 && (
                <div className="mt-3 bg-yellow-500/30 backdrop-blur-sm rounded px-3 py-2 text-sm">
                  ⚠️ You have only {stats.remainingDays} day{stats.remainingDays !== 1 ? 's' : ''} remaining.
                </div>
              )}
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
              <FileText className="w-8 h-8" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs - Show My Requests for employees only, All Requests for admin/HR */}
      <div className="mb-4">
        <div className="inline-flex border rounded overflow-hidden">
          {isEmployee && (
            <button className={`px-4 py-2 ${tab === 'my' ? 'bg-primary-600 text-white' : 'bg-white'}`} onClick={() => { setTab('my'); setPage(1) }}>My Requests</button>
          )}
          {canManageLeaves && (
            <button className={`px-4 py-2 ${tab === 'all' ? 'bg-primary-600 text-white' : 'bg-white'}`} onClick={() => { setTab('all'); setPage(1) }}>All Requests</button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {tab === 'all' && canManageLeaves && (
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search employee or reason..."
                value={searchTerm}
                onChange={(e) => { setPage(1); setSearchTerm(e.target.value) }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setPage(1);
                    if (tab === 'my' || isEmployee) fetchMy(); else fetchAll();
                  }
                }}
                className="w-full pl-10 pr-3 py-2 border rounded"
              />
            </div>
          )}
          <select value={leaveTypeFilter} onChange={(e) => { setPage(1); setLeaveTypeFilter(e.target.value) }} className="border rounded px-3 py-2">
            <option value="">All Types</option>
            {leaveTypes.map((type) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }} className="border rounded px-3 py-2">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <input 
            type="date" 
            placeholder="From Date"
            value={dateFrom} 
            onChange={(e) => { setPage(1); setDateFrom(e.target.value) }} 
            className="border rounded px-3 py-2" 
          />
          <input 
            type="date" 
            placeholder="To Date"
            value={dateTo} 
            onChange={(e) => { setPage(1); setDateTo(e.target.value) }} 
            className="border rounded px-3 py-2" 
          />
        </div>
        <div className="mt-3">
          <button 
            onClick={() => { 
              setStatusFilter(''); 
              setLeaveTypeFilter('');
              setDateFrom(''); 
              setDateTo(''); 
              setSearchTerm('');
              setPage(1);
            }} 
            className="px-4 py-2 border rounded hover:bg-gray-50 text-sm"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Tables */}
      {tab === 'my' || isEmployee ? (
        <Table data={myItems} showEmployee={false} />
      ) : (
        <Table data={allItems} showEmployee={true} />
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Request Leave" onClose={() => setShowCreate(false)}>
          <LeaveForm
            leaveTypes={leaveTypes}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            loading={actionLoading}
            serverErrors={serverErrors}
            remainingDays={stats.remainingDays}
            annualLimit={ANNUAL_LEAVE_LIMIT}
          />
        </Modal>
      )}

      {/* View Modal */}
      {showView && (
        <Modal title="Leave Details" onClose={() => setShowView(null)}>
          <LeaveView leave={showView} leaveTypes={leaveTypes} />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <ConfirmDeleteModal 
          leave={showDeleteConfirm} 
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={() => handleDelete(showDeleteConfirm.id)}
        />
      )}
    </div>
  )
}

