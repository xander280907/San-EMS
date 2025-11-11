import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api, { attendanceAPI, departmentAPI } from '../services/api'
import { Clock, LogIn, LogOut, Calendar, Users, UserCheck, UserX, Download, Search, ArrowUpDown, ArrowUp, ArrowDown, Timer, AlertCircle, X, BarChart3, TrendingUp, PieChart, Camera } from 'lucide-react'
import CameraCapture from '../components/CameraCapture'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Register Chart.js components - force reload
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend)

export default function Attendance() {
  const { user } = useAuth()
  
  // Role is returned as a string from the backend, not an object
  const isAdmin = user?.role === 'admin'
  const isEmployee = user?.role === 'employee'
  const canViewAllAttendance = isAdmin
  
  const [attendances, setAttendances] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [clockingIn, setClockingIn] = useState(false)
  const [clockingOut, setClockingOut] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedSession, setSelectedSession] = useState('morning') // 'morning' or 'afternoon'
  const [showCamera, setShowCamera] = useState(false)
  const [cameraAction, setCameraAction] = useState(null) // 'clockin' or 'clockout'
  const [capturedSelfie, setCapturedSelfie] = useState(null)
  const [showSelfieModal, setShowSelfieModal] = useState(false)
  const [viewingSelfie, setViewingSelfie] = useState(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processingApproval, setProcessingApproval] = useState(false)

  // Filters
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [departments, setDepartments] = useState([])

  // Sorting
  const [sortField, setSortField] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Stats
  const [stats, setStats] = useState({
    presentToday: 0,
    lateToday: 0,
    totalHoursToday: 0,
    absences: 0
  })
  const [lastUpdated, setLastUpdated] = useState(null)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState('') // 'present', 'late', 'absent'
  const [modalEmployees, setModalEmployees] = useState([])
  const [loadingModal, setLoadingModal] = useState(false)

  // Chart data state
  const [chartData, setChartData] = useState({
    last7Days: [],
    dailyStats: [],
    workingHours: [],
    breakdown: { present: 0, late: 0, absent: 0 }
  })
  const [loadingCharts, setLoadingCharts] = useState(false)

  useEffect(() => {
    if (canViewAllAttendance) {
      fetchDepartments()
      // Initial fetch for stats from backend
      fetchStats()
      fetchChartData()
    }
  }, [canViewAllAttendance])

  useEffect(() => {
    if (user?.employee?.id) {
      checkTodayAttendance()
    }
  }, [user?.employee?.id])

  useEffect(() => {
    fetchAttendances()
    setCurrentPage(1) // Reset to page 1 when filters change
  }, [dateFrom, dateTo, searchTerm, statusFilter, departmentFilter, sortField, sortDirection, user?.employee?.id])

  // Auto-refresh disabled - manual refresh only via button
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     console.log('Auto-refreshing attendance stats...')
  //     if (canViewAllAttendance) {
  //       fetchStats()
  //       fetchChartData()
  //     }
  //     if (user?.employee?.id) {
  //       checkTodayAttendance()
  //     }
  //   }, 30000) // 30 seconds

  //   return () => clearInterval(interval)
  // }, [user?.employee?.id, canViewAllAttendance])

  const fetchDepartments = async () => {
    try {
      const res = await departmentAPI.getAll()
      const data = res.data?.data || res.data || []
      setDepartments(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Error fetching departments:', e)
    }
  }

  const checkTodayAttendance = async () => {
    try {
      if (!user?.employee?.id) {
        console.log('No employee ID found for user')
        setTodayAttendance(null)
        return
      }

      // Get local date instead of UTC date
      const now = new Date()
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      console.log('=== Checking Today Attendance ===')
      console.log('Today date (local):', today)
      console.log('User employee ID:', user.employee.id)
      
      // Use the general endpoint with date and employee filtering
      const response = await attendanceAPI.getAll({
        date_from: today,
        date_to: today,
        employee_id: user.employee.id,
        per_page: 100
      })
      
      console.log('Full API Response:', response.data)
      
      // Handle Laravel pagination structure
      let data = response.data?.data || response.data || []
      console.log('Attendance data array:', data)
      console.log('Raw attendance dates:', data.map(att => ({
        id: att.id,
        attendance_date: att.attendance_date,
        created_at: att.created_at,
        clock_in: att.clock_in,
        clock_out: att.clock_out
      })))
      
      if (!Array.isArray(data)) {
        console.error('Data is not an array:', data)
        setTodayAttendance(null)
        return
      }

      // Since we already filtered by today's date, just get the first record for this employee
      const todayRecord = data.length > 0 ? data[0] : null
      
      if (data.length > 1) {
        console.warn('Multiple attendance records found for today, using the first one')
      }
      
      console.log('Final today record:', todayRecord)
      if (todayRecord) {
        console.log('Clock in:', todayRecord.clock_in)
        console.log('Clock out:', todayRecord.clock_out, 'Type:', typeof todayRecord.clock_out)
        console.log('Morning clock in:', todayRecord.morning_clock_in)
        console.log('Morning clock out:', todayRecord.morning_clock_out)
        console.log('Afternoon clock in:', todayRecord.afternoon_clock_in)
        console.log('Afternoon clock out:', todayRecord.afternoon_clock_out)
        console.log('All keys:', Object.keys(todayRecord))
      }
      console.log('=== End Check ===')
      
      setTodayAttendance(todayRecord || null)
    } catch (err) {
      console.error('Error checking today attendance:', err)
      console.error('Error details:', err.response?.data)
      setTodayAttendance(null)
    }
  }

  // Fetch real-time stats from backend
  const fetchStats = async () => {
    try {
      console.log('=== Fetching Real-time Stats from Backend ===')
      const response = await attendanceAPI.getTodayStats()
      console.log('Stats API response:', response.data)
      
      const statsData = response.data?.data || response.data
      
      if (statsData) {
        setStats({
          presentToday: statsData.presentToday || 0,
          lateToday: statsData.lateToday || 0,
          totalHoursToday: statsData.totalHoursToday || 0,
          absences: statsData.absences || 0
        })
        setLastUpdated(new Date())
        console.log('Stats updated:', statsData)
      }
      
      console.log('=== Stats Fetch Complete ===')
    } catch (err) {
      console.error('Error fetching stats:', err)
      console.error('Error details:', err.response?.data)
    }
  }

  const fetchEmployeesByCategory = async (type) => {
    setLoadingModal(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Fetch all attendance records for today with employee details
      const response = await attendanceAPI.getAll({
        date_from: today,
        date_to: today,
        per_page: 1000
      })
      
      const data = response.data?.data || response.data || []
      const attendanceList = Array.isArray(data) ? data : []
      
      let filteredEmployees = []
      
      if (type === 'present') {
        // Employees who clocked in today
        filteredEmployees = attendanceList
          .filter(att => att.clock_in)
          .map(att => ({
            name: att.employee?.user ? `${att.employee.user.first_name} ${att.employee.user.last_name}` : `Employee #${att.employee_id}`,
            department: att.employee?.department?.name || 'N/A',
            clockIn: att.clock_in,
            clockOut: att.clock_out,
            status: 'Present'
          }))
      } else if (type === 'late') {
        // Employees who clocked in after 9:00 AM
        filteredEmployees = attendanceList
          .filter(att => {
            if (!att.clock_in) return false
            const clockInTime = new Date(att.clock_in)
            const hours = clockInTime.getHours()
            const minutes = clockInTime.getMinutes()
            return hours > 9 || (hours === 9 && minutes > 0)
          })
          .map(att => ({
            name: att.employee?.user ? `${att.employee.user.first_name} ${att.employee.user.last_name}` : `Employee #${att.employee_id}`,
            department: att.employee?.department?.name || 'N/A',
            clockIn: att.clock_in,
            clockOut: att.clock_out,
            status: 'Late'
          }))
      } else if (type === 'absent') {
        // Get all employees and find those without attendance today
        const employeeResponse = await api.get('/employees', { params: { per_page: 1000 } })
        const allEmployees = employeeResponse.data?.data || employeeResponse.data || []
        
        const presentEmployeeIds = attendanceList
          .filter(att => att.clock_in)
          .map(att => att.employee_id)
        
        filteredEmployees = allEmployees
          .filter(emp => !presentEmployeeIds.includes(emp.id))
          .map(emp => ({
            name: emp.user ? `${emp.user.first_name} ${emp.user.last_name}` : `Employee #${emp.id}`,
            department: emp.department?.name || 'N/A',
            clockIn: null,
            clockOut: null,
            status: 'Absent'
          }))
      }
      
      setModalEmployees(filteredEmployees)
    } catch (err) {
      console.error('Error fetching employees:', err)
      setModalEmployees([])
    } finally {
      setLoadingModal(false)
    }
  }

  const fetchAttendances = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = { per_page: 100 }
      
      // If employee role, only fetch their own records
      if (isEmployee && user?.employee?.id) {
        params.employee_id = user.employee.id
      }
      
      // Admin/HR filters
      if (canViewAllAttendance) {
        if (dateFrom) params.date_from = dateFrom
        if (dateTo) params.date_to = dateTo
        if (departmentFilter) params.department_id = departmentFilter
        if (statusFilter) params.status = statusFilter
      }

      const response = await attendanceAPI.getAll(params)
      const data = response.data?.data || response.data || []
      let attendanceList = Array.isArray(data) ? data : []

      // Client-side search
      if (searchTerm) {
        attendanceList = attendanceList.filter(att => {
          const name = att.employee?.user ? `${att.employee.user.first_name} ${att.employee.user.last_name}`.toLowerCase() : ''
          return name.includes(searchTerm.toLowerCase())
        })
      }

      // Client-side sorting
      if (sortField) {
        attendanceList.sort((a, b) => {
          let aVal = a[sortField]
          let bVal = b[sortField]
          
          if (sortField === 'employee') {
            aVal = a.employee?.user ? `${a.employee.user.first_name} ${a.employee.user.last_name}` : ''
            bVal = b.employee?.user ? `${b.employee.user.first_name} ${b.employee.user.last_name}` : ''
          } else if (sortField === 'date') {
            aVal = a.attendance_date || a.created_at
            bVal = b.attendance_date || b.created_at
          }

          if (typeof aVal === 'string') {
            return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
          }
          return sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (bVal > aVal ? 1 : -1)
        })
      }

      setAttendances(attendanceList)
    } catch (err) {
      console.error('Error fetching attendance:', err)
      setError(err.response?.data?.error || err.message || 'Failed to load attendance records')
    } finally {
      setLoading(false)
    }
  }


  const handleClockIn = () => {
    // Show camera to capture selfie first
    setCameraAction('clockin')
    setShowCamera(true)
  }

  const handleClockInWithSelfie = async (selfieData) => {
    setShowCamera(false)
    setClockingIn(true)
    try {
      // Get local date instead of UTC date
      const now = new Date()
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      console.log(`Attempting to clock in for ${selectedSession} session with selfie...`)
      const response = await attendanceAPI.clockIn({
        attendance_date: today,
        session: selectedSession,
        selfie: selfieData
      })
      console.log('Clock in response:', response.data)
      
      // Use the returned attendance record directly
      const newAttendance = response.data?.data || response.data
      console.log('New attendance record:', newAttendance)
      
      if (newAttendance) {
        setTodayAttendance(newAttendance)
      }
      
      // Refresh today's attendance, list and stats
      await Promise.all([
        checkTodayAttendance(),
        fetchAttendances(),
        fetchStats()
      ])
      
      alert('Successfully clocked in with selfie verification!')
    } catch (err) {
      console.error('Clock in error:', err)
      console.error('Error response:', err.response?.data)
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to clock in'
      alert(errorMsg)
    } finally {
      setClockingIn(false)
      setCapturedSelfie(null)
    }
  }

  const handleClockOut = () => {
    if (!todayAttendance) {
      alert('You need to clock in first!')
      return
    }
    // Show camera to capture selfie first
    setCameraAction('clockout')
    setShowCamera(true)
  }

  const handleClockOutWithSelfie = async (selfieData) => {
    setShowCamera(false)
    setClockingOut(true)
    try {
      // Get local date instead of UTC date
      const now = new Date()
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      console.log(`Attempting to clock out for ${selectedSession} session with selfie...`)
      const response = await attendanceAPI.clockOut({
        attendance_date: today,
        session: selectedSession,
        selfie: selfieData
      })
      console.log('Clock out response:', response.data)
      
      // Use the returned attendance record directly
      const updatedAttendance = response.data?.data || response.data
      console.log('Updated attendance record:', updatedAttendance)
      
      if (updatedAttendance) {
        setTodayAttendance(updatedAttendance)
      }
      
      // Refresh today's attendance, list and stats
      await Promise.all([
        checkTodayAttendance(),
        fetchAttendances(),
        fetchStats()
      ])
      
      alert('Successfully clocked out with selfie verification!')
    } catch (err) {
      console.error('Clock out error:', err)
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to clock out'
      alert(errorMsg)
    } finally {
      setClockingOut(false)
      setCapturedSelfie(null)
    }
  }

  const handleCameraCapture = (imageData) => {
    setCapturedSelfie(imageData)
    if (cameraAction === 'clockin') {
      handleClockInWithSelfie(imageData)
    } else if (cameraAction === 'clockout') {
      handleClockOutWithSelfie(imageData)
    }
  }

  const handleCameraClose = () => {
    setShowCamera(false)
    setCameraAction(null)
    setCapturedSelfie(null)
  }

  const formatTime = (timeString) => {
    if (!timeString) return '-'
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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

  const handleCardClick = (type) => {
    setModalType(type)
    setModalOpen(true)
    fetchEmployeesByCategory(type)
  }

  const exportToPDF = () => {
    // Check if there's data to export
    if (!attendances || attendances.length === 0) {
      alert('No attendance data to export. Please load some attendance records first.')
      return
    }

    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(16)
    doc.text('Attendance Report', 14, 15)
    
    // Add date
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22)
    
    // Prepare table data
    const headers = [['Date', 'Employee', 'Clock In', 'Clock Out', 'Hours', 'Overtime', 'Status']]
    const rows = attendances.map(att => [
      formatDate(att.attendance_date || att.created_at),
      att.employee?.user ? `${att.employee.user.first_name} ${att.employee.user.last_name}` : `Employee #${att.employee_id}`,
      formatTime(att.clock_in),
      formatTime(att.clock_out),
      att.hours_worked || '0',
      att.overtime_hours || '0',
      att.clock_in ? 'Present' : 'Absent'
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
    doc.save(`attendance_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const fetchChartData = async () => {
    if (!canViewAllAttendance) {
      console.log('User cannot view all attendance, skipping chart data fetch')
      return
    }

    setLoadingCharts(true)
    try {
      console.log('=== Fetching Chart Data ===')
      
      // Get last 7 days dates
      const last7Days = []
      const today = new Date()
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        last7Days.push(date.toISOString().split('T')[0])
      }
      console.log('Date range:', last7Days[0], 'to', last7Days[6])

      // Fetch attendance for last 7 days
      const response = await attendanceAPI.getAll({
        date_from: last7Days[0],
        date_to: last7Days[6],
        per_page: 1000
      })

      console.log('Attendance API response:', response.data)
      const data = response.data?.data || response.data || []
      const attendanceList = Array.isArray(data) ? data : []
      console.log('Total attendance records:', attendanceList.length)
      
      // Log first 3 records to see structure
      if (attendanceList.length > 0) {
        console.log('Sample attendance records:')
        attendanceList.slice(0, 3).forEach((att, idx) => {
          console.log(`  Record ${idx + 1}:`, {
            id: att.id,
            employee_id: att.employee_id,
            attendance_date: att.attendance_date,
            created_at: att.created_at,
            clock_in: att.clock_in,
            clock_out: att.clock_out,
            hours_worked: att.hours_worked
          })
        })
      }

      // Get all employees with their hire dates
      const employeeResponse = await api.get('/employees', { params: { per_page: 1000 } })
      const allEmployees = employeeResponse.data?.data || employeeResponse.data || []
      const totalEmployees = Array.isArray(allEmployees) ? allEmployees.length : 0
      console.log('Total employees:', totalEmployees)
      
      // Log sample employee data to see hire date field
      if (allEmployees.length > 0) {
        console.log('Sample employee data:', {
          id: allEmployees[0].id,
          name: allEmployees[0].name,
          hire_date: allEmployees[0].hire_date,
          hired_date: allEmployees[0].hired_date,
          date_hired: allEmployees[0].date_hired,
          created_at: allEmployees[0].created_at
        })
      }

      // Process data for charts
      const dailyStats = last7Days.map(date => {
        const dayAttendances = attendanceList.filter(att => {
          // Extract date from various possible formats
          let attDate = null
          
          if (att.attendance_date) {
            attDate = att.attendance_date.split(' ')[0].split('T')[0]
          } else if (att.created_at) {
            attDate = att.created_at.split(' ')[0].split('T')[0]
          }
          
          const match = attDate === date
          if (match && att.clock_in) {
            console.log(`  - Match found: Employee ${att.employee_id}, Date: ${attDate}, Clock in: ${att.clock_in}`)
          }
          return match
        })

        console.log(`Date ${date}: ${dayAttendances.length} attendance records`)

        const presentEmployees = dayAttendances.filter(att => att.clock_in && att.clock_in !== null && att.clock_in !== 'null')
        const presentCount = presentEmployees.length
        
        console.log(`  - Present employees: ${presentCount}`)
        
        const lateCount = presentEmployees.filter(att => {
          try {
            const clockInTime = new Date(att.clock_in)
            const hours = clockInTime.getHours()
            const minutes = clockInTime.getMinutes()
            return hours > 9 || (hours === 9 && minutes > 0)
          } catch (e) {
            return false
          }
        }).length
        
        // Only count employees as absent if they were already hired on this date
        const employeesHiredByDate = allEmployees.filter(emp => {
          // Get hire date from various possible field names
          const hireDate = emp.hire_date || emp.hired_date || emp.date_hired || emp.created_at
          if (!hireDate) return false
          
          // Extract date part
          const hireDateOnly = hireDate.split(' ')[0].split('T')[0]
          
          // Employee should be counted if hired on or before this date
          return hireDateOnly <= date
        })
        
        const eligibleEmployeeCount = employeesHiredByDate.length
        const absentCount = eligibleEmployeeCount > 0 ? eligibleEmployeeCount - presentCount : 0

        // Calculate average working hours for the day
        const totalHours = presentEmployees.reduce((sum, att) => {
          return sum + (parseFloat(att.hours_worked) || 0)
        }, 0)
        const avgHours = presentCount > 0 ? totalHours / presentCount : 0

        console.log(`  - Eligible employees (hired by ${date}): ${eligibleEmployeeCount}`)
        console.log(`  - Stats: Present=${presentCount}, Late=${lateCount}, Absent=${absentCount}, Avg Hours=${avgHours.toFixed(2)}`)

        return {
          date,
          present: presentCount,
          late: lateCount,
          absent: absentCount,
          avgHours: parseFloat(avgHours.toFixed(2))
        }
      })

      console.log('Daily stats:', dailyStats)

      // Calculate overall breakdown for donut chart
      // Sum up all present, late, and absent counts across all days
      const totalPresent = dailyStats.reduce((sum, day) => sum + day.present, 0)
      const totalLate = dailyStats.reduce((sum, day) => sum + day.late, 0)
      const totalAbsent = dailyStats.reduce((sum, day) => sum + day.absent, 0)
      
      // Total opportunities to attend (sum of all eligible employees across all days)
      const total = totalPresent + totalAbsent
      
      console.log('Breakdown totals:', { totalPresent, totalLate, totalAbsent, total })

      const chartDataToSet = {
        last7Days,
        dailyStats,
        workingHours: dailyStats.map(d => d.avgHours),
        breakdown: {
          present: totalPresent,
          late: totalLate,
          absent: totalAbsent
        }
      }

      console.log('Setting chart data:', chartDataToSet)
      setChartData(chartDataToSet)
      console.log('=== Chart Data Fetch Complete ===')
    } catch (err) {
      console.error('Error fetching chart data:', err)
      console.error('Error details:', err.response?.data)
    } finally {
      setLoadingCharts(false)
    }
  }

  return (
    <div>
      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture 
          onCapture={handleCameraCapture}
          onClose={handleCameraClose}
        />
      )}
      {/* Selfie Viewing Modal */}
      {showSelfieModal && viewingSelfie && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-bold text-gray-800 mb-2">{viewingSelfie.label}</h2>
            
            {/* Status Badge */}
            {viewingSelfie.status && (
              <div className="mb-3">
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                  viewingSelfie.status === 'approved' ? 'bg-green-100 text-green-800' :
                  viewingSelfie.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {viewingSelfie.status.toUpperCase()}
                </span>
                {viewingSelfie.status === 'rejected' && viewingSelfie.reason && (
                  <p className="text-sm text-red-600 mt-2">
                    <strong>Reason:</strong> {viewingSelfie.reason}
                  </p>
                )}
              </div>
            )}
            
            <img src={viewingSelfie.image} alt="Selfie" className="w-full h-64 object-cover rounded mb-4" />
            
            {/* Reject Form */}
            {showRejectForm ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows="3"
                />
              </div>
            ) : null}
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              {!showRejectForm && viewingSelfie.status !== 'approved' && viewingSelfie.status !== 'rejected' && (
                <>
                  <button
                    onClick={async () => {
                      setProcessingApproval(true)
                      try {
                        await attendanceAPI.approveSelfie(viewingSelfie.attendanceId, viewingSelfie.sessionType)
                        alert('Selfie approved successfully!')
                        setShowSelfieModal(false)
                        setViewingSelfie(null)
                        await fetchAttendances()
                      } catch (err) {
                        alert(err.response?.data?.error || 'Failed to approve selfie')
                      } finally {
                        setProcessingApproval(false)
                      }
                    }}
                    disabled={processingApproval}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                  >
                    ✗ Reject
                  </button>
                </>
              )}
              
              {showRejectForm && (
                <>
                  <button
                    onClick={async () => {
                      if (!rejectionReason.trim()) {
                        alert('Please provide a rejection reason')
                        return
                      }
                      setProcessingApproval(true)
                      try {
                        await attendanceAPI.rejectSelfie(viewingSelfie.attendanceId, viewingSelfie.sessionType, rejectionReason)
                        alert('Selfie rejected successfully!')
                        setShowSelfieModal(false)
                        setViewingSelfie(null)
                        setShowRejectForm(false)
                        setRejectionReason('')
                        await fetchAttendances()
                      } catch (err) {
                        alert(err.response?.data?.error || 'Failed to reject selfie')
                      } finally {
                        setProcessingApproval(false)
                      }
                    }}
                    disabled={processingApproval || !rejectionReason.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
                  >
                    Submit Rejection
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectForm(false)
                      setRejectionReason('')
                    }}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </>
              )}
              
              {!showRejectForm && (
                <button
                  onClick={() => {
                    setShowSelfieModal(false)
                    setViewingSelfie(null)
                    setShowRejectForm(false)
                    setRejectionReason('')
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Attendance</h1>
          {isEmployee && (
            <p className="text-sm text-gray-600 mt-1">View and manage your attendance records</p>
          )}
          {canViewAllAttendance && (
            <p className="text-sm text-gray-600 mt-1">Monitor and manage all employee attendance</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              console.log('=== Manual Refresh Triggered ===')
              setRefreshing(true)
              try {
                const promises = [checkTodayAttendance(), fetchAttendances()]
                if (canViewAllAttendance) {
                  promises.push(fetchStats())
                  promises.push(fetchChartData())
                }
                await Promise.all(promises)
                console.log('=== Manual Refresh Complete ===')
              } catch (error) {
                console.error('Error during refresh:', error)
              } finally {
                setRefreshing(false)
              }
            }}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh attendance data"
          >
            <Clock className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {canViewAllAttendance && (
            <button 
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats - Real-time Dashboard Summary (Admin/HR Only) */}
      {canViewAllAttendance && (
        <>
          <div className="mb-2">
            {lastUpdated && (
              <p className="text-xs text-gray-500 text-right">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div 
              onClick={() => handleCardClick('present')}
              className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Present Today</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{stats.presentToday}</p>
                  <p className="text-xs text-gray-500 mt-1">Click to view details</p>
                </div>
                <div className="bg-green-500 p-3 rounded-full">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div 
              onClick={() => handleCardClick('late')}
              className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Late Arrivals</p>
                  <p className="text-2xl font-bold text-orange-700 mt-1">{stats.lateToday}</p>
                  <p className="text-xs text-gray-500 mt-1">Click to view details</p>
                </div>
                <div className="bg-orange-500 p-3 rounded-full">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Hours Today</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{stats.totalHoursToday.toFixed(1)}h</p>
                  <p className="text-xs text-gray-500 mt-1">All employees</p>
                </div>
                <div className="bg-blue-500 p-3 rounded-full">
                  <Timer className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div 
              onClick={() => handleCardClick('absent')}
              className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Absences</p>
                  <p className="text-2xl font-bold text-red-700 mt-1">{stats.absences}</p>
                  <p className="text-xs text-gray-500 mt-1">Click to view details</p>
                </div>
                <div className="bg-red-500 p-3 rounded-full">
                  <UserX className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Clock In/Out Section with Dual Sessions (Employee Only) */}
      {isEmployee && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Attendance</h2>
          
          {/* Session Selection */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setSelectedSession('morning')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedSession === 'morning'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Morning Session
            </button>
            <button
              onClick={() => setSelectedSession('afternoon')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedSession === 'afternoon'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Afternoon Session
            </button>
          </div>

          {/* Morning Session Status */}
          <div className="mb-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
            <h3 className="font-semibold text-blue-900 mb-3">Morning Session (AM)</h3>
            <div className="grid grid-cols-2 gap-3">
              {todayAttendance?.morning_clock_in ? (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <LogIn className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Clock In</span>
                    </div>
                    <p className="text-lg font-bold text-green-700">
                      {formatTime(todayAttendance.morning_clock_in)}
                    </p>
                  </div>
                  {todayAttendance.morning_clock_out ? (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <LogOut className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Clock Out</span>
                      </div>
                      <p className="text-lg font-bold text-blue-700">
                        {formatTime(todayAttendance.morning_clock_out)}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {todayAttendance.morning_hours}h worked
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 italic">Not clocked out yet</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="col-span-2 text-center text-gray-500 italic py-2">
                  No morning attendance
                </div>
              )}
            </div>
          </div>

          {/* Afternoon Session Status */}
          <div className="mb-4 p-4 border-2 border-orange-200 rounded-lg bg-orange-50">
            <h3 className="font-semibold text-orange-900 mb-3">Afternoon Session (PM)</h3>
            <div className="grid grid-cols-2 gap-3">
              {todayAttendance?.afternoon_clock_in ? (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <LogIn className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Clock In</span>
                    </div>
                    <p className="text-lg font-bold text-green-700">
                      {formatTime(todayAttendance.afternoon_clock_in)}
                    </p>
                  </div>
                  {todayAttendance.afternoon_clock_out ? (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <LogOut className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Clock Out</span>
                      </div>
                      <p className="text-lg font-bold text-blue-700">
                        {formatTime(todayAttendance.afternoon_clock_out)}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {todayAttendance.afternoon_hours}h worked
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 italic">Not clocked out yet</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="col-span-2 text-center text-gray-500 italic py-2">
                  No afternoon attendance
                </div>
              )}
            </div>
          </div>

          {/* Total Hours */}
          {todayAttendance && (todayAttendance.morning_hours > 0 || todayAttendance.afternoon_hours > 0) && (
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Total Hours Today:</span>
                <span className="text-xl font-bold text-gray-900">
                  {(parseFloat(todayAttendance.morning_hours || 0) + parseFloat(todayAttendance.afternoon_hours || 0)).toFixed(2)}h
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {/* Clock In Button */}
            {((selectedSession === 'morning' && !todayAttendance?.morning_clock_in) ||
              (selectedSession === 'afternoon' && !todayAttendance?.afternoon_clock_in)) && (
              <button
                onClick={handleClockIn}
                disabled={clockingIn}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
              >
                <LogIn className="w-5 h-5" />
                {clockingIn ? 'Clocking In...' : `Clock In (${selectedSession === 'morning' ? 'AM' : 'PM'})`}
              </button>
            )}

            {/* Clock Out Button */}
            {((selectedSession === 'morning' && todayAttendance?.morning_clock_in && !todayAttendance?.morning_clock_out) ||
              (selectedSession === 'afternoon' && todayAttendance?.afternoon_clock_in && !todayAttendance?.afternoon_clock_out)) && (
              <button
                onClick={handleClockOut}
                disabled={clockingOut}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
              >
                <LogOut className="w-5 h-5" />
                {clockingOut ? 'Clocking Out...' : `Clock Out (${selectedSession === 'morning' ? 'AM' : 'PM'})`}
              </button>
            )}
          </div>

          {/* Helper Message */}
          {!todayAttendance && (
            <p className="text-center text-gray-500 text-sm mt-4">
              Select a session above and click Clock In to start tracking your attendance
            </p>
          )}
        </div>
      )}

      {/* Filters (Admin/HR Only) */}
      {canViewAllAttendance && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="attendance-search"
                name="search"
                type="text"
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchAttendances()}
                className="w-full pl-10 pr-3 py-2 border rounded"
              />
            </div>
            <select 
              id="attendance-department-filter"
              name="department"
              value={departmentFilter} 
              onChange={(e) => setDepartmentFilter(e.target.value)} 
              className="border rounded px-3 py-2"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <select 
              id="attendance-status-filter"
              name="status"
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="border rounded px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
            <input
              id="attendance-date-from"
              name="dateFrom"
              type="date"
              placeholder="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <input
              id="attendance-date-to"
              name="dateTo"
              type="date"
              placeholder="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => {
                setSearchTerm('')
                setDepartmentFilter('')
                setStatusFilter('')
                setDateFrom('')
                setDateTo('')
              }}
              className="px-4 py-2 border rounded hover:bg-gray-50 text-sm"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Attendance History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {isEmployee ? 'My Attendance History' : 'Attendance History'}
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-600">Loading attendance records...</p>
        ) : attendances.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No attendance records found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => handleSort('date')}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        Date
                        {getSortIcon('date')}
                      </div>
                    </th>
                    {canViewAllAttendance && (
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
                      onClick={() => handleSort('clock_in')}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        Clock In
                        {getSortIcon('clock_in')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('clock_out')}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        Clock Out
                        {getSortIcon('clock_out')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('hours_worked')}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        Hours
                        {getSortIcon('hours_worked')}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    {canViewAllAttendance && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Selfie</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendances
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((attendance) => (
                      <tr key={attendance.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(attendance.attendance_date || attendance.created_at)}
                        </td>
                        {canViewAllAttendance && (
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {attendance.employee?.user 
                              ? `${attendance.employee.user.first_name} ${attendance.employee.user.last_name}`
                              : `Employee #${attendance.employee_id}`}
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatTime(attendance.clock_in)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatTime(attendance.clock_out)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {attendance.hours_worked ? `${attendance.hours_worked}h` : '-'}
                          {attendance.overtime_hours && parseFloat(attendance.overtime_hours) > 0 && (
                            <span className="text-orange-600 ml-1">
                              (+{attendance.overtime_hours}h OT)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                            attendance.clock_in
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {attendance.clock_in ? 'Present' : 'Absent'}
                          </span>
                        </td>
                        {canViewAllAttendance && (
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {attendance.morning_clock_in_selfie && (
                                <button
                                  onClick={() => {
                                    setViewingSelfie({ 
                                      image: attendance.morning_clock_in_selfie, 
                                      label: 'Morning Clock In',
                                      status: attendance.morning_clock_in_selfie_status || 'pending',
                                      reason: attendance.morning_clock_in_selfie_reason,
                                      attendanceId: attendance.id,
                                      sessionType: 'morning_clock_in'
                                    })
                                    setShowSelfieModal(true)
                                  }}
                                  className={`p-1 rounded flex flex-col items-center ${
                                    attendance.morning_clock_in_selfie_status === 'approved' ? 'bg-green-100' :
                                    attendance.morning_clock_in_selfie_status === 'rejected' ? 'bg-red-100' :
                                    'hover:bg-blue-100'
                                  }`}
                                  title={`View Morning Clock In Selfie - ${attendance.morning_clock_in_selfie_status || 'pending'}`}
                                >
                                  <Camera className={`w-4 h-4 ${
                                    attendance.morning_clock_in_selfie_status === 'approved' ? 'text-green-600' :
                                    attendance.morning_clock_in_selfie_status === 'rejected' ? 'text-red-600' :
                                    'text-blue-600'
                                  }`} />
                                  <span className="text-xs">AM In</span>
                                </button>
                              )}
                              {attendance.morning_clock_out_selfie && (
                                <button
                                  onClick={() => {
                                    setViewingSelfie({ 
                                      image: attendance.morning_clock_out_selfie, 
                                      label: 'Morning Clock Out',
                                      status: attendance.morning_clock_out_selfie_status || 'pending',
                                      reason: attendance.morning_clock_out_selfie_reason,
                                      attendanceId: attendance.id,
                                      sessionType: 'morning_clock_out'
                                    })
                                    setShowSelfieModal(true)
                                  }}
                                  className={`p-1 rounded flex flex-col items-center ${
                                    attendance.morning_clock_out_selfie_status === 'approved' ? 'bg-green-100' :
                                    attendance.morning_clock_out_selfie_status === 'rejected' ? 'bg-red-100' :
                                    'hover:bg-green-100'
                                  }`}
                                  title={`View Morning Clock Out Selfie - ${attendance.morning_clock_out_selfie_status || 'pending'}`}
                                >
                                  <Camera className={`w-4 h-4 ${
                                    attendance.morning_clock_out_selfie_status === 'approved' ? 'text-green-600' :
                                    attendance.morning_clock_out_selfie_status === 'rejected' ? 'text-red-600' :
                                    'text-green-600'
                                  }`} />
                                  <span className="text-xs">AM Out</span>
                                </button>
                              )}
                              {attendance.afternoon_clock_in_selfie && (
                                <button
                                  onClick={() => {
                                    setViewingSelfie({ 
                                      image: attendance.afternoon_clock_in_selfie, 
                                      label: 'Afternoon Clock In',
                                      status: attendance.afternoon_clock_in_selfie_status || 'pending',
                                      reason: attendance.afternoon_clock_in_selfie_reason,
                                      attendanceId: attendance.id,
                                      sessionType: 'afternoon_clock_in'
                                    })
                                    setShowSelfieModal(true)
                                  }}
                                  className={`p-1 rounded flex flex-col items-center ${
                                    attendance.afternoon_clock_in_selfie_status === 'approved' ? 'bg-green-100' :
                                    attendance.afternoon_clock_in_selfie_status === 'rejected' ? 'bg-red-100' :
                                    'hover:bg-orange-100'
                                  }`}
                                  title={`View Afternoon Clock In Selfie - ${attendance.afternoon_clock_in_selfie_status || 'pending'}`}
                                >
                                  <Camera className={`w-4 h-4 ${
                                    attendance.afternoon_clock_in_selfie_status === 'approved' ? 'text-green-600' :
                                    attendance.afternoon_clock_in_selfie_status === 'rejected' ? 'text-red-600' :
                                    'text-orange-600'
                                  }`} />
                                  <span className="text-xs">PM In</span>
                                </button>
                              )}
                              {attendance.afternoon_clock_out_selfie && (
                                <button
                                  onClick={() => {
                                    setViewingSelfie({ 
                                      image: attendance.afternoon_clock_out_selfie, 
                                      label: 'Afternoon Clock Out',
                                      status: attendance.afternoon_clock_out_selfie_status || 'pending',
                                      reason: attendance.afternoon_clock_out_selfie_reason,
                                      attendanceId: attendance.id,
                                      sessionType: 'afternoon_clock_out'
                                    })
                                    setShowSelfieModal(true)
                                  }}
                                  className={`p-1 rounded flex flex-col items-center ${
                                    attendance.afternoon_clock_out_selfie_status === 'approved' ? 'bg-green-100' :
                                    attendance.afternoon_clock_out_selfie_status === 'rejected' ? 'bg-red-100' :
                                    'hover:bg-purple-100'
                                  }`}
                                  title={`View Afternoon Clock Out Selfie - ${attendance.afternoon_clock_out_selfie_status || 'pending'}`}
                                >
                                  <Camera className={`w-4 h-4 ${
                                    attendance.afternoon_clock_out_selfie_status === 'approved' ? 'text-green-600' :
                                    attendance.afternoon_clock_out_selfie_status === 'rejected' ? 'text-red-600' :
                                    'text-purple-600'
                                  }`} />
                                  <span className="text-xs">PM Out</span>
                                </button>
                              )}
                              {!attendance.morning_clock_in_selfie && !attendance.morning_clock_out_selfie && !attendance.afternoon_clock_in_selfie && !attendance.afternoon_clock_out_selfie && (
                                <span className="text-xs text-gray-400">No selfie</span>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {attendances.length > itemsPerPage && (
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, attendances.length)} of {attendances.length} records
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 border rounded text-sm ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {Math.ceil(attendances.length / itemsPerPage)}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(attendances.length / itemsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(attendances.length / itemsPerPage)}
                    className={`px-3 py-1 border rounded text-sm ${
                      currentPage === Math.ceil(attendances.length / itemsPerPage)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Attendance Patterns Section (Admin/HR Only) */}
      {canViewAllAttendance && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Attendance Patterns</h2>
            <button
              onClick={() => {
                console.log('Manual chart refresh triggered')
                fetchChartData()
              }}
              disabled={loadingCharts}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loadingCharts && <Clock className="w-4 h-4 animate-spin" />}
              {loadingCharts ? 'Loading...' : 'Refresh Charts'}
            </button>
          </div>
          
          {loadingCharts ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading charts...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Bar Chart: Present / Late / Absent per day */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Daily Attendance (Last 7 Days)</h3>
                </div>
                <div className="h-80">
                  <Bar
                    data={{
                      labels: chartData.last7Days.map(date => {
                        const d = new Date(date)
                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      }),
                      datasets: [
                        {
                          label: 'Present',
                          data: chartData.dailyStats.map(d => d.present),
                          backgroundColor: 'rgba(34, 197, 94, 0.8)',
                          borderColor: 'rgba(34, 197, 94, 1)',
                          borderWidth: 1
                        },
                        {
                          label: 'Late',
                          data: chartData.dailyStats.map(d => d.late),
                          backgroundColor: 'rgba(249, 115, 22, 0.8)',
                          borderColor: 'rgba(249, 115, 22, 1)',
                          borderWidth: 1
                        },
                        {
                          label: 'Absent',
                          data: chartData.dailyStats.map(d => d.absent),
                          backgroundColor: 'rgba(239, 68, 68, 0.8)',
                          borderColor: 'rgba(239, 68, 68, 1)',
                          borderWidth: 1
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Line Chart: Average working hours trend */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Average Working Hours</h3>
                  </div>
                  <div className="h-64">
                    <Line
                      data={{
                        labels: chartData.last7Days.map(date => {
                          const d = new Date(date)
                          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        }),
                        datasets: [
                          {
                            label: 'Avg Hours',
                            data: chartData.workingHours,
                            borderColor: 'rgba(59, 130, 246, 1)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true,
                            pointRadius: 4,
                            pointHoverRadius: 6
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          },
                          title: {
                            display: false
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 12,
                            ticks: {
                              callback: function(value) {
                                return value + 'h'
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Donut Chart: Attendance breakdown */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <PieChart className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Attendance Breakdown</h3>
                  </div>
                  <div className="h-64 flex items-center justify-center">
                    <div className="w-64">
                      <Doughnut
                        data={{
                          labels: ['Present', 'Late', 'Absent'],
                          datasets: [
                            {
                              data: [
                                chartData.breakdown.present,
                                chartData.breakdown.late,
                                chartData.breakdown.absent
                              ],
                              backgroundColor: [
                                'rgba(34, 197, 94, 0.8)',
                                'rgba(249, 115, 22, 0.8)',
                                'rgba(239, 68, 68, 0.8)'
                              ],
                              borderColor: [
                                'rgba(34, 197, 94, 1)',
                                'rgba(249, 115, 22, 1)',
                                'rgba(239, 68, 68, 1)'
                              ],
                              borderWidth: 2
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  return context.label + ': ' + context.parsed
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <p className="text-gray-600">Present</p>
                      <p className="text-lg font-bold text-green-700">{chartData.breakdown.present}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Late</p>
                      <p className="text-lg font-bold text-orange-700">{chartData.breakdown.late}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Absent</p>
                      <p className="text-lg font-bold text-red-700">{chartData.breakdown.absent}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Employee List Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">
                {modalType === 'present' && 'Present Today'}
                {modalType === 'late' && 'Late Arrivals'}
                {modalType === 'absent' && 'Absent Today'}
              </h2>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingModal ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading employees...</p>
                </div>
              ) : modalEmployees.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No employees found in this category.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                        {modalType !== 'absent' && (
                          <>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                          </>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {modalEmployees.map((employee, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{employee.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{employee.department}</td>
                          {modalType !== 'absent' && (
                            <>
                              <td className="px-4 py-3 text-sm text-gray-700">{formatTime(employee.clockIn)}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{formatTime(employee.clockOut)}</td>
                            </>
                          )}
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                              employee.status === 'Present' 
                                ? 'bg-green-100 text-green-800'
                                : employee.status === 'Late'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {employee.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <p className="text-sm text-gray-600">
                Total: <span className="font-semibold">{modalEmployees.length}</span> employee{modalEmployees.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
