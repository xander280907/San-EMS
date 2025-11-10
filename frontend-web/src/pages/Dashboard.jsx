import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { hasPermission, canViewAll, isEmployee, isAdmin, isHR } from '../utils/permissions'
import { Users, DollarSign, Clock, Calendar, Megaphone, AlertCircle, CheckCircle, XCircle, ClockIcon, LogIn, LogOut, TrendingUp, TrendingDown, Activity, Cake, Award, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import api, { announcementAPI, leaveAPI } from '../services/api'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    employees: 0,
    payroll: 0,
    attendanceToday: 0,
    pendingLeaves: 0,
    previousMonthPayroll: 0,
    previousDayAttendance: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [recentAnnouncements, setRecentAnnouncements] = useState([])
  const [myLeaveRequests, setMyLeaveRequests] = useState([])
  const [announcementsLoading, setAnnouncementsLoading] = useState(true)
  const [leavesLoading, setLeavesLoading] = useState(true)
  const [weeklyAttendance, setWeeklyAttendance] = useState([])
  const [leaveBalance, setLeaveBalance] = useState(null)
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [recentActivity, setRecentActivity] = useState([])

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  useEffect(() => {
    fetchStats()
    fetchTodayAttendance()
    fetchRecentAnnouncements()
    fetchMyLeaveRequests()
    fetchWeeklyAttendance()
    fetchLeaveBalance()
    fetchUpcomingEvents()
  }, [])

  // Fetch recent activity after other data is loaded
  useEffect(() => {
    if (recentAnnouncements.length || myLeaveRequests.length || todayAttendance) {
      fetchRecentActivity()
    }
  }, [recentAnnouncements, myLeaveRequests, todayAttendance])

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1
      const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear

      // Fetch all stats in parallel including previous period data
      const [employeesRes, attendanceRes, yesterdayAttendanceRes, leavesRes, payrollRes, prevPayrollRes] = await Promise.allSettled([
        api.get('/employees', { params: { per_page: 1 } }),
        api.get('/attendance', { params: { date_from: today, date_to: today } }),
        api.get('/attendance', { params: { date_from: yesterday, date_to: yesterday } }),
        api.get('/leaves', { params: { status: 'pending' } }),
        api.get('/payroll', { params: { month: currentMonth, year: currentYear } }),
        api.get('/payroll', { params: { month: previousMonth, year: previousYear } }),
      ])

      // Extract counts from responses
      const employeesCount = employeesRes.status === 'fulfilled' 
        ? (employeesRes.value.data?.total || employeesRes.value.data?.data?.length || 0)
        : 0

      const attendanceCount = attendanceRes.status === 'fulfilled'
        ? (attendanceRes.value.data?.total || attendanceRes.value.data?.data?.length || 0)
        : 0

      const yesterdayCount = yesterdayAttendanceRes.status === 'fulfilled'
        ? (yesterdayAttendanceRes.value.data?.total || yesterdayAttendanceRes.value.data?.data?.length || 0)
        : 0

      const leavesCount = leavesRes.status === 'fulfilled'
        ? (leavesRes.value.data?.total || leavesRes.value.data?.data?.length || 0)
        : 0

      // Calculate payroll totals
      let payrollTotal = 0
      let previousPayrollTotal = 0
      
      if (payrollRes.status === 'fulfilled') {
        const payrollData = payrollRes.value.data?.data || payrollRes.value.data || []
        if (Array.isArray(payrollData)) {
          payrollTotal = payrollData.reduce((sum, p) => sum + (parseFloat(p.net_salary || p.gross_salary || 0)), 0)
        }
      }
      
      if (prevPayrollRes.status === 'fulfilled') {
        const prevPayrollData = prevPayrollRes.value.data?.data || prevPayrollRes.value.data || []
        if (Array.isArray(prevPayrollData)) {
          previousPayrollTotal = prevPayrollData.reduce((sum, p) => sum + (parseFloat(p.net_salary || p.gross_salary || 0)), 0)
        }
      }

      setStats({
        employees: employeesCount,
        payroll: payrollTotal,
        attendanceToday: attendanceCount,
        pendingLeaves: leavesCount,
        previousMonthPayroll: previousPayrollTotal,
        previousDayAttendance: yesterdayCount,
      })
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await api.get('/attendance', {
        params: { date_from: today, date_to: today }
      })
      
      const data = response.data?.data || response.data || []
      const todayRecord = Array.isArray(data) ? data.find(att => {
        const attDate = new Date(att.attendance_date || att.created_at).toISOString().split('T')[0]
        return attDate === today && att.employee_id === user?.employee?.id
      }) : null
      
      setTodayAttendance(todayRecord || null)
    } catch (err) {
      console.error('Error fetching today attendance:', err)
    }
  }

  const fetchRecentAnnouncements = async () => {
    setAnnouncementsLoading(true)
    try {
      const response = await announcementAPI.getAll()
      const data = response.data?.data || response.data || []
      const announcements = Array.isArray(data) ? data : []
      // Get 3 most recent announcements, prioritize urgent ones
      const sorted = announcements.sort((a, b) => {
        if (a.is_urgent && !b.is_urgent) return -1
        if (!a.is_urgent && b.is_urgent) return 1
        return new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at)
      })
      setRecentAnnouncements(sorted.slice(0, 3))
    } catch (err) {
      console.error('Error fetching announcements:', err)
    } finally {
      setAnnouncementsLoading(false)
    }
  }

  const fetchMyLeaveRequests = async () => {
    setLeavesLoading(true)
    try {
      const response = await leaveAPI.getAll({ per_page: 5 })
      const data = response.data?.data || response.data || []
      const leaves = Array.isArray(data) ? data : []
      // Filter to current user's leaves
      const myLeaves = leaves.filter(l => l.employee_id === user?.employee?.id)
      setMyLeaveRequests(myLeaves.slice(0, 3))
    } catch (err) {
      console.error('Error fetching leave requests:', err)
    } finally {
      setLeavesLoading(false)
    }
  }

  const fetchWeeklyAttendance = async () => {
    try {
      const dates = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 86400000)
        dates.push(date.toISOString().split('T')[0])
      }

      const attendancePromises = dates.map(date =>
        api.get('/attendance', { params: { date_from: date, date_to: date } })
      )

      const results = await Promise.allSettled(attendancePromises)
      const weekData = results.map((result, index) => {
        const count = result.status === 'fulfilled'
          ? (result.value.data?.total || result.value.data?.data?.length || 0)
          : 0
        return { date: dates[index], count }
      })

      setWeeklyAttendance(weekData)
    } catch (err) {
      console.error('Error fetching weekly attendance:', err)
    }
  }

  const fetchLeaveBalance = async () => {
    try {
      const response = await leaveAPI.getAll()
      const data = response.data?.data || response.data || []
      const leaves = Array.isArray(data) ? data : []
      const myLeaves = leaves.filter(l => l.employee_id === user?.employee?.id)
      
      const totalDays = 15 // Assume 15 days annual leave
      const usedDays = myLeaves
        .filter(l => l.status === 'approved')
        .reduce((sum, l) => sum + (parseInt(l.days_count) || 0), 0)
      
      setLeaveBalance({ total: totalDays, used: usedDays, remaining: totalDays - usedDays })
    } catch (err) {
      console.error('Error fetching leave balance:', err)
      // Set default values on error
      setLeaveBalance({ total: 15, used: 0, remaining: 15 })
    }
  }

  const fetchUpcomingEvents = async () => {
    try {
      // Fetch upcoming leaves and announcements
      const events = []
      
      // Add upcoming leaves
      myLeaveRequests
        .filter(l => l.status === 'approved' && new Date(l.start_date) > new Date())
        .forEach(leave => {
          events.push({
            id: `leave-${leave.id}`,
            title: `${leave.leaveType?.name || 'Leave'}`,
            date: leave.start_date,
            type: 'leave',
            icon: Calendar,
          })
        })

      setUpcomingEvents(events.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3))
    } catch (err) {
      console.error('Error fetching upcoming events:', err)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      const activities = []
      
      // Add recent announcements
      if (recentAnnouncements.length > 0) {
        recentAnnouncements.slice(0, 2).forEach(ann => {
          activities.push({
            id: `ann-${ann.id}`,
            type: 'announcement',
            message: `New announcement: ${ann.title}`,
            time: ann.published_at || ann.created_at,
            icon: Megaphone,
          })
        })
      }
      
      // Add recent leaves
      if (myLeaveRequests.length > 0) {
        activities.push({
          id: `leave-${myLeaveRequests[0].id}`,
          type: 'leave',
          message: `Leave request ${myLeaveRequests[0].status}`,
          time: myLeaveRequests[0].created_at,
          icon: Calendar,
        })
      }
      
      // Add attendance
      if (todayAttendance) {
        activities.push({
          id: `att-${todayAttendance.id}`,
          type: 'attendance',
          message: 'Clocked in for today',
          time: todayAttendance.clock_in,
          icon: Clock,
        })
      }
      
      setRecentActivity(activities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5))
    } catch (err) {
      console.error('Error fetching recent activity:', err)
    }
  }

  const calculateTrend = (current, previous) => {
    if (previous === 0) return { value: 0, direction: 'neutral' }
    const change = ((current - previous) / previous) * 100
    return {
      value: Math.abs(change).toFixed(1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    }
  }

  // Define all stat cards with their required permissions
  const allStatCards = [
    { 
      icon: Users, 
      label: 'Total Employees', 
      value: stats.employees, 
      color: 'bg-blue-500', 
      path: '/dashboard/employees', 
      permission: 'employees',
      trend: null
    },
    { 
      icon: DollarSign, 
      label: 'This Month Payroll', 
      value: `₱${stats.payroll.toLocaleString()}`, 
      color: 'bg-green-500', 
      path: '/dashboard/payroll', 
      permission: 'payroll',
      trend: calculateTrend(stats.payroll, stats.previousMonthPayroll)
    },
    { 
      icon: Clock, 
      label: 'Attendance Today', 
      value: stats.attendanceToday, 
      color: 'bg-yellow-500', 
      path: '/dashboard/attendance', 
      permission: 'attendanceViewAll',
      trend: calculateTrend(stats.attendanceToday, stats.previousDayAttendance)
    },
    { 
      icon: Calendar, 
      label: canViewAll(user) ? 'Pending Leaves' : 'My Leave Requests', 
      value: canViewAll(user) ? stats.pendingLeaves : myLeaveRequests.length, 
      color: 'bg-purple-500', 
      path: '/dashboard/leaves', 
      permission: 'leaves',
      trend: null
    },
  ]

  // Filter stat cards based on user permissions
  const statCards = allStatCards.filter(card => hasPermission(user, card.permission))

  const formatTime = (timeString) => {
    if (!timeString) return '-'
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  // Employee Dashboard View - Focused on personal information
  const renderEmployeeDashboard = () => (
    <div className="w-full max-w-7xl mx-auto">
      {/* Modern Hero Section */}
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          {getGreeting()}, {user?.first_name || 'User'}! 👋
        </h1>
        <p className="text-lg text-gray-500">Welcome back to your workspace</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-r-lg">
          {error}
        </div>
      )}

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 lg:mb-10">
        {/* Attendance Card */}
        <div className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">TODAY</span>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-2">Attendance Status</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {todayAttendance ? '✓ Checked In' : 'Not Checked In'}
          </p>
          {todayAttendance && todayAttendance.clock_in && (
            <p className="text-sm text-gray-600">
              at {formatTime(todayAttendance.clock_in)}
            </p>
          )}
        </div>

        {/* Leave Balance Card */}
        <div className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:border-green-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">BALANCE</span>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-2">Available Leaves</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {leaveBalance ? `${leaveBalance.remaining}` : '15'} Days
          </p>
          <p className="text-sm text-gray-600">
            {leaveBalance ? `${leaveBalance.used} used this year` : 'Available'}
          </p>
        </div>

        {/* Announcements Card */}
        <div className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:border-purple-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
              <Megaphone className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">UPDATES</span>
          </div>
          <p className="text-sm font-medium text-gray-500 mb-2">Announcements</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{recentAnnouncements.length}</p>
          <p className="text-sm text-gray-600">
            {recentAnnouncements.length > 0 ? 'new updates available' : 'all caught up'}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 lg:mb-10">
        {/* Modern Attendance Widget */}
        <div className="bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            Today's Attendance
          </h2>
          {todayAttendance ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <LogIn className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">Clock In</p>
                    <p className="text-2xl font-bold text-gray-900">{formatTime(todayAttendance.clock_in)}</p>
                  </div>
                </div>
              </div>
              {todayAttendance.clock_out ? (
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <LogOut className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Clock Out</p>
                      <p className="text-2xl font-bold text-gray-900">{formatTime(todayAttendance.clock_out)}</p>
                    </div>
                  </div>
                  {todayAttendance.hours_worked && (
                    <div className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                      <p className="text-sm font-semibold">{todayAttendance.hours_worked}h</p>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => navigate('/dashboard/attendance')}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-sm hover:shadow-md"
                >
                  Clock Out Now
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-5">
                <ClockIcon className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-600 mb-5 font-medium">Haven't clocked in yet</p>
              <button
                onClick={() => navigate('/dashboard/attendance')}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-sm hover:shadow-md"
              >
                Clock In Now
              </button>
            </div>
          )}
        </div>

        {/* Modern Leave Balance Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-green-600" />
            Leave Balance
          </h2>
          {leaveBalance ? (
            <div className="flex flex-col items-center justify-center">
              <div className="w-52 h-52">
                <Doughnut
                  data={{
                    labels: ['Used', 'Remaining'],
                    datasets: [
                      {
                        data: [leaveBalance.used, leaveBalance.remaining],
                        backgroundColor: ['#F59E0B', '#10B981'],
                        borderWidth: 0,
                        borderRadius: 8,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        callbacks: {
                          label: (context) => `${context.label}: ${context.parsed} days`,
                        },
                      },
                    },
                  }}
                />
              </div>
              <div className="text-center mt-6">
                <p className="text-5xl font-bold text-gray-900 mb-1">{leaveBalance.remaining}</p>
                <p className="text-sm text-gray-500 mb-5">days available</p>
                <div className="flex gap-6 justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-sm font-medium text-gray-600">{leaveBalance.used} used</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-gray-600">{leaveBalance.remaining} left</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Loading leave data...
            </div>
          )}
        </div>
      </div>

      {/* Leave Requests & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 lg:mb-10">
        {/* Modern Leave Requests */}
        <div className="bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              Leave Requests
            </h2>
            <button
              onClick={() => navigate('/dashboard/leaves')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm hover:shadow-md"
            >
              + New Request
            </button>
          </div>
          {leavesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-xl"></div>
              ))}
            </div>
          ) : myLeaveRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500">No leave requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myLeaveRequests.map((leave) => (
                <div key={leave.id} className="p-4 border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-gray-50 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-900">
                      {leave.leaveType?.name || 'Leave'}
                    </span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(leave.status)}`}>
                      {leave.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {leave.start_date} to {leave.end_date} ({leave.days_count} days)
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modern Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-7 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Recent Activity
          </h2>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => {
                const ActivityIcon = activity.icon
                return (
                  <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <ActivityIcon className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.time).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Modern Announcements */}
      <div className="bg-white rounded-2xl border border-gray-100 p-7 mb-10 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-orange-600" />
            Announcements
          </h2>
          <button
            onClick={() => navigate('/dashboard/announcements')}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
          >
            View All
            <span>→</span>
          </button>
        </div>
        {announcementsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-gray-50 animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : recentAnnouncements.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500">No announcements available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                onClick={() => navigate('/dashboard/announcements')}
                className={`p-5 border-l-4 rounded-xl cursor-pointer transition-all ${
                  announcement.is_urgent 
                    ? 'border-red-500 bg-red-50/50 hover:bg-red-50 hover:shadow-md' 
                    : 'border-blue-500 bg-blue-50/30 hover:bg-blue-50 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-gray-900">{announcement.title}</h3>
                      {announcement.is_urgent && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold">
                          <AlertCircle className="w-3 h-3" />
                          URGENT
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2 mb-3">{announcement.content}</p>
                    <p className="text-xs text-gray-500 font-medium">
                      {announcement.published_at && new Date(announcement.published_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modern Quick Actions */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-6 lg:p-7">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <button 
            onClick={() => navigate('/dashboard/attendance')}
            className="group p-6 bg-white border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:shadow-lg text-left transition-all duration-300"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
              <Clock className="w-6 h-6 text-blue-600 group-hover:text-white group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Attendance</h3>
            <p className="text-sm text-gray-600">Clock in and out</p>
          </button>
          <button 
            onClick={() => navigate('/dashboard/leaves')}
            className="group p-6 bg-white border-2 border-gray-100 rounded-xl hover:border-green-500 hover:shadow-lg text-left transition-all duration-300"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500 transition-colors">
              <Calendar className="w-6 h-6 text-green-600 group-hover:text-white group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Request Leave</h3>
            <p className="text-sm text-gray-600">Apply for time off</p>
          </button>
          <button 
            onClick={() => navigate('/dashboard/my-payslips')}
            className="group p-6 bg-white border-2 border-gray-100 rounded-xl hover:border-purple-500 hover:shadow-lg text-left transition-all duration-300"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500 transition-colors">
              <DollarSign className="w-6 h-6 text-purple-600 group-hover:text-white group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">My Payslips</h3>
            <p className="text-sm text-gray-600">View salary history</p>
          </button>
        </div>
      </div>
    </div>
  )

  // Admin/HR Dashboard View - Focused on management and analytics
  const renderAdminDashboard = () => (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          {getGreeting()}, {user?.first_name || 'User'}!
        </h1>
        <p className="text-gray-600 mt-2">Here's what's happening in your EMS today.</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Stat Cards - Enhanced with Trends */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          const TrendIcon = stat.trend?.direction === 'up' ? ArrowUp : stat.trend?.direction === 'down' ? ArrowDown : Minus
          return (
            <div 
              key={index} 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                navigate(stat.path)
              }}
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`${stat.color} p-3 rounded-full`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {stat.trend && (
                  <div className={`flex items-center gap-1 text-xs font-semibold ${
                    stat.trend.direction === 'up' ? 'text-green-600' : 
                    stat.trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    <TrendIcon className="w-3 h-3" />
                    {stat.trend.value}%
                  </div>
                )}
              </div>
              <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {loading ? (
                  <span className="inline-block w-16 h-8 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  stat.value
                )}
              </p>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Weekly Attendance Chart */}
        {hasPermission(user, 'attendanceViewAll') && (
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Attendance Trend (Last 7 Days)
            </h2>
            {weeklyAttendance.length > 0 ? (
              <div className="h-64">
                <Line
                  data={{
                    labels: weeklyAttendance.map(d => {
                      const date = new Date(d.date)
                      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                    }),
                    datasets: [
                      {
                        label: 'Attendance Count',
                        data: weeklyAttendance.map(d => d.count),
                        fill: true,
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderColor: 'rgb(59, 130, 246)',
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: 'rgb(59, 130, 246)',
                        pointHoverRadius: 6,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { precision: 0 },
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                      },
                      x: {
                        grid: { display: false },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Loading chart data...
              </div>
            )}
          </div>
        )}

        {/* Organization Leave Overview Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Leave Overview
          </h2>
          {leaveBalance ? (
            <div className="flex flex-col items-center justify-center">
              <div className="w-48 h-48">
                <Doughnut
                  data={{
                    labels: ['Approved', 'Available'],
                    datasets: [
                      {
                        data: [leaveBalance.used, leaveBalance.remaining],
                        backgroundColor: ['#F59E0B', '#10B981'],
                        borderWidth: 0,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.label}: ${context.parsed} days`,
                        },
                      },
                    },
                  }}
                />
              </div>
              <div className="text-center mt-4">
                <p className="text-3xl font-bold text-gray-800">{leaveBalance.used + leaveBalance.remaining}</p>
                <p className="text-sm text-gray-600">total leave days</p>
                <div className="flex gap-4 mt-3 justify-center">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-xs text-gray-600">{leaveBalance.used} approved</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-600">{leaveBalance.remaining} available</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              Loading leave data...
            </div>
          )}
        </div>
      </div>

      {/* Admin Management Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pending Leave Approvals */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Pending Leave Approvals
            </h2>
            <button
              onClick={() => navigate('/dashboard/leaves')}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              View All →
            </button>
          </div>
          
          {leavesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : stats.pendingLeaves === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
              <p className="text-gray-600">All leave requests reviewed</p>
              <p className="text-sm text-gray-500 mt-2">Great job! No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-2xl font-bold text-orange-700">{stats.pendingLeaves}</p>
                  <span className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-xs font-bold">
                    PENDING
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">Leave requests awaiting your approval</p>
                <button
                  onClick={() => navigate('/dashboard/leaves')}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-semibold"
                >
                  Review Requests
                </button>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Quick Stats</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">This Month:</span>
                  <span className="font-semibold text-gray-800">{stats.pendingLeaves} pending</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Today's Attendance Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Today's Attendance
            </h2>
            <button
              onClick={() => navigate('/dashboard/attendance')}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              View Details →
            </button>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Present Today</p>
                      <p className="text-2xl font-bold text-blue-700">{stats.attendanceToday}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Out of</p>
                    <p className="text-lg font-semibold text-gray-700">{stats.employees}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Attendance Rate:</span>
                    <span className="font-bold text-blue-700">
                      {stats.employees > 0 ? Math.round((stats.attendanceToday / stats.employees) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Absent</p>
                  <p className="text-xl font-bold text-red-600">{stats.employees - stats.attendanceToday}</p>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">On Leave</p>
                  <p className="text-xl font-bold text-yellow-600">{stats.pendingLeaves}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activity & Events Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Activity Feed */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </h2>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => {
                const ActivityIcon = activity.icon
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <ActivityIcon className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.time).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No recent activity</p>
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Events
          </h2>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => {
                const EventIcon = event.icon
                return (
                  <div key={event.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <EventIcon className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No upcoming events</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Announcements Widget */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Recent Announcements
          </h2>
          <button
            onClick={() => navigate('/dashboard/announcements')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </button>
        </div>
        
        {announcementsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 animate-pulse rounded"></div>
            ))}
          </div>
        ) : recentAnnouncements.length === 0 ? (
          <div className="text-center py-6">
            <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No announcements available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                onClick={() => navigate('/dashboard/announcements')}
                className={`p-4 border-l-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  announcement.is_urgent ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-800">{announcement.title}</h3>
                      {announcement.is_urgent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                          <AlertCircle className="w-3 h-3" />
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{announcement.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {announcement.published_at && new Date(announcement.published_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Management Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/dashboard/employees')}
            className="p-5 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-all group"
          >
            <Users className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-gray-800 mb-1">Manage Employees</h3>
            <p className="text-sm text-gray-600">View and edit employee records</p>
          </button>
          <button 
            onClick={() => navigate('/dashboard/leaves')}
            className="p-5 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 text-left transition-all group"
          >
            <AlertCircle className="w-8 h-8 text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-gray-800 mb-1">Approve Leaves</h3>
            <p className="text-sm text-gray-600">Review pending leave requests</p>
          </button>
          <button 
            onClick={() => navigate('/dashboard/reports')}
            className="p-5 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 text-left transition-all group"
          >
            <TrendingUp className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-gray-800 mb-1">View Reports</h3>
            <p className="text-sm text-gray-600">Access analytics and insights</p>
          </button>
          <button 
            onClick={() => navigate('/dashboard/announcements')}
            className="p-5 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 text-left transition-all group"
          >
            <Megaphone className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-gray-800 mb-1">Post Announcement</h3>
            <p className="text-sm text-gray-600">Share updates with team</p>
          </button>
        </div>
      </div>
    </div>
  )

  // Main return - conditional rendering based on user role
  return isEmployee(user) ? renderEmployeeDashboard() : renderAdminDashboard()
}
