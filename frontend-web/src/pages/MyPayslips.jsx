import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { payrollAPI } from '../services/api'
import { DollarSign, FileText, Calendar, Filter, Download, Search, Eye } from 'lucide-react'
import PayrollView from '../components/payroll/PayrollView'

export default function MyPayslips() {
  const { user } = useAuth()
  
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [showView, setShowView] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  // Stats for employee's payslips
  const [stats, setStats] = useState({
    totalPayslips: 0,
    totalEarnings: 0,
    totalDeductions: 0,
    totalNetPay: 0,
  })

  const totalPages = useMemo(() => {
    if (!total || !perPage) return 1
    return Math.max(1, Math.ceil(total / perPage))
  }, [total, perPage])

  useEffect(() => {
    fetchMyPayslips()
  }, [page, search, statusFilter, periodFilter, dateFrom, dateTo])

  useEffect(() => {
    calculateStats()
  }, [items])

  const fetchMyPayslips = async () => {
    if (!user?.employee?.id) {
      setError('Employee information not found')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const params = { page, per_page: perPage, employee_id: user.employee.id }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      if (periodFilter) params.payroll_period = periodFilter
      if (dateFrom && dateTo) {
        params.date_from = dateFrom
        params.date_to = dateTo
      }

      const res = await payrollAPI.getAll(params)
      const raw = res.data
      const data = raw?.data || raw || []
      setItems(Array.isArray(data) ? data : [])
      const count = raw?.total
      setTotal(typeof count === 'number' ? count : (Array.isArray(data) ? data.length : 0))
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to load payslips')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    if (!items || items.length === 0) {
      setStats({ totalPayslips: 0, totalEarnings: 0, totalDeductions: 0, totalNetPay: 0 })
      return
    }

    const totalEarnings = items.reduce((sum, p) => sum + parseFloat(p.total_earnings || 0), 0)
    const totalDeductions = items.reduce((sum, p) => sum + parseFloat(p.total_deductions || 0), 0)
    const totalNetPay = items.reduce((sum, p) => sum + parseFloat(p.net_pay || 0), 0)

    setStats({
      totalPayslips: items.length,
      totalEarnings,
      totalDeductions,
      totalNetPay,
    })
  }

  const handleDownloadPayslip = async (id) => {
    setDownloadingId(id)
    try {
      const response = await payrollAPI.generatePayslip(id)
      // Handle payslip download
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `payslip-${id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to download payslip')
    } finally {
      setDownloadingId(null)
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
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Payslips</h1>
          <p className="text-gray-600 mt-1">View your payslip history and download pay stubs</p>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-8 h-8 text-primary-600" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Payslips</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalPayslips}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalEarnings)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Deductions</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalDeductions)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Net Pay</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalNetPay)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-600" />
          <h2 className="font-semibold text-gray-700">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input 
            placeholder="Search period..." 
            value={search} 
            onChange={(e) => { setPage(1); setSearch(e.target.value) }} 
            className="border rounded px-3 py-2" 
          />
          <input
            type="month"
            placeholder="Payroll Period"
            value={periodFilter}
            onChange={(e) => { setPage(1); setPeriodFilter(e.target.value) }}
            className="border rounded px-3 py-2"
          />
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
          <select 
            value={statusFilter} 
            onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }} 
            className="border rounded px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="processed">Processed</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
          <button 
            onClick={() => { setSearch(''); setPeriodFilter(''); setDateFrom(''); setDateTo(''); setStatusFilter(''); setPage(1) }} 
            className="px-3 py-2 border rounded hover:bg-gray-50"
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Salary</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Earnings</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-6 text-center text-gray-600">Loading payslips...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-6 text-center text-gray-600">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                    <p>No payslips found.</p>
                    <p className="text-sm text-gray-500 mt-1">Your payslips will appear here once processed.</p>
                  </td>
                </tr>
              ) : (
                items.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {payroll.payroll_period || '-'}
                    </td>
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
                          className="px-3 py-1 border rounded hover:bg-gray-50 flex items-center gap-1 text-sm" 
                          onClick={() => setShowView(payroll)}
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        <button 
                          className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center gap-1 text-sm disabled:opacity-50" 
                          onClick={() => handleDownloadPayslip(payroll.id)}
                          disabled={downloadingId === payroll.id}
                        >
                          <Download className="w-3 h-3" />
                          {downloadingId === payroll.id ? 'Downloading...' : 'Download'}
                        </button>
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

      {/* View Modal */}
      {showView && (
        <Modal title="Payslip Details" onClose={() => setShowView(null)} size="max-w-3xl">
          <PayrollView payroll={showView} />
          <div className="mt-4 flex justify-end">
            <button 
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center gap-2"
              onClick={() => handleDownloadPayslip(showView.id)}
              disabled={downloadingId === showView.id}
            >
              <Download className="w-4 h-4" />
              {downloadingId === showView.id ? 'Downloading...' : 'Download Payslip'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
