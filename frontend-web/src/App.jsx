import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoadingProvider } from './context/LoadingContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Payroll from './pages/Payroll'
import Attendance from './pages/Attendance'
import Leaves from './pages/Leaves'
import Departments from './pages/Departments'
import Announcements from './pages/Announcements'
import Recruitment from './pages/Recruitment'
import Reports from './pages/Reports'
import MyPayslips from './pages/MyPayslips'
import Profile from './pages/Profile'
import JobApplications from './pages/JobApplications'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import GlobalLoading from './components/GlobalLoading'
import RouteLoadingBar from './components/RouteLoadingBar'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner fullScreen message="Initializing..." size="xl" />
  }

  return (
    <Routes>
      <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/careers" element={<JobApplications />} />
      {user && (
        <Route path="/dashboard" element={<Layout />}>
          <Route 
            index 
            element={
              <ProtectedRoute permission="dashboard">
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="employees" 
            element={
              <ProtectedRoute permission="employees">
                <Employees />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="payroll" 
            element={
              <ProtectedRoute permission="payroll">
                <Payroll />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="attendance" 
            element={
              <ProtectedRoute permission="attendance">
                <Attendance />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="leaves" 
            element={
              <ProtectedRoute permission="leaves">
                <Leaves />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="departments" 
            element={
              <ProtectedRoute permission="departments">
                <Departments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="announcements" 
            element={
              <ProtectedRoute permission="announcements">
                <Announcements />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="recruitment" 
            element={
              <ProtectedRoute permission="recruitment">
                <Recruitment />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="reports" 
            element={
              <ProtectedRoute permission="reports">
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="my-payslips" 
            element={
              <ProtectedRoute permission="myPayslips">
                <MyPayslips />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="profile" 
            element={
              <ProtectedRoute permission="profile">
                <Profile />
              </ProtectedRoute>
            } 
          />
        </Route>
      )}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
    </Routes>
  )
}

function App() {
  return (
    <LoadingProvider>
      <AuthProvider>
        <RouteLoadingBar />
        <GlobalLoading />
        <AppRoutes />
      </AuthProvider>
    </LoadingProvider>
  )
}

export default App
