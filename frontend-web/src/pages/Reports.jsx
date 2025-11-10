import { useState, useEffect } from 'react'
import { TrendingUp, Clock, Calendar, Building, Download, Search } from 'lucide-react'
import api from '../services/api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Reports() {
  const [activeTab, setActiveTab] = useState('payroll')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Payroll Report State
  const [payrollData, setPayrollData] = useState({ summary: {}, data: [] })
  const [payrollFilters, setPayrollFilters] = useState({
    period: '',
    department_id: ''
  })

  // Attendance Report State
  const [attendanceData, setAttendanceData] = useState({ summary: {}, data: [] })
  const [attendanceFilters, setAttendanceFilters] = useState({
    date_from: '',
    date_to: '',
    department_id: ''
  })

  // Leave Report State
  const [leaveData, setLeaveData] = useState({ summary: {}, data: [] })
  const [leaveFilters, setLeaveFilters] = useState({
    date_from: '',
    date_to: '',
    status: ''
  })

  // Department Report State
  const [departmentData, setDepartmentData] = useState({ departments: [] })
  const [departments, setDepartments] = useState([])

  // Fetch departments for filters
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/departments')
        setDepartments(response.data.data || response.data)
      } catch (err) {
        console.error('Error fetching departments:', err)
      }
    }
    fetchDepartments()
  }, [])

  // Fetch report functions
  const fetchPayrollReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/reports/payroll', { params: payrollFilters })
      console.log('Payroll Report Response:', response.data)
      setPayrollData(response.data)
    } catch (err) {
      setError('Failed to load payroll report')
      console.error('Payroll Report Error:', err)
      console.error('Error Response:', err.response?.data)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceReport = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Fetching attendance report with filters:', attendanceFilters)
      const response = await api.get('/reports/attendance', { params: attendanceFilters })
      console.log('Attendance Report Response:', response.data)
      console.log('Attendance Report Data Type:', typeof response.data)
      console.log('Attendance Report Data.data:', response.data?.data)
      
      // Ensure we always set valid data structure
      if (response.data) {
        setAttendanceData({
          summary: response.data.summary || {},
          data: Array.isArray(response.data.data) ? response.data.data : []
        })
      } else {
        setAttendanceData({ summary: {}, data: [] })
      }
    } catch (err) {
      setError('Failed to load attendance report: ' + (err.response?.data?.message || err.message))
      console.error('Attendance Report Error:', err)
      console.error('Error Response:', err.response?.data)
      // Set empty data on error
      setAttendanceData({ summary: {}, data: [] })
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaveReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/reports/leaves', { params: leaveFilters })
      console.log('Leave Report Response:', response.data)
      setLeaveData(response.data)
    } catch (err) {
      setError('Failed to load leave report')
      console.error('Leave Report Error:', err)
      console.error('Error Response:', err.response?.data)
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartmentReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/reports/department')
      setDepartmentData(response.data)
    } catch (err) {
      setError('Failed to load department report')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch department report automatically when tab changes (only for department report)
  useEffect(() => {
    if (activeTab === 'department') {
      fetchDepartmentReport()
    }
  }, [activeTab])

  const tabs = [
    { id: 'payroll', name: 'Payroll Report', icon: TrendingUp },
    { id: 'attendance', name: 'Attendance Report', icon: Clock },
    { id: 'leave', name: 'Leave Report', icon: Calendar },
    { id: 'department', name: 'Department Report', icon: Building },
  ]

  // Export report to PDF
  const exportReport = () => {
    const doc = new jsPDF()
    let filename = ''
    let reportTitle = ''
    let yPos = 0
    const currentDate = new Date().toLocaleString()

    switch (activeTab) {
      case 'payroll':
        if (!payrollData.data || payrollData.data.length === 0) {
          alert('No data to export. Please generate a report first.')
          return
        }
        filename = `Payroll_Report_${new Date().toISOString().split('T')[0]}.pdf`
        reportTitle = 'Payroll Report'
        
        // Title
        doc.setFontSize(18)
        doc.text(reportTitle, 105, 15, { align: 'center' })
        doc.setFontSize(10)
        doc.text(`Generated on: ${currentDate}`, 105, 22, { align: 'center' })
        
        // Summary
        doc.setFontSize(12)
        doc.text('Summary', 14, 32)
        doc.setFontSize(10)
        yPos = 38
        doc.text(`Total Employees: ${payrollData.summary?.total_employees || 0}`, 14, yPos)
        doc.text(`Total Earnings: ₱${(payrollData.summary?.total_earnings || 0).toLocaleString()}`, 14, yPos + 6)
        doc.text(`Total Deductions: ₱${(payrollData.summary?.total_deductions || 0).toLocaleString()}`, 14, yPos + 12)
        doc.text(`Net Pay: ₱${(payrollData.summary?.total_net_pay || 0).toLocaleString()}`, 14, yPos + 18)
        
        // Table
        const payrollTableData = payrollData.data.map(item => [
          `${item.employee?.user?.first_name} ${item.employee?.user?.last_name}`,
          item.employee?.department?.name || 'N/A',
          item.payroll_period,
          `₱${(item.total_earnings || 0).toLocaleString()}`,
          `₱${(item.total_deductions || 0).toLocaleString()}`,
          `₱${(item.net_pay || 0).toLocaleString()}`
        ])
        
        autoTable(doc, {
          startY: yPos + 25,
          head: [['Employee', 'Department', 'Period', 'Earnings', 'Deductions', 'Net Pay']],
          body: payrollTableData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 8 }
        })
        break

      case 'attendance':
        if (!attendanceData.data || attendanceData.data.length === 0) {
          alert('No data to export. Please generate a report first.')
          return
        }
        filename = `Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`
        reportTitle = 'Attendance Report'
        
        // Title
        doc.setFontSize(18)
        doc.text(reportTitle, 105, 15, { align: 'center' })
        doc.setFontSize(10)
        doc.text(`Generated on: ${currentDate}`, 105, 22, { align: 'center' })
        
        // Summary
        doc.setFontSize(12)
        doc.text('Summary', 14, 32)
        doc.setFontSize(10)
        yPos = 38
        doc.text(`Total Records: ${attendanceData.summary?.total_records || 0}`, 14, yPos)
        doc.text(`Present Days: ${attendanceData.summary?.present_days || 0}`, 14, yPos + 6)
        doc.text(`Hours Worked: ${(attendanceData.summary?.total_hours_worked || 0).toFixed(1)}`, 14, yPos + 12)
        doc.text(`Overtime: ${(attendanceData.summary?.total_overtime_hours || 0).toFixed(1)}`, 14, yPos + 18)
        
        // Table
        const attendanceTableData = attendanceData.data.map(item => [
          `${item.employee?.user?.first_name} ${item.employee?.user?.last_name}`,
          item.attendance_date,
          item.time_in || 'N/A',
          item.time_out || 'N/A',
          (parseFloat(item.hours_worked) || 0).toFixed(1),
          (parseFloat(item.overtime_hours) || 0).toFixed(1),
          item.is_present ? 'Present' : 'Absent'
        ])
        
        autoTable(doc, {
          startY: yPos + 25,
          head: [['Employee', 'Date', 'Time In', 'Time Out', 'Hours', 'Overtime', 'Status']],
          body: attendanceTableData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 8 }
        })
        break

      case 'leave':
        if (!leaveData.data || leaveData.data.length === 0) {
          alert('No data to export. Please generate a report first.')
          return
        }
        filename = `Leave_Report_${new Date().toISOString().split('T')[0]}.pdf`
        reportTitle = 'Leave Report'
        
        // Title
        doc.setFontSize(18)
        doc.text(reportTitle, 105, 15, { align: 'center' })
        doc.setFontSize(10)
        doc.text(`Generated on: ${currentDate}`, 105, 22, { align: 'center' })
        
        // Summary
        doc.setFontSize(12)
        doc.text('Summary', 14, 32)
        doc.setFontSize(10)
        yPos = 38
        doc.text(`Total Requests: ${leaveData.summary?.total_requests || 0}`, 14, yPos)
        doc.text(`Total Days: ${leaveData.summary?.total_days || 0}`, 14, yPos + 6)
        doc.text(`Approved: ${leaveData.summary?.approved || 0}`, 14, yPos + 12)
        doc.text(`Pending: ${leaveData.summary?.pending || 0}`, 14, yPos + 18)
        doc.text(`Rejected: ${leaveData.summary?.rejected || 0}`, 14, yPos + 24)
        
        // Table
        const leaveTableData = leaveData.data.map(item => [
          `${item.employee?.user?.first_name} ${item.employee?.user?.last_name}`,
          item.leave_type?.name || 'N/A',
          item.start_date,
          item.end_date,
          item.days_count,
          item.status.charAt(0).toUpperCase() + item.status.slice(1)
        ])
        
        autoTable(doc, {
          startY: yPos + 30,
          head: [['Employee', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status']],
          body: leaveTableData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 8 }
        })
        break

      case 'department':
        if (!departmentData.departments || departmentData.departments.length === 0) {
          alert('No data to export. Please generate a report first.')
          return
        }
        filename = `Department_Report_${new Date().toISOString().split('T')[0]}.pdf`
        reportTitle = 'Department Report'
        
        // Title
        doc.setFontSize(18)
        doc.text(reportTitle, 105, 15, { align: 'center' })
        doc.setFontSize(10)
        doc.text(`Generated on: ${currentDate}`, 105, 22, { align: 'center' })
        
        // Table
        const deptTableData = departmentData.departments.map(dept => {
          const utilization = dept.total_employees > 0 
            ? ((dept.active_employees / dept.total_employees) * 100).toFixed(1)
            : 0
          return [
            dept.name,
            dept.total_employees,
            dept.active_employees,
            `${utilization}%`
          ]
        })
        
        autoTable(doc, {
          startY: 32,
          head: [['Department', 'Total Employees', 'Active Employees', 'Utilization %']],
          body: deptTableData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 10 }
        })
        break

      default:
        alert('Please select a report to export')
        return
    }

    // Add footer
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(
        'Employee Management System - Report Generated Automatically',
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      )
    }

    // Save PDF
    doc.save(filename)
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">View and analyze your organization's data</p>
        </div>
        <button 
          onClick={exportReport}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tabs and content will be added next */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'payroll' && (
            <PayrollReport
              data={payrollData}
              filters={payrollFilters}
              setFilters={setPayrollFilters}
              onSearch={fetchPayrollReport}
              departments={departments}
              loading={loading}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceReport
              data={attendanceData}
              filters={attendanceFilters}
              setFilters={setAttendanceFilters}
              onSearch={fetchAttendanceReport}
              departments={departments}
              loading={loading}
            />
          )}

          {activeTab === 'leave' && (
            <LeaveReport
              data={leaveData}
              filters={leaveFilters}
              setFilters={setLeaveFilters}
              onSearch={fetchLeaveReport}
              loading={loading}
            />
          )}

          {activeTab === 'department' && (
            <DepartmentReport
              data={departmentData}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Summary Card Helper Component
function SummaryCard({ title, value, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${color === 'bg-green-500' ? 'text-green-600' : color === 'bg-blue-500' ? 'text-blue-600' : color === 'bg-red-500' ? 'text-red-600' : color === 'bg-purple-500' ? 'text-purple-600' : color === 'bg-yellow-500' ? 'text-yellow-600' : 'text-gray-800'}`}>
        {value}
      </p>
    </div>
  )
}

// Payroll Report Component
function PayrollReport({ data, filters, setFilters, onSearch, departments = [], loading }) {
  const { summary = {}, data: payrolls = [] } = data || {}

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payroll Period
          </label>
          <input
            type="month"
            value={filters.period}
            onChange={(e) => setFilters({ ...filters, period: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <select
            value={filters.department_id}
            onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departments && departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={onSearch}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center"
          >
            <Search className="w-4 h-4 mr-2" />
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            title="Total Employees"
            value={summary.total_employees || 0}
            color="bg-blue-500"
          />
          <SummaryCard
            title="Total Earnings"
            value={`₱${(summary.total_earnings || 0).toLocaleString()}`}
            color="bg-green-500"
          />
          <SummaryCard
            title="Total Deductions"
            value={`₱${(summary.total_deductions || 0).toLocaleString()}`}
            color="bg-red-500"
          />
          <SummaryCard
            title="Net Pay"
            value={`₱${(summary.total_net_pay || 0).toLocaleString()}`}
            color="bg-purple-500"
          />
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payrolls && payrolls.length > 0 ? (
              payrolls.map((payroll) => (
                <tr key={payroll.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payroll.employee?.user?.first_name} {payroll.employee?.user?.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payroll.employee?.department?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{payroll.payroll_period}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₱{(payroll.total_earnings || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₱{(payroll.total_deductions || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">₱{(payroll.net_pay || 0).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  {loading ? 'Loading...' : 'No data available. Select filters and click "Generate Report"'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
// Attendance Report Component
function AttendanceReport({ data, filters, setFilters, onSearch, departments = [], loading }) {
  // Safely destructure with defaults to prevent crashes
  const { summary = {}, data: attendances = [] } = data || {}

  // Debug logging
  console.log('AttendanceReport - data:', data)
  console.log('AttendanceReport - attendances:', attendances)
  console.log('AttendanceReport - summary:', summary)

  // Extra safety check
  if (!attendances || !Array.isArray(attendances)) {
    console.error('Invalid attendances data:', attendances)
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded">
        <p className="text-red-700">Error: Invalid data format. Please check console for details.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date From
          </label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date To
          </label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <select
            value={filters.department_id}
            onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departments && departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={onSearch}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center"
          >
            <Search className="w-4 h-4 mr-2" />
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <SummaryCard
            title="Total Records"
            value={summary.total_records || 0}
            color="bg-blue-500"
          />
          <SummaryCard
            title="Present Days"
            value={summary.present_days || 0}
            color="bg-green-500"
          />
          <SummaryCard
            title="Hours Worked"
            value={(summary.total_hours_worked || 0).toFixed(1)}
            color="bg-purple-500"
          />
          <SummaryCard
            title="Overtime Hours"
            value={(summary.total_overtime_hours || 0).toFixed(1)}
            color="bg-yellow-500"
          />
          <SummaryCard
            title="Late Hours"
            value={(summary.total_late_hours || 0).toFixed(1)}
            color="bg-red-500"
          />
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time In</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Out</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overtime</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendances && attendances.length > 0 ? (
              attendances.map((attendance) => {
                // Safely parse numeric values
                const hoursWorked = parseFloat(attendance.hours_worked) || 0
                const overtimeHours = parseFloat(attendance.overtime_hours) || 0
                
                return (
                  <tr key={attendance.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {attendance.employee?.user?.first_name || 'N/A'} {attendance.employee?.user?.last_name || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{attendance.attendance_date || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{attendance.time_in || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{attendance.time_out || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{hoursWorked.toFixed(1)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{overtimeHours.toFixed(1)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        attendance.is_present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {attendance.is_present ? 'Present' : 'Absent'}
                      </span>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  {loading ? 'Loading...' : 'No data available. Select filters and click "Generate Report"'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
// Leave Report Component
function LeaveReport({ data, filters, setFilters, onSearch, loading }) {
  const { summary = {}, data: leaves = [] } = data || {}

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date From
          </label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date To
          </label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={onSearch}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center"
          >
            <Search className="w-4 h-4 mr-2" />
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <SummaryCard
            title="Total Requests"
            value={summary.total_requests || 0}
            color="bg-blue-500"
          />
          <SummaryCard
            title="Total Days"
            value={summary.total_days || 0}
            color="bg-purple-500"
          />
          <SummaryCard
            title="Approved"
            value={summary.approved || 0}
            color="bg-green-500"
          />
          <SummaryCard
            title="Pending"
            value={summary.pending || 0}
            color="bg-yellow-500"
          />
          <SummaryCard
            title="Rejected"
            value={summary.rejected || 0}
            color="bg-red-500"
          />
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaves && leaves.length > 0 ? (
              leaves.map((leave) => (
                <tr key={leave.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {leave.employee?.user?.first_name} {leave.employee?.user?.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{leave.leave_type?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{leave.start_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{leave.end_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{leave.days_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                      leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  {loading ? 'Loading...' : 'No data available. Select filters and click "Generate Report"'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
// Department Report Component
function DepartmentReport({ data, loading }) {
  const { departments = [] } = data || {}

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Department Overview</h3>
        <p className="text-gray-600">Employee distribution across departments</p>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {departments && departments.length > 0 ? (
          departments.map((dept) => (
            <div key={dept.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-800">{dept.total_employees}</p>
                  <p className="text-sm text-gray-600">Employees</p>
                </div>
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">{dept.name}</h4>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Active:</span>
                <span className="font-medium text-green-600">{dept.active_employees}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-8 text-gray-500">
            {loading ? 'Loading...' : 'No department data available'}
          </div>
        )}
      </div>

      {/* Department Table */}
      {departments && departments.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Employees</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Employees</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departments.map((dept) => {
                const utilization = dept.total_employees > 0 
                  ? ((dept.active_employees / dept.total_employees) * 100).toFixed(1)
                  : 0
                return (
                  <tr key={dept.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {dept.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {dept.total_employees}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {dept.active_employees}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${utilization}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{utilization}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
