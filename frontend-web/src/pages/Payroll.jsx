import { useEffect, useMemo, useState } from 'react'
import { payrollAPI, employeeAPI } from '../services/api'
import { DollarSign, FileText, Calendar, Filter, Unlock, Trash2 } from 'lucide-react'
import PayrollForm from '../components/payroll/PayrollForm'
import PayrollView from '../components/payroll/PayrollView'
import { isAdmin } from '../utils/permissions'

export default function Payroll() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState('')

  const [showProcess, setShowProcess] = useState(false)
  const [showView, setShowView] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [serverErrors, setServerErrors] = useState(null)
  const [user, setUser] = useState(null)

  const totalPages = useMemo(() => {
    if (!total || !perPage) return 1
    return Math.max(1, Math.ceil(total / perPage))
  }, [total, perPage])

  useEffect(() => {
    fetchEmployees()
    // Get current user from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      console.log('Payroll - Current User:', parsedUser)
      console.log('Payroll - User Role:', parsedUser?.role)
      console.log('Payroll - Is Admin:', isAdmin(parsedUser))
    } else {
      console.log('Payroll - No user found in localStorage')
    }
  }, [])

  useEffect(() => {
    fetchPayrolls()
  }, [page, search, statusFilter, periodFilter, employeeFilter])

  const fetchEmployees = async () => {
    try {
      const res = await employeeAPI.getAll({ per_page: 1000 })
      const data = res.data?.data || res.data || []
      setEmployees(Array.isArray(data) ? data : [])
    } catch (e) {
      // ignore for now; select will be empty
    }
  }

  const fetchPayrolls = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, per_page: perPage }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      if (periodFilter) params.payroll_period = periodFilter
      if (employeeFilter) params.employee_id = employeeFilter

      const res = await payrollAPI.getAll(params)
      const raw = res.data
      const data = raw?.data || raw || []
      setItems(Array.isArray(data) ? data : [])
      const count = raw?.total
      setTotal(typeof count === 'number' ? count : (Array.isArray(data) ? data.length : 0))
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to load payroll records')
    } finally {
      setLoading(false)
    }
  }

  const handleProcess = async (payload) => {
    setServerErrors(null)
    setActionLoading(true)
    try {
      await payrollAPI.process(payload)
      setShowProcess(false)
      await fetchPayrolls()
    } catch (e) {
      const errors = e.response?.data?.error
      if (errors) setServerErrors(errors)
      else alert(e.message || 'Failed to process payroll')
    } finally {
      setActionLoading(false)
    }
  }

  const handleGeneratePayslip = async (id) => {
    try {
      const response = await payrollAPI.generatePayslip(id)
      
      // Verify we received valid PDF data
      if (!response.data || response.data.size === 0) {
        throw new Error('Received empty PDF data')
      }
      
      // Create blob with proper PDF MIME type
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      
      // Open in new tab
      const newWindow = window.open(url, '_blank')
      
      // Clean up the URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100)
      
      if (!newWindow) {
        alert('Please allow popups to view the payslip')
      }
    } catch (e) {
      console.error('Payslip generation error:', e)
      const errorMsg = e.response?.data?.error || e.message || 'Failed to generate payslip'
      alert(errorMsg)
    }
  }

  const handleUnlock = async (id) => {
    if (!confirm('Are you sure you want to unlock this payroll? This will allow modifications or deletion.')) {
      return
    }
    
    try {
      await payrollAPI.unlock(id)
      await fetchPayrolls()
      alert('Payroll unlocked successfully')
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to unlock payroll')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this payroll? This action cannot be undone.')) {
      return
    }
    
    try {
      await payrollAPI.delete(id)
      await fetchPayrolls()
      alert('Payroll deleted successfully')
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to delete payroll')
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return '₱0.00'
    return `₱${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'processed': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'paid': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const Modal = ({ title, onClose, children, size = 'max-w-4xl' }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className={`relative bg-white rounded-lg shadow-xl w-full ${size} max-h-[90vh] overflow-auto`}>
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Payroll Management</h1>
        <button 
          onClick={() => { setShowProcess(true); setServerErrors(null) }} 
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center gap-2"
        >
          <DollarSign className="w-4 h-4" />
          Process Payroll
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-600" />
          <h2 className="font-semibold text-gray-700">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input 
              placeholder="Search employee name..." 
              value={search} 
              onChange={(e) => { setPage(1); setSearch(e.target.value) }} 
              onKeyPress={(e) => e.key === 'Enter' && fetchPayrolls()}
              className="border rounded px-3 py-2 w-full" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <select 
              value={employeeFilter} 
              onChange={(e) => { setPage(1); setEmployeeFilter(e.target.value) }} 
              className="border rounded px-3 py-2 w-full"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.user ? `${emp.user.first_name} ${emp.user.last_name}` : `Emp #${emp.employee_number}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <input
              type="month"
              value={periodFilter}
              onChange={(e) => { setPage(1); setPeriodFilter(e.target.value) }}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
        </div>
        <div className="mt-3">
          <button 
            onClick={() => { setSearch(''); setEmployeeFilter(''); setPeriodFilter(''); setStatusFilter(''); setPage(1) }} 
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Reset
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Salary</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Earnings</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-6 text-center text-gray-600">Loading...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-6 text-center text-gray-600">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                    <p>No payroll records found.</p>
                  </td>
                </tr>
              ) : (
                items.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {payroll.employee?.user 
                        ? `${payroll.employee.user.first_name} ${payroll.employee.user.last_name}`
                        : `Emp #${payroll.employee?.employee_number || payroll.employee_id}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{payroll.payroll_period || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(payroll.pay_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{formatCurrency(payroll.base_salary)}</td>
                    <td className="px-4 py-3 text-sm text-green-700 font-semibold">{formatCurrency(payroll.total_earnings)}</td>
                    <td className="px-4 py-3 text-sm text-red-700 font-semibold">{formatCurrency(payroll.total_deductions)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-bold">{formatCurrency(payroll.net_pay)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getStatusColor(payroll.status)}`}>
                        {payroll.status || 'draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="px-3 py-1 border rounded hover:bg-gray-50 flex items-center gap-1" 
                          onClick={() => setShowView(payroll)}
                        >
                          <FileText className="w-3 h-3" />
                          View
                        </button>
                        <button 
                          className="px-3 py-1 border rounded hover:bg-blue-50 text-blue-700" 
                          onClick={() => handleGeneratePayslip(payroll.id)}
                        >
                          Payslip
                        </button>
                        {/* Debug: Show user role */}
                        {console.log('Rendering payroll row - Payroll ID:', payroll.id, 'is_locked:', payroll.is_locked, 'Type:', typeof payroll.is_locked)}
                        {isAdmin(user) && (
                          <>
                            {payroll.is_locked ? (
                              <button 
                                className="px-3 py-1 border rounded hover:bg-yellow-50 text-yellow-700 flex items-center gap-1" 
                                onClick={() => handleUnlock(payroll.id)}
                                title="Unlock payroll"
                              >
                                <Unlock className="w-3 h-3" />
                                Unlock
                              </button>
                            ) : (
                              <button 
                                className="px-3 py-1 border rounded hover:bg-red-50 text-red-700 flex items-center gap-1" 
                                onClick={() => handleDelete(payroll.id)}
                                title="Delete payroll"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            )}
                          </>
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

      {/* Process Payroll Modal */}
      {showProcess && (
        <Modal title="Process Payroll" onClose={() => setShowProcess(false)}>
          <PayrollForm
            employees={employees}
            onSubmit={handleProcess}
            onCancel={() => setShowProcess(false)}
            loading={actionLoading}
            serverErrors={serverErrors}
          />
        </Modal>
      )}

      {/* View Modal */}
      {showView && (
        <Modal title="Payroll Details" onClose={() => setShowView(null)} size="max-w-3xl">
          <PayrollView payroll={showView} />
        </Modal>
      )}
    </div>
  )
}
