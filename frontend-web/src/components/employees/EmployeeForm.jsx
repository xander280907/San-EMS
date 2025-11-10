import { useEffect, useMemo, useState, useRef, memo } from 'react'
import { Eye, EyeOff, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { positionAPI } from '../../services/api'

const EmployeeForm = memo(function EmployeeForm({
  initialData = null,
  departments = [],
  onSubmit,
  onCancel,
  loading = false,
  serverErrors = null,
}) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  
  // State for positions from database
  const [departmentPositions, setDepartmentPositions] = useState([])
  const [loadingPositions, setLoadingPositions] = useState(false)
  
  // Fallback hardcoded positions
  const fallbackPositions = {
    'Human Resources': ['HR Manager', 'HR Specialist', 'HR Assistant', 'Recruiter', 'Training Coordinator'],
    'HR': ['HR Manager', 'HR Specialist', 'HR Assistant', 'Recruiter', 'Training Coordinator'],
    'IT': ['IT Manager', 'Developer', 'Senior Developer', 'Junior Developer', 'IT Specialist', 'System Administrator', 'Network Engineer', 'QA Tester'],
    'Information Technology': ['IT Manager', 'Developer', 'Senior Developer', 'Junior Developer', 'IT Specialist', 'System Administrator', 'Network Engineer', 'QA Tester'],
    'Technology': ['IT Manager', 'Developer', 'Senior Developer', 'Junior Developer', 'IT Specialist', 'System Administrator', 'Network Engineer', 'QA Tester'],
    'Finance': ['Finance Manager', 'Accountant', 'Finance Officer', 'Payroll Specialist', 'Auditor', 'Financial Analyst'],
    'Accounting': ['Finance Manager', 'Accountant', 'Finance Officer', 'Payroll Specialist', 'Auditor', 'Financial Analyst'],
    'Marketing': ['Marketing Manager', 'Marketing Officer', 'Digital Marketing Specialist', 'Content Writer', 'Social Media Manager', 'Brand Manager'],
    'Sales': ['Sales Manager', 'Sales Representative', 'Sales Executive', 'Account Manager', 'Business Development Officer'],
    'Operations': ['Operations Manager', 'Operations Officer', 'Logistics Coordinator', 'Operations Analyst'],
    'Customer Service': ['Customer Service Manager', 'Customer Service Representative', 'Support Specialist', 'Call Center Agent'],
    'Customer Support': ['Customer Service Manager', 'Customer Service Representative', 'Support Specialist', 'Call Center Agent', 'Technical Support'],
    'Support': ['Customer Service Manager', 'Customer Service Representative', 'Support Specialist', 'Call Center Agent', 'Technical Support'],
    'Administration': ['Administrative Manager', 'Administrative Assistant', 'Office Manager', 'Receptionist', 'Executive Secretary'],
    'Admin': ['Administrative Manager', 'Administrative Assistant', 'Office Manager', 'Receptionist', 'Executive Secretary'],
    'Design': ['Design Manager', 'Graphic Designer', 'UI/UX Designer', 'Creative Director', 'Art Director'],
    'default': ['Manager', 'Assistant Manager', 'Supervisor', 'Team Leader', 'Senior Staff', 'Staff', 'Junior Staff', 'Intern']
  }
  
  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    phone: '',
    employee_number: '',
    department_id: '',
    position: '',
    employment_type: 'full-time',
    hire_date: '',
    base_salary: '',
    allowance: '',
    sss_number: '',
    philhealth_number: '',
    pagibig_number: '',
    tin_number: '',
    address: '',
    gender: '',
    birth_date: '',
    marital_status: '',
    status: 'active',
  })

  const [showPassword, setShowPassword] = useState(false)
  const isEdit = useMemo(() => Boolean(initialData?.id), [initialData])
  
  // Validation errors for government IDs
  const [validationErrors, setValidationErrors] = useState({})

  // Initialize form once on mount - use useRef to track if we've initialized
  const hasInitialized = useRef(false)
  
  // Refs for error fields to scroll to
  const errorRefs = useRef({})

  // Helper function to format date to YYYY-MM-DD for date inputs
  const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    // Extract just the date part (YYYY-MM-DD) from ISO format or timestamp
    return dateString.split('T')[0]
  }

  useEffect(() => {
    // Only initialize once when component mounts
    if (!hasInitialized.current) {
      if (initialData) {
        setForm({
          email: initialData.user?.email || '',
          password: '',
          first_name: initialData.user?.first_name || '',
          last_name: initialData.user?.last_name || '',
          middle_name: initialData.user?.middle_name || '',
          phone: initialData.user?.phone || '',
          employee_number: initialData.employee_number || '',
          department_id: initialData.department_id || '',
          position: initialData.position || '',
          employment_type: initialData.employment_type || 'full-time',
          hire_date: formatDateForInput(initialData.hire_date) || '',
          base_salary: initialData.base_salary ?? '',
          allowance: initialData.allowance ?? '',
          sss_number: initialData.sss_number || '',
          philhealth_number: initialData.philhealth_number || '',
          pagibig_number: initialData.pagibig_number || '',
          tin_number: initialData.tin_number || '',
          address: initialData.address || '',
          gender: initialData.gender || '',
          birth_date: formatDateForInput(initialData.birth_date) || '',
          marital_status: initialData.marital_status || '',
          status: initialData.status || 'active',
        })
      } else {
        // Auto-generate employee number for new employees
        generateEmployeeNumber()
        // Auto-fill hire date with current date
        const today = new Date().toISOString().split('T')[0]
        setForm((prev) => ({ ...prev, hire_date: today }))
      }
      hasInitialized.current = true
    }
  }, [])

  // Scroll to first error field when errors occur
  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      const firstErrorField = Object.keys(serverErrors)[0]
      const errorElement = errorRefs.current[firstErrorField]
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        errorElement.focus()
      }
    }
  }, [serverErrors])

  const generateEmployeeNumber = () => {
    // Generate random 4-digit number (1000-9999)
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const empNumber = randomNum.toString()
    setForm((prev) => ({ ...prev, employee_number: empNumber }))
  }

  // Fetch positions when department changes
  useEffect(() => {
    if (form.department_id) {
      fetchDepartmentPositions(form.department_id)
    } else {
      setDepartmentPositions([])
    }
  }, [form.department_id])

  const fetchDepartmentPositions = async (departmentId) => {
    setLoadingPositions(true)
    try {
      const res = await positionAPI.getAll({ department_id: departmentId })
      const positions = res.data || []
      // Filter only active positions
      const activePositions = positions.filter(p => p.status === 'active')
      setDepartmentPositions(activePositions)
    } catch (error) {
      console.error('Failed to fetch positions:', error)
      setDepartmentPositions([])
    } finally {
      setLoadingPositions(false)
    }
  }
  
  // Get positions based on selected department
  const getAvailablePositions = () => {
    // If we have database positions, use them
    if (departmentPositions.length > 0) {
      return departmentPositions
    }
    
    // Otherwise, use fallback hardcoded positions
    if (!form.department_id) {
      return []
    }
    
    const selectedDept = departments.find(d => d.id === parseInt(form.department_id))
    if (!selectedDept) {
      return []
    }
    
    const deptName = selectedDept.name
    
    // Try exact match first
    if (fallbackPositions[deptName]) {
      return fallbackPositions[deptName].map(p => ({ title: p }))
    }
    
    // Try case-insensitive partial match
    const deptNameLower = deptName.toLowerCase()
    for (const key in fallbackPositions) {
      if (key.toLowerCase().includes(deptNameLower) || deptNameLower.includes(key.toLowerCase())) {
        return fallbackPositions[key].map(p => ({ title: p }))
      }
    }
    
    return fallbackPositions['default'].map(p => ({ title: p }))
  }

  const formatGovernmentId = (name, value) => {
    // Remove all non-digit characters first
    const digitsOnly = value.replace(/\D/g, '')
    
    switch(name) {
      case 'sss_number':
        // Format: ##-#######-#
        if (digitsOnly.length <= 2) return digitsOnly
        if (digitsOnly.length <= 9) return `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2)}`
        return `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2, 9)}-${digitsOnly.slice(9, 10)}`
      
      case 'tin_number':
        // Format: ###-###-###-### (for 12 digits) or ###-###-### (for 9 digits)
        if (digitsOnly.length <= 3) return digitsOnly
        if (digitsOnly.length <= 6) return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`
        if (digitsOnly.length <= 9) return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`
        return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 9)}-${digitsOnly.slice(9, 12)}`
      
      case 'philhealth_number':
      case 'pagibig_number':
        // No formatting, just limit to 12 digits
        return digitsOnly.slice(0, 12)
      
      case 'phone':
        // Phone must start with 09, limit to 11 digits
        if (!digitsOnly) return ''
        // If user types something, ensure it starts with 09
        if (digitsOnly.length === 1) {
          // If they type 0, return 0 and wait for next digit
          if (digitsOnly === '0') return '0'
          // If they type 9, add 0 before it
          if (digitsOnly === '9') return '09'
          // Any other digit, prepend 09
          return '09' + digitsOnly
        }
        if (digitsOnly.length >= 2) {
          // Ensure it starts with 09
          if (!digitsOnly.startsWith('09')) {
            if (digitsOnly.startsWith('9')) {
              return '09' + digitsOnly.slice(1, 10)
            }
            return '09' + digitsOnly.slice(0, 9)
          }
        }
        return digitsOnly.slice(0, 11)
      
      default:
        return value
    }
  }

  const validateGovernmentId = (name, value) => {
    if (!value) return null // Optional fields, no error if empty
    
    // Remove hyphens for validation
    const digitsOnly = value.replace(/\D/g, '')
    
    switch(name) {
      case 'sss_number':
        // Format: ##-#######-# (10 digits total)
        if (digitsOnly.length !== 10 || !/^\d{2}-\d{7}-\d{1}$/.test(value)) {
          return 'SSS should be 10 digits (format: ##-#######-#)'
        }
        break
      case 'philhealth_number':
        // 12 digits
        if (digitsOnly.length !== 12) {
          return 'PhilHealth should be exactly 12 digits'
        }
        break
      case 'pagibig_number':
        // 12 digits
        if (digitsOnly.length !== 12) {
          return 'Pag-IBIG should be exactly 12 digits'
        }
        break
      case 'tin_number':
        // 9-12 digits
        if (digitsOnly.length < 9 || digitsOnly.length > 12) {
          return 'TIN should be 9-12 digits'
        }
        break
      case 'phone':
        // 11 digits starting with 09
        if (digitsOnly.length !== 11) {
          return 'Phone should be exactly 11 digits'
        }
        if (!digitsOnly.startsWith('09')) {
          return 'Phone should start with 09'
        }
        break
      default:
        return null
    }
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Handle employee number - only 4 digits
    if (name === 'employee_number') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 4)
      setForm((prev) => ({ ...prev, [name]: digitsOnly }))
      
      // Validate employee number
      if (digitsOnly && digitsOnly.length !== 4) {
        setValidationErrors((prev) => ({ ...prev, employee_number: 'Employee # must be exactly 4 digits' }))
      } else {
        setValidationErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.employee_number
          return newErrors
        })
      }
      return
    }
    
    // Handle base salary validation with position range
    if (name === 'base_salary') {
      setForm((prev) => ({ ...prev, [name]: value }))
      
      // Validate against position salary range
      const selectedPosition = departmentPositions.find(p => p.title === form.position)
      if (selectedPosition && value) {
        const salary = parseFloat(value)
        const minSalary = selectedPosition.min_salary ? parseFloat(selectedPosition.min_salary) : null
        const maxSalary = selectedPosition.max_salary ? parseFloat(selectedPosition.max_salary) : null
        
        if (minSalary && salary < minSalary) {
          setValidationErrors((prev) => ({ 
            ...prev, 
            base_salary: `Salary cannot be lower than ₱${minSalary.toLocaleString()} (position minimum)` 
          }))
        } else if (maxSalary && salary > maxSalary) {
          setValidationErrors((prev) => ({ 
            ...prev, 
            base_salary: `Salary cannot be higher than ₱${maxSalary.toLocaleString()} (position maximum)` 
          }))
        } else {
          setValidationErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors.base_salary
            return newErrors
          })
        }
      } else {
        setValidationErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.base_salary
          return newErrors
        })
      }
      return
    }
    
    // When department changes, reset position and salary
    if (name === 'department_id') {
      setForm((prev) => ({
        ...prev,
        [name]: value,
        position: '', // Reset position when department changes
        base_salary: '' // Reset salary
      }))
      return
    }
    
    // When position changes, auto-fill base salary
    if (name === 'position') {
      setForm((prev) => {
        const newForm = { ...prev, [name]: value }
        
        // Find the selected position from database positions
        const selectedPosition = departmentPositions.find(p => p.title === value)
        
        if (selectedPosition) {
          // Auto-fill base salary from position
          // Use average of min and max salary, or min_salary if max not available
          if (selectedPosition.min_salary && selectedPosition.max_salary) {
            const avgSalary = (parseFloat(selectedPosition.min_salary) + parseFloat(selectedPosition.max_salary)) / 2
            newForm.base_salary = avgSalary.toFixed(2)
          } else if (selectedPosition.min_salary) {
            newForm.base_salary = parseFloat(selectedPosition.min_salary).toFixed(2)
          } else if (selectedPosition.max_salary) {
            newForm.base_salary = parseFloat(selectedPosition.max_salary).toFixed(2)
          }
        }
        
        return newForm
      })
      return
    }
    
    // Auto-format and validate government ID fields and phone
    if (['sss_number', 'philhealth_number', 'pagibig_number', 'tin_number', 'phone'].includes(name)) {
      const formattedValue = formatGovernmentId(name, value)
      setForm((prev) => ({ ...prev, [name]: formattedValue }))
      
      const error = validateGovernmentId(name, formattedValue)
      setValidationErrors((prev) => {
        if (error) {
          return { ...prev, [name]: error }
        } else {
          const newErrors = { ...prev }
          delete newErrors[name]
          return newErrors
        }
      })
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form }
    if (isEdit) {
      // For edit, password is optional; remove if empty
      if (!payload.password) delete payload.password
    }
    onSubmit(payload)
  }

  const renderError = (field) => {
    // Check validation errors first, then server errors
    const validationErr = validationErrors[field]
    if (validationErr) {
      return <p className="text-sm text-red-600 mt-1">{validationErr}</p>
    }
    
    if (!serverErrors) return null
    const err = serverErrors?.[field]
    if (!err) return null
    const message = Array.isArray(err) ? err.join(', ') : String(err)
    return <p className="text-sm text-red-600 mt-1">{message}</p>
  }

  const hasError = (field) => {
    return validationErrors[field] || (serverErrors && serverErrors[field])
  }

  const getInputClassName = (field, baseClassName = 'mt-1 w-full border rounded px-3 py-2') => {
    return hasError(field) 
      ? `${baseClassName} border-red-500 focus:border-red-500 focus:ring-red-500`
      : baseClassName
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Account */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Account</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              ref={(el) => (errorRefs.current['email'] = el)}
              type="email" 
              name="email" 
              value={form.email} 
              onChange={handleChange} 
              required 
              autoComplete="off"
              className={getInputClassName('email')} 
            />
            {renderError('email')}
          </div>
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input 
                  ref={(el) => (errorRefs.current['password'] = el)}
                  type={showPassword ? 'text' : 'password'} 
                  name="password" 
                  value={form.password} 
                  onChange={handleChange} 
                  required 
                  autoComplete="new-password"
                  className={getInputClassName('password')} 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {renderError('password')}
            </div>
          )}
        </div>
      </section>

      {/* Personal */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Personal Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input 
              ref={(el) => (errorRefs.current['first_name'] = el)}
              name="first_name" 
              value={form.first_name} 
              onChange={handleChange} 
              required 
              className={getInputClassName('first_name')} 
            />
            {renderError('first_name')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Middle Name</label>
            <input 
              name="middle_name" 
              value={form.middle_name} 
              onChange={handleChange} 
              className={getInputClassName('middle_name')} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input 
              ref={(el) => (errorRefs.current['last_name'] = el)}
              name="last_name" 
              value={form.last_name} 
              onChange={handleChange} 
              required 
              className={getInputClassName('last_name')} 
            />
            {renderError('last_name')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone <span className="text-gray-500 text-xs">(09XXXXXXXXX)</span></label>
            <input 
              ref={(el) => (errorRefs.current['phone'] = el)}
              name="phone" 
              value={form.phone} 
              onChange={handleChange} 
              placeholder="09XXXXXXXXX"
              className={getInputClassName('phone')} 
            />
            {renderError('phone')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <select name="gender" value={form.gender} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Birth Date</label>
            <input type="date" name="birth_date" value={form.birth_date} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input name="address" value={form.address} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Marital Status</label>
            <select name="marital_status" value={form.marital_status} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
              <option value="">Select</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="widowed">Widowed</option>
              <option value="separated">Separated</option>
            </select>
          </div>
        </div>
      </section>

      {/* Employment */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Employment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Employee # <span className="text-gray-500 text-xs">(4 digits)</span></label>
            <div className="relative">
              <input 
                ref={(el) => (errorRefs.current['employee_number'] = el)}
                name="employee_number" 
                value={form.employee_number} 
                onChange={handleChange} 
                required 
                readOnly={isEdit}
                className={getInputClassName('employee_number', `mt-1 w-full border rounded px-3 py-2 ${isEdit ? 'bg-gray-50' : ''}`)} 
              />
              {!isEdit && (
                <button
                  type="button"
                  onClick={generateEmployeeNumber}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800"
                  title="Generate new number"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
            {renderError('employee_number')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <select 
              ref={(el) => (errorRefs.current['department_id'] = el)}
              name="department_id" 
              value={form.department_id} 
              onChange={handleChange} 
              required 
              className={getInputClassName('department_id')}
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {renderError('department_id')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Position</label>
            <select 
              ref={(el) => (errorRefs.current['position'] = el)}
              name="position" 
              value={form.position} 
              onChange={handleChange} 
              required 
              disabled={!form.department_id || loadingPositions}
              className={getInputClassName('position')} 
            >
              <option value="">
                {!form.department_id ? 'Select department first' : loadingPositions ? 'Loading positions...' : 'Select position'}
              </option>
              {getAvailablePositions().map((position) => {
                const posTitle = position.title || position
                const posObj = typeof position === 'object' ? position : null
                return (
                  <option key={posTitle} value={posTitle}>
                    {posTitle}
                    {posObj?.min_salary && posObj?.max_salary && (
                      ` (₱${parseFloat(posObj.min_salary).toLocaleString()} - ₱${parseFloat(posObj.max_salary).toLocaleString()})`
                    )}
                  </option>
                )
              })}
            </select>
            {form.department_id && departmentPositions.length === 0 && !loadingPositions && (
              <p className="text-xs text-amber-600 mt-1">No positions defined for this department. Please add positions first.</p>
            )}
            {renderError('position')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Employment Type</label>
            <select name="employment_type" value={form.employment_type} onChange={handleChange} required className="mt-1 w-full border rounded px-3 py-2">
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="probationary">Probationary</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hire Date</label>
            <input 
              type="date" 
              name="hire_date" 
              value={form.hire_date} 
              onChange={handleChange} 
              required 
              disabled={isEdit && !isAdmin}
              className={`mt-1 w-full border rounded px-3 py-2 ${isEdit && !isAdmin ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''}`}
            />
            {isEdit && !isAdmin && <p className="text-xs text-gray-500 mt-1">Only admin can edit hire date</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </section>

      {/* Compensation */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Compensation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Base Salary</label>
            <input 
              ref={(el) => (errorRefs.current['base_salary'] = el)}
              type="number" 
              step="0.01" 
              name="base_salary" 
              value={form.base_salary} 
              onChange={handleChange} 
              required
              min={(() => {
                const selectedPos = departmentPositions.find(p => p.title === form.position)
                return selectedPos?.min_salary ? parseFloat(selectedPos.min_salary) : undefined
              })()}
              max={(() => {
                const selectedPos = departmentPositions.find(p => p.title === form.position)
                return selectedPos?.max_salary ? parseFloat(selectedPos.max_salary) : undefined
              })()}
              className={getInputClassName('base_salary')} 
            />
            {form.position && (() => {
              const selectedPos = departmentPositions.find(p => p.title === form.position)
              if (selectedPos?.min_salary && selectedPos?.max_salary) {
                return (
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    Required range: ₱{parseFloat(selectedPos.min_salary).toLocaleString()} - ₱{parseFloat(selectedPos.max_salary).toLocaleString()}
                  </p>
                )
              }
              return null
            })()}
            {renderError('base_salary')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Allowance</label>
            <input type="number" step="0.01" name="allowance" value={form.allowance} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2" />
          </div>
        </div>
      </section>

      {/* Government IDs */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Government IDs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">SSS <span className="text-gray-500 text-xs">(##-#######-#)</span></label>
            <input 
              ref={(el) => (errorRefs.current['sss_number'] = el)}
              name="sss_number" 
              value={form.sss_number} 
              onChange={handleChange} 
              className={getInputClassName('sss_number')} 
            />
            {renderError('sss_number')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">PhilHealth <span className="text-gray-500 text-xs">(12 digits)</span></label>
            <input 
              ref={(el) => (errorRefs.current['philhealth_number'] = el)}
              name="philhealth_number" 
              value={form.philhealth_number} 
              onChange={handleChange} 
              className={getInputClassName('philhealth_number')} 
            />
            {renderError('philhealth_number')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Pag-IBIG <span className="text-gray-500 text-xs">(12 digits)</span></label>
            <input 
              ref={(el) => (errorRefs.current['pagibig_number'] = el)}
              name="pagibig_number" 
              value={form.pagibig_number} 
              onChange={handleChange} 
              className={getInputClassName('pagibig_number')} 
            />
            {renderError('pagibig_number')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">TIN <span className="text-gray-500 text-xs">(9-12 digits)</span></label>
            <input 
              ref={(el) => (errorRefs.current['tin_number'] = el)}
              name="tin_number" 
              value={form.tin_number} 
              onChange={handleChange} 
              className={getInputClassName('tin_number')} 
            />
            {renderError('tin_number')}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} disabled={loading} className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50">
          {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Employee')}
        </button>
      </div>
    </form>
  )
})

export default EmployeeForm
