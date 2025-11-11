import { useState, useEffect, useCallback } from 'react'
import { employeeAPI, attendanceAPI, payrollAPI } from '../../services/api'

export default function PayrollForm({ employees, onSubmit, onCancel, loading, serverErrors }) {
  const [formData, setFormData] = useState({
    employee_id: '',
    payroll_period: '',
    pay_date: '',
    base_salary: '',
    overtime_hours: '0',
    overtime_rate: '1.25',
    holiday_type: '',
    holiday_days: '0',
    late_minutes: '0',
    absent_days: '0',
    overtime_pay: '0',
    holiday_pay: '0',
    late_deduction: '0',
    absent_deduction: '0',
    allowance: '0',
    bonus: '0',
    philhealth: '0',
    sss: '0',
    pagibig: '0',
    withholding_tax: '0',
  })

  const [fetchingData, setFetchingData] = useState(false)
  const [duplicateCheck, setDuplicateCheck] = useState({ checking: false, exists: false, message: '', payroll: null })

  const [errors, setErrors] = useState({})

  // Memoized function to fetch attendance data
  const fetchAttendanceData = useCallback(async (employeeId, period) => {
    try {
      // Parse period (YYYY-MM format)
      const [year, month] = period.split('-')
      const startDate = `${year}-${month.padStart(2, '0')}-01`
      // Get last day of the month (month is 1-indexed in the format, but 0-indexed in Date constructor)
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
      const endDate = `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`
      
      console.log('Fetching attendance for:', { employeeId, period, startDate, endDate })
      
      const attRes = await attendanceAPI.getEmployeeAttendance(employeeId)
      const allAttendance = attRes.data?.data || attRes.data || []
      
      console.log('All attendance records:', allAttendance.length)
      
      // Filter attendance for the selected period
      const periodAttendance = allAttendance.filter(att => {
        const attDate = att.date || att.clock_in_time?.split(' ')[0] || att.clock_in?.split(' ')[0]
        if (!attDate) return false
        return attDate >= startDate && attDate <= endDate
      })
      
      console.log('Filtered attendance records:', periodAttendance.length, periodAttendance)
      
      // Calculate totals
      let totalOvertimeHours = 0
      let totalHolidayDays = 0
      let totalLateMinutes = 0
      let totalAbsentDays = 0
      
      // Count working days in the month
      const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate()
      const workingDaysInMonth = Math.floor(daysInMonth * 22 / 30) // Approximate working days
      
      periodAttendance.forEach(att => {
        // Overtime hours
        if (att.overtime_hours && parseFloat(att.overtime_hours) > 0) {
          totalOvertimeHours += parseFloat(att.overtime_hours)
        }
        
        // Holiday days
        if (att.is_holiday || att.holiday || att.is_holiday === 1) {
          totalHolidayDays += 1
        }
        
        // Late minutes
        if (att.late_minutes && parseFloat(att.late_minutes) > 0) {
          totalLateMinutes += parseFloat(att.late_minutes)
        }
        
        // Check for absences
        if (att.status === 'absent') {
          totalAbsentDays += 1
        }
      })
      
      // Calculate absent days
      const presentDays = periodAttendance.filter(att => 
        att.status === 'present' || att.clock_in_time || att.clock_in
      ).length
      
      // Count explicitly marked absent days
      const explicitAbsentDays = periodAttendance.filter(att => 
        att.status === 'absent'
      ).length
      
      // If we have attendance records, calculate absent days as: working days - present days
      // If no attendance records exist, use 0 (not fair to mark as absent if no tracking)
      if (periodAttendance.length > 0) {
        totalAbsentDays = Math.max(0, workingDaysInMonth - presentDays)
      } else {
        // No attendance records found for this period
        totalAbsentDays = 0
      }
      
      console.log('Calculated totals:', {
        totalOvertimeHours,
        totalHolidayDays,
        totalLateMinutes,
        totalAbsentDays,
        presentDays,
        explicitAbsentDays,
        workingDaysInMonth,
        attendanceRecordsFound: periodAttendance.length
      })
      
      setFormData(prev => ({
        ...prev,
        overtime_hours: totalOvertimeHours.toFixed(2),
        holiday_days: totalHolidayDays.toString(),
        late_minutes: totalLateMinutes.toFixed(0),
        absent_days: totalAbsentDays.toString(),
      }))
    } catch (e) {
      console.error('Error fetching attendance data:', e)
      // If attendance fetch fails, reset to zeros
      setFormData(prev => ({
        ...prev,
        overtime_hours: '0',
        holiday_days: '0',
        late_minutes: '0',
        absent_days: '0',
      }))
    }
  }, [])

  // Fetch employee data when employee is selected
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!formData.employee_id) return
      
      setFetchingData(true)
      try {
        // Fetch employee details
        const empRes = await employeeAPI.getById(formData.employee_id)
        const employee = empRes.data?.data || empRes.data
        
        // Auto-fill base salary and allowance
        const baseSalary = employee.base_salary || employee.salary || ''
        const allowance = employee.allowance || '0'
        
        setFormData(prev => ({
          ...prev,
          base_salary: baseSalary.toString(),
          allowance: allowance.toString(),
        }))
      } catch (e) {
        console.error('Error fetching employee data:', e)
      } finally {
        setFetchingData(false)
      }
    }
    
    fetchEmployeeData()
  }, [formData.employee_id])
  
  // Check for duplicate payroll when employee and period are selected
  useEffect(() => {
    const checkDuplicate = async () => {
      if (!formData.employee_id || !formData.payroll_period) {
        setDuplicateCheck({ checking: false, exists: false, message: '', payroll: null })
        return
      }

      setDuplicateCheck({ checking: true, exists: false, message: '', payroll: null })
      
      try {
        const response = await payrollAPI.checkDuplicate({
          employee_id: formData.employee_id,
          payroll_period: formData.payroll_period,
        })
        
        const data = response.data
        
        if (data.exists) {
          setDuplicateCheck({
            checking: false,
            exists: true,
            message: data.message,
            payroll: data.payroll,
          })
        } else {
          setDuplicateCheck({
            checking: false,
            exists: false,
            message: data.message,
            payroll: null,
          })
        }
      } catch (error) {
        console.error('Error checking duplicate:', error)
        setDuplicateCheck({ checking: false, exists: false, message: '', payroll: null })
      }
    }

    checkDuplicate()
  }, [formData.employee_id, formData.payroll_period])
  
  // Fetch attendance data when payroll period or employee changes
  useEffect(() => {
    if (formData.employee_id && formData.payroll_period && !duplicateCheck.exists) {
      fetchAttendanceData(formData.employee_id, formData.payroll_period)
    }
  }, [formData.employee_id, formData.payroll_period, duplicateCheck.exists, fetchAttendanceData])

  // Auto-calculate all computed values when relevant fields change
  useEffect(() => {
    const baseSalary = parseFloat(formData.base_salary) || 0
    
    if (baseSalary > 0) {
      // Calculate government deductions
      const sss = baseSalary * 0.045
      const philhealth = baseSalary * 0.0225
      const pagibig = Math.min(baseSalary * 0.02, 100)
      const withholdingTax = baseSalary * 0.05
      
      // Calculate overtime pay
      const overtimeHours = parseFloat(formData.overtime_hours) || 0
      const overtimeRate = parseFloat(formData.overtime_rate) || 1.25
      const dailyRate = baseSalary / 22
      const hourlyRate = dailyRate / 8
      const overtimePay = overtimeHours > 0 ? hourlyRate * overtimeRate * overtimeHours : 0
      
      // Calculate holiday pay
      const holidayDays = parseFloat(formData.holiday_days) || 0
      const multiplier = formData.holiday_type === 'special' ? 1.3 : 2
      const holidayPay = holidayDays > 0 ? dailyRate * multiplier * holidayDays : 0
      
      // Calculate late deduction
      const lateMinutes = parseFloat(formData.late_minutes) || 0
      const perMinuteRate = hourlyRate / 60
      const lateDeduction = lateMinutes > 0 ? perMinuteRate * lateMinutes : 0
      
      // Calculate absent deduction
      const absentDays = parseFloat(formData.absent_days) || 0
      const absentDeduction = absentDays > 0 ? dailyRate * absentDays : 0
      
      setFormData(prev => ({
        ...prev,
        sss: sss.toFixed(2),
        philhealth: philhealth.toFixed(2),
        pagibig: pagibig.toFixed(2),
        withholding_tax: withholdingTax.toFixed(2),
        overtime_pay: overtimePay.toFixed(2),
        holiday_pay: holidayPay.toFixed(2),
        late_deduction: lateDeduction.toFixed(2),
        absent_deduction: absentDeduction.toFixed(2),
      }))
    } else {
      // Reset all calculations if no base salary
      setFormData(prev => ({
        ...prev,
        sss: '0',
        philhealth: '0',
        pagibig: '0',
        withholding_tax: '0',
        overtime_pay: '0',
        holiday_pay: '0',
        late_deduction: '0',
        absent_deduction: '0',
      }))
    }
  }, [
    formData.base_salary,
    formData.overtime_hours,
    formData.overtime_rate,
    formData.holiday_days,
    formData.holiday_type,
    formData.late_minutes,
    formData.absent_days
  ])

  const handleChange = (e) => {
    const { name, value } = e.target
    // Update only the changed field, calculations will happen in useEffect
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.employee_id) newErrors.employee_id = 'Employee is required'
    if (!formData.payroll_period) newErrors.payroll_period = 'Payroll period is required'
    if (!formData.pay_date) newErrors.pay_date = 'Pay date is required'
    if (!formData.base_salary || parseFloat(formData.base_salary) <= 0) {
      newErrors.base_salary = 'Base salary must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    // Convert all numeric fields to numbers
    const payload = {
      ...formData,
      base_salary: parseFloat(formData.base_salary) || 0,
      overtime_pay: parseFloat(formData.overtime_pay) || 0,
      holiday_pay: parseFloat(formData.holiday_pay) || 0,
      allowance: parseFloat(formData.allowance) || 0,
      bonus: parseFloat(formData.bonus) || 0,
      philhealth: parseFloat(formData.philhealth) || 0,
      sss: parseFloat(formData.sss) || 0,
      pagibig: parseFloat(formData.pagibig) || 0,
      withholding_tax: parseFloat(formData.withholding_tax) || 0,
    }

    onSubmit(payload)
  }

  const displayErrors = { ...errors, ...serverErrors }

  const calculateTotalEarnings = () => {
    return (
      parseFloat(formData.base_salary || 0) +
      parseFloat(formData.overtime_pay || 0) +
      parseFloat(formData.holiday_pay || 0) +
      parseFloat(formData.allowance || 0) +
      parseFloat(formData.bonus || 0)
    ).toFixed(2)
  }

  const calculateTotalDeductions = () => {
    return (
      parseFloat(formData.philhealth || 0) +
      parseFloat(formData.sss || 0) +
      parseFloat(formData.pagibig || 0) +
      parseFloat(formData.withholding_tax || 0) +
      parseFloat(formData.late_deduction || 0) +
      parseFloat(formData.absent_deduction || 0)
    ).toFixed(2)
  }

  const calculateNetPay = () => {
    return (
      parseFloat(calculateTotalEarnings()) - parseFloat(calculateTotalDeductions())
    ).toFixed(2)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Employee and Period Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee <span className="text-red-500">*</span>
            </label>
            <select
              name="employee_id"
              value={formData.employee_id}
              onChange={handleChange}
              disabled={fetchingData}
              className={`w-full border rounded px-3 py-2 ${displayErrors.employee_id ? 'border-red-500' : ''} ${fetchingData ? 'opacity-50' : ''}`}
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.user ? `${emp.user.first_name} ${emp.user.last_name}` : `Emp #${emp.employee_number}`}
                </option>
              ))}
            </select>
            {fetchingData && (
              <p className="text-blue-600 text-xs mt-1">Loading employee data...</p>
            )}
            {displayErrors.employee_id && (
              <p className="text-red-500 text-xs mt-1">{displayErrors.employee_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payroll Period <span className="text-red-500">*</span>
            </label>
            <input
              type="month"
              name="payroll_period"
              value={formData.payroll_period}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 ${displayErrors.payroll_period ? 'border-red-500' : ''}`}
            />
            {displayErrors.payroll_period && (
              <p className="text-red-500 text-xs mt-1">{displayErrors.payroll_period}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pay Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="pay_date"
              value={formData.pay_date}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 ${displayErrors.pay_date ? 'border-red-500' : ''}`}
            />
            {displayErrors.pay_date && (
              <p className="text-red-500 text-xs mt-1">{displayErrors.pay_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Salary <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              name="base_salary"
              value={formData.base_salary}
              onChange={handleChange}
              placeholder="0.00"
              className={`w-full border rounded px-3 py-2 ${displayErrors.base_salary ? 'border-red-500' : ''}`}
            />
            {displayErrors.base_salary && (
              <p className="text-red-500 text-xs mt-1">{displayErrors.base_salary}</p>
            )}
          </div>
        </div>
      </div>

      {/* Earnings Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-green-700 border-b pb-2">Additional Earnings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Overtime Inputs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Overtime Hours (From Attendance)</label>
            <input
              type="number"
              step="0.01"
              name="overtime_hours"
              value={formData.overtime_hours}
              readOnly
              placeholder="0"
              className="w-full border rounded px-3 py-2 bg-gray-50 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Overtime Rate Multiplier</label>
            <input
              type="number"
              step="0.01"
              name="overtime_rate"
              value={formData.overtime_rate}
              onChange={handleChange}
              placeholder="1.25"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Overtime Pay (Auto-calculated)</label>
            <input
              type="number"
              step="0.01"
              name="overtime_pay"
              value={formData.overtime_pay}
              readOnly
              placeholder="0.00"
              className="w-full border rounded px-3 py-2 bg-gray-50 cursor-not-allowed"
            />
          </div>

          {/* Holiday Inputs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Type</label>
            <select
              name="holiday_type"
              value={formData.holiday_type}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">None</option>
              <option value="regular">Regular Holiday (2x)</option>
              <option value="special">Special Non-Working (1.3x)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Days (From Attendance)</label>
            <input
              type="number"
              step="0.01"
              name="holiday_days"
              value={formData.holiday_days}
              readOnly
              placeholder="0"
              className="w-full border rounded px-3 py-2 bg-gray-50 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Pay (Auto-calculated)</label>
            <input
              type="number"
              step="0.01"
              name="holiday_pay"
              value={formData.holiday_pay}
              readOnly
              placeholder="0.00"
              className="w-full border rounded px-3 py-2 bg-gray-50 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allowance</label>
            <input
              type="number"
              step="0.01"
              name="allowance"
              value={formData.allowance}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bonus</label>
            <input
              type="number"
              step="0.01"
              name="bonus"
              value={formData.bonus}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          
          {/* Attendance-based fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Late Minutes (From Attendance)</label>
            <input
              type="number"
              step="0.01"
              name="late_minutes"
              value={formData.late_minutes}
              readOnly
              placeholder="0"
              className="w-full border rounded px-3 py-2 bg-gray-50 cursor-not-allowed"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Absent Days (From Attendance)</label>
            <input
              type="number"
              step="0.01"
              name="absent_days"
              value={formData.absent_days}
              readOnly
              placeholder="0"
              className="w-full border rounded px-3 py-2 bg-gray-50 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Deductions Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-red-700 border-b pb-2">Deductions (Auto-calculated)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SSS Contribution
              {formData.base_salary && (
                <span className="text-xs text-blue-600 ml-1">
                  (₱{parseFloat(formData.base_salary).toLocaleString()} salary bracket)
                </span>
              )}
            </label>
            <input
              type="number"
              step="0.01"
              name="sss"
              value={formData.sss}
              readOnly
              placeholder="0.00"
              className="w-full border rounded px-3 py-2 bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Employee Share: 4.5% of basic salary</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PhilHealth Contribution
              {formData.base_salary && (
                <span className="text-xs text-green-600 ml-1">
                  (₱{parseFloat(formData.base_salary).toLocaleString()} salary bracket)
                </span>
              )}
            </label>
            <input
              type="number"
              step="0.01"
              name="philhealth"
              value={formData.philhealth}
              readOnly
              placeholder="0.00"
              className="w-full border rounded px-3 py-2 bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Employee Share: 2.25% of basic salary (Min: ₱500, Max: ₱5,000)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pag-IBIG Contribution
              {formData.pagibig && parseFloat(formData.pagibig) >= 100 && (
                <span className="text-xs text-orange-600 ml-1">
                  (Maximum reached)
                </span>
              )}
            </label>
            <input
              type="number"
              step="0.01"
              name="pagibig"
              value={formData.pagibig}
              readOnly
              placeholder="0.00"
              className="w-full border rounded px-3 py-2 bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">2% of basic salary (Maximum: ₱100)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Withholding Tax
              {formData.base_salary && (() => {
                const salary = parseFloat(formData.base_salary)
                if (salary <= 20833) return <span className="text-xs text-gray-600 ml-1">(Tax Bracket: 0%)</span>
                if (salary <= 33332) return <span className="text-xs text-purple-600 ml-1">(Tax Bracket: 15%)</span>
                if (salary <= 66666) return <span className="text-xs text-purple-600 ml-1">(Tax Bracket: 20%)</span>
                if (salary <= 166666) return <span className="text-xs text-purple-600 ml-1">(Tax Bracket: 25%)</span>
                if (salary <= 666666) return <span className="text-xs text-purple-600 ml-1">(Tax Bracket: 30%)</span>
                return <span className="text-xs text-purple-600 ml-1">(Tax Bracket: 35%)</span>
              })()}
            </label>
            <input
              type="number"
              step="0.01"
              name="withholding_tax"
              value={formData.withholding_tax}
              readOnly
              placeholder="0.00"
              className="w-full border rounded px-3 py-2 bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Based on graduated tax table</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Late Deduction (Auto)</label>
            <input
              type="number"
              step="0.01"
              name="late_deduction"
              value={formData.late_deduction}
              readOnly
              placeholder="0.00"
              className="w-full border rounded px-3 py-2 bg-gray-50 cursor-not-allowed"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Absent Deduction (Auto)</label>
            <input
              type="number"
              step="0.01"
              name="absent_deduction"
              value={formData.absent_deduction}
              readOnly
              placeholder="0.00"
              className="w-full border rounded px-3 py-2 bg-gray-50 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Payroll Summary</h3>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Earnings:</span>
          <span className="text-lg font-semibold text-green-700">₱{parseFloat(calculateTotalEarnings()).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Deductions:</span>
          <span className="text-lg font-semibold text-red-700">₱{parseFloat(calculateTotalDeductions()).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-gray-800">Net Pay:</span>
            <span className="text-2xl font-bold text-primary-700">₱{parseFloat(calculateNetPay()).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Duplicate Warning */}
      {duplicateCheck.checking && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm">Checking for existing payroll...</p>
        </div>
      )}
      
      {duplicateCheck.exists && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h4 className="text-yellow-800 font-semibold mb-1">Duplicate Payroll Detected</h4>
              <p className="text-yellow-700 text-sm mb-2">{duplicateCheck.message}</p>
              {duplicateCheck.payroll && (
                <div className="text-xs text-yellow-600 space-y-1">
                  <p><strong>Status:</strong> {duplicateCheck.payroll.status}</p>
                  <p><strong>Pay Date:</strong> {new Date(duplicateCheck.payroll.pay_date).toLocaleDateString()}</p>
                  <p><strong>Net Pay:</strong> ₱{parseFloat(duplicateCheck.payroll.net_pay).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  <p><strong>Locked:</strong> {duplicateCheck.payroll.is_locked ? 'Yes' : 'No'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || duplicateCheck.exists || duplicateCheck.checking}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title={duplicateCheck.exists ? 'Payroll already exists for this employee and period' : ''}
        >
          {loading ? 'Processing...' : 'Process Payslip'}
        </button>
      </div>
    </form>
  )
}
