import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { hasPermission } from '../utils/permissions'
import LoadingButton from './LoadingButton'
import { 
  Home, Users, Clock, Calendar, 
  Building, Megaphone, Briefcase, BarChart, Wallet, UserCircle, User, Menu, X 
} from 'lucide-react'

// Custom Peso Icon Component
const PesoIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <text x="4" y="18" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold">₱</text>
  </svg>
)

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getProfilePictureUrl = (url) => {
    if (!url) return null
    return url.startsWith('http') ? url : `http://localhost:8000${url}`
  }

  // Get profile picture - check user.profile_picture first, then employee.profile_picture
  const userProfilePicture = user?.profile_picture || user?.employee?.profile_picture

  // Define all menu items with their required permissions
  const allMenuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', permission: 'dashboard' },
    { path: '/dashboard/employees', icon: Users, label: 'Employees', permission: 'employees' },
    { path: '/dashboard/payroll', icon: PesoIcon, label: 'Payroll', permission: 'payroll' },
    { path: '/dashboard/my-payslips', icon: Wallet, label: 'My Payslips', permission: 'myPayslips' },
    { path: '/dashboard/attendance', icon: Clock, label: 'Attendance', permission: 'attendance' },
    { path: '/dashboard/leaves', icon: Calendar, label: 'Leaves', permission: 'leaves' },
    { path: '/dashboard/departments', icon: Building, label: 'Departments', permission: 'departments' },
    { path: '/dashboard/announcements', icon: Megaphone, label: 'Announcements', permission: 'announcements' },
    { path: '/dashboard/recruitment', icon: Briefcase, label: 'Recruitment', permission: 'recruitment' },
    { path: '/dashboard/reports', icon: BarChart, label: 'Reports', permission: 'reports' },
    { path: '/dashboard/profile', icon: UserCircle, label: 'My Profile', permission: 'profile' },
  ]

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => hasPermission(user, item.permission))

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary-600">EMS</h1>
          <p className="text-sm text-gray-500 mt-1">Employee Management System</p>
        </div>
        
        <nav className="mt-6 flex-1 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center px-6 py-3 transition-all duration-200
                  ${isActive 
                    ? 'bg-primary-100 text-primary-700 font-semibold border-r-4 border-primary-600' 
                    : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto w-full bg-gray-50 border-t">
          <Link to="/dashboard/profile" className="flex items-center gap-3 p-4 hover:bg-gray-100 transition">
            {userProfilePicture ? (
              <img 
                src={getProfilePictureUrl(userProfilePicture)} 
                alt={`${user.first_name} ${user.last_name}`}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 shadow-sm"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <div 
              className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-sm"
              style={{ display: userProfilePicture ? 'none' : 'flex' }}
            >
              <User className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-gray-500">
                {user?.role === 'hr' ? 'HR' : (user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Employee')}
              </p>
            </div>
          </Link>
          <div className="px-4 pb-4">
            <LoadingButton
              onClick={handleLogout}
              loading={isLoggingOut}
              loadingText="Logging out..."
              variant="danger"
              className="w-full"
            >
              Logout
            </LoadingButton>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full scrollbar-hide">
        <div className="p-4 sm:p-6 lg:p-8 max-w-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
