import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { 
  Users, 
  DollarSign, 
  Calendar, 
  FileText, 
  Building2, 
  UserCheck, 
  BarChart3, 
  Bell,
  Shield,
  Clock,
  CheckCircle2,
  Briefcase,
  LogIn,
  Home,
  Info,
  Sparkles,
  Menu,
  X
} from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setMobileMenuOpen(false)
  }

  const features = [
    {
      icon: Users,
      title: 'Employee Management',
      description: 'Comprehensive employee database with role-based access control and detailed profiles.'
    },
    {
      icon: DollarSign,
      title: 'Payroll Processing',
      description: 'Automated payroll calculations, SSS, PhilHealth, and Pag-IBIG deductions with tax computation.'
    },
    {
      icon: Calendar,
      title: 'Attendance Tracking',
      description: 'Real-time attendance monitoring with clock-in/out functionality and detailed reports.'
    },
    {
      icon: FileText,
      title: 'Leave Management',
      description: 'Streamlined leave request and approval process with balance tracking and history.'
    },
    {
      icon: Building2,
      title: 'Department Organization',
      description: 'Manage departments, positions, and organizational structure efficiently.'
    },
    {
      icon: UserCheck,
      title: 'Recruitment',
      description: 'Track job applications, manage candidates, and streamline hiring processes.'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Generate comprehensive reports for attendance, payroll, leaves, and more.'
    },
    {
      icon: Bell,
      title: 'Announcements',
      description: 'Keep your team informed with company-wide announcements and notifications.'
    }
  ]


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EMS
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => scrollToSection('hero')}
                className="flex items-center gap-2 text-gray-700 hover:text-purple-600 font-medium transition-colors"
              >
                <Home className="h-5 w-5" />
                Home
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="flex items-center gap-2 text-gray-700 hover:text-purple-600 font-medium transition-colors"
              >
                <Info className="h-5 w-5" />
                About Us
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="flex items-center gap-2 text-gray-700 hover:text-purple-600 font-medium transition-colors"
              >
                <Sparkles className="h-5 w-5" />
                Features
              </button>
              <button
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                Sign In
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-purple-600"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-3">
              <button 
                onClick={() => scrollToSection('hero')}
                className="flex items-center gap-3 w-full text-left text-gray-700 hover:text-purple-600 font-medium transition-colors py-2"
              >
                <Home className="h-5 w-5" />
                Home
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="flex items-center gap-3 w-full text-left text-gray-700 hover:text-purple-600 font-medium transition-colors py-2"
              >
                <Info className="h-5 w-5" />
                About Us
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="flex items-center gap-3 w-full text-left text-gray-700 hover:text-purple-600 font-medium transition-colors py-2"
              >
                <Sparkles className="h-5 w-5" />
                Features
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-6 sm:space-y-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Simplify Your
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Employee Management
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed">
              A comprehensive Employee Management System designed for Philippine businesses. 
              Streamline HR operations, automate payroll, and empower your workforce.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              >
                <LogIn className="h-5 w-5" />
                Log in as Employee
              </button>
              <button
                onClick={() => navigate('/careers')}
                className="bg-white text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg border-2 border-gray-300 hover:border-purple-600 hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              >
                <Briefcase className="h-5 w-5" />
                Apply for a Job
              </button>
            </div>
          </div>
          <div className="relative mt-8 md:mt-0">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-xl p-6 sm:p-8 md:p-12 border border-gray-100">
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-md">
                    <div className="bg-blue-600 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm md:text-lg mb-1 sm:mb-2">Employee Management</h3>
                    <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">Streamline workforce operations</p>
                  </div>
                  <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-md">
                    <div className="bg-purple-600 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                      <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm md:text-lg mb-1 sm:mb-2">Analytics & Reports</h3>
                    <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">Data-driven insights</p>
                  </div>
                  <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-md">
                    <div className="bg-green-600 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                      <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm md:text-lg mb-1 sm:mb-2">Payroll Processing</h3>
                    <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">Automated calculations</p>
                  </div>
                  <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-md">
                    <div className="bg-orange-600 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                      <Shield className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm md:text-lg mb-1 sm:mb-2">Secure & Compliant</h3>
                    <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">Enterprise-grade security</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="bg-gradient-to-br from-purple-50 to-blue-50 py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                About Our EMS
              </h2>
              <p className="text-lg sm:text-xl text-gray-600">
                Empowering businesses with modern workforce management
              </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-12 mb-6 sm:mb-8">
              <div className="prose max-w-none">
                <p className="text-base sm:text-lg text-gray-700 mb-4 sm:mb-6">
                  Our Employee Management System is specifically designed for Philippine businesses, 
                  providing a comprehensive solution to streamline HR operations, automate payroll processing, 
                  and enhance workforce productivity.
                </p>
                <p className="text-base sm:text-lg text-gray-700 mb-4 sm:mb-6">
                  Built with modern technology and best practices, our EMS handles everything from employee 
                  records and attendance tracking to leave management and recruitment, all while ensuring 
                  compliance with Philippine labor laws and regulations.
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
                <div className="text-center p-4 sm:p-6 bg-blue-50 rounded-xl">
                  <div className="bg-blue-600 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Secure & Reliable</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">Enterprise-grade security with 99.9% uptime</p>
                </div>
                <div className="text-center p-4 sm:p-6 bg-purple-50 rounded-xl">
                  <div className="bg-purple-600 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Compliant</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">Follows Philippine labor laws and tax regulations</p>
                </div>
                <div className="text-center p-4 sm:p-6 bg-green-50 rounded-xl sm:col-span-2 md:col-span-1">
                  <div className="bg-green-600 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">User-Friendly</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">Intuitive interface for all user levels</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Key Features
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Everything you need to manage your workforce efficiently
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold">EMS</span>
            </div>
            <p className="text-gray-400 text-center text-sm sm:text-base">
              &copy; {new Date().getFullYear()} EMS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
