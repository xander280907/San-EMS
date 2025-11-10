
// Role-based permissions utility

export const ROLES = {
  ADMIN: 'admin',
  HR: 'hr',
  EMPLOYEE: 'employee'
}

// Define which roles can access which routes/features
export const PERMISSIONS = {
  // Dashboard - everyone can access
  dashboard: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
  
  // Employee management - admin and HR only
  employees: [ROLES.ADMIN, ROLES.HR],
  employeesCreate: [ROLES.ADMIN, ROLES.HR],
  employeesEdit: [ROLES.ADMIN, ROLES.HR],
  employeesDelete: [ROLES.ADMIN],
  
  // Payroll - admin and HR can access and process, only admin can unlock/delete
  payroll: [ROLES.ADMIN, ROLES.HR],
  payrollCreate: [ROLES.ADMIN, ROLES.HR],
  payrollEdit: [ROLES.ADMIN, ROLES.HR],
  payrollUnlock: [ROLES.ADMIN],
  payrollDelete: [ROLES.ADMIN],
  
  // My Payslips - employees only can view their own payslips
  myPayslips: [ROLES.EMPLOYEE],
  
  // Profile - everyone can view and edit their own profile
  profile: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
  
  // Attendance - everyone can view their own, admin and HR can view all
  attendance: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
  attendanceViewAll: [ROLES.ADMIN, ROLES.HR],
  
  // Leaves - everyone can request, admin and HR can approve
  leaves: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
  leavesApprove: [ROLES.ADMIN, ROLES.HR],
  
  // Departments - admin and HR only
  departments: [ROLES.ADMIN, ROLES.HR],
  
  // Announcements - everyone can view, admin and HR can create
  announcements: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
  announcementsCreate: [ROLES.ADMIN, ROLES.HR],
  
  // Recruitment - admin and HR only
  recruitment: [ROLES.ADMIN, ROLES.HR],
  
  // Reports - admin and HR only
  reports: [ROLES.ADMIN, ROLES.HR],
}

/**
 * Check if a user has permission to access a feature
 * @param {Object} user - User object with role property
 * @param {string} permission - Permission key from PERMISSIONS
 * @returns {boolean}
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false
  
  const allowedRoles = PERMISSIONS[permission]
  if (!allowedRoles) return false
  
  return allowedRoles.includes(user.role.toLowerCase())
}

/**
 * Check if user is admin
 */
export const isAdmin = (user) => {
  return user?.role?.toLowerCase() === ROLES.ADMIN
}

/**
 * Check if user is HR
 */
export const isHR = (user) => {
  return user?.role?.toLowerCase() === ROLES.HR
}

/**
 * Check if user is employee
 */
export const isEmployee = (user) => {
  return user?.role?.toLowerCase() === ROLES.EMPLOYEE
}

/**
 * Check if user can view all data (admin or HR)
 */
export const canViewAll = (user) => {
  return isAdmin(user) || isHR(user)
}
