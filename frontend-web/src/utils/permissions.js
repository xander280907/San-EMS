
// Role-based permissions utility

export const ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee'
}

// Define which roles can access which routes/features
export const PERMISSIONS = {
  // Dashboard - everyone can access
  dashboard: [ROLES.ADMIN, ROLES.EMPLOYEE],
  
  // Employee management - admin only
  employees: [ROLES.ADMIN],
  employeesCreate: [ROLES.ADMIN],
  employeesEdit: [ROLES.ADMIN],
  employeesDelete: [ROLES.ADMIN],
  
  // Payroll - admin only
  payroll: [ROLES.ADMIN],
  payrollCreate: [ROLES.ADMIN],
  payrollEdit: [ROLES.ADMIN],
  payrollUnlock: [ROLES.ADMIN],
  payrollDelete: [ROLES.ADMIN],
  
  // My Payslips - employees only can view their own payslips
  myPayslips: [ROLES.EMPLOYEE],
  
  // Profile - everyone can view and edit their own profile
  profile: [ROLES.ADMIN, ROLES.EMPLOYEE],
  
  // Attendance - everyone can view their own, admin can view all
  attendance: [ROLES.ADMIN, ROLES.EMPLOYEE],
  attendanceViewAll: [ROLES.ADMIN],
  
  // Leaves - everyone can request, admin can approve
  leaves: [ROLES.ADMIN, ROLES.EMPLOYEE],
  leavesApprove: [ROLES.ADMIN],
  
  // Departments - admin only
  departments: [ROLES.ADMIN],
  
  // Announcements - everyone can view, admin can create
  announcements: [ROLES.ADMIN, ROLES.EMPLOYEE],
  announcementsCreate: [ROLES.ADMIN],
  
  // Recruitment - admin only
  recruitment: [ROLES.ADMIN],
  
  // Reports - admin only
  reports: [ROLES.ADMIN],
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
 * Check if user is employee
 */
export const isEmployee = (user) => {
  return user?.role?.toLowerCase() === ROLES.EMPLOYEE
}

/**
 * Check if user can view all data (admin only)
 */
export const canViewAll = (user) => {
  return isAdmin(user)
}
