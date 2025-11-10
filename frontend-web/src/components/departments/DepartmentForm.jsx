import { useEffect, useMemo, useState } from 'react'
import { departmentAPI } from '../../services/api'
import PositionManager from './PositionManager'

export default function DepartmentForm({
  initialData = null,
  employees = [],
  onSubmit,
  onCancel,
  loading = false,
  serverErrors = null,
}) {
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    manager_id: '',
    positions: '',
  })
  const [generatingCode, setGeneratingCode] = useState(false)

  const isEdit = useMemo(() => Boolean(initialData?.id), [initialData])

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        code: initialData.code || '',
        description: initialData.description || '',
        manager_id: initialData.manager_id || initialData.manager?.id || '',
        positions: initialData.positions || '',
      })
    } else {
      // Auto-generate code for new departments
      generateNextCode()
    }
  }, [initialData])

  const generateNextCode = async () => {
    setGeneratingCode(true)
    try {
      // Fetch ALL existing departments to analyze their codes
      const res = await departmentAPI.getAll({ per_page: 10000 })
      const data = res.data?.data || res.data || []
      const departments = Array.isArray(data) ? data : []
      
      console.log(`Found ${departments.length} existing departments`)
      
      // Extract all department codes
      const existingCodes = departments
        .map(dept => dept.code)
        .filter(code => code) // Remove null/undefined codes
      
      console.log('Existing codes:', existingCodes)
      
      // Filter only numeric codes that match 3-digit pattern
      const numericCodes = existingCodes
        .filter(code => /^\d+$/.test(code)) // Any numeric code
        .map(code => parseInt(code, 10))
        .filter(num => !isNaN(num)) // Remove any NaN values
      
      console.log('Numeric codes found:', numericCodes)
      
      // Find the highest code number
      const maxCode = numericCodes.length > 0 ? Math.max(...numericCodes) : 0
      
      // Generate next code (max + 1), ensure it's 3 digits with leading zeros
      const nextCodeNumber = maxCode + 1
      const nextCode = nextCodeNumber.toString().padStart(3, '0')
      
      console.log(`Generated next code: ${nextCode} (based on max: ${maxCode})`)
      
      setForm(prev => ({ ...prev, code: nextCode }))
    } catch (e) {
      console.error('Error generating department code:', e)
      // If error, start from 001
      setForm(prev => ({ ...prev, code: '001' }))
    } finally {
      setGeneratingCode(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form }
    if (!payload.manager_id) payload.manager_id = null
    onSubmit(payload)
  }

  const renderError = (field) => {
    if (!serverErrors) return null
    const err = serverErrors?.[field]
    if (!err) return null
    const message = Array.isArray(err) ? err.join(', ') : String(err)
    return <p className="text-sm text-red-600 mt-1">{message}</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input name="name" value={form.name} onChange={handleChange} required className="mt-1 w-full border rounded px-3 py-2" />
          {renderError('name')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Code</label>
          <div className="flex gap-2">
            <input 
              name="code" 
              value={generatingCode ? 'Generating...' : form.code} 
              readOnly 
              disabled={generatingCode}
              className="mt-1 flex-1 border rounded px-3 py-2 bg-gray-50 cursor-not-allowed" 
              placeholder="Auto-generated"
            />
            <button
              type="button"
              onClick={generateNextCode}
              disabled={generatingCode || loading}
              className="mt-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {generatingCode ? 'Generating...' : 'Regenerate'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isEdit ? 'Click "Regenerate" to generate a new 3-digit code' : 'Code is auto-generated (3 digits)'}
          </p>
          {renderError('code')}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Number of Positions</label>
          <input 
            type="number" 
            name="positions" 
            value={form.positions} 
            onChange={handleChange} 
            min="0"
            placeholder="e.g., 10"
            className="mt-1 w-full border rounded px-3 py-2" 
          />
          <p className="text-xs text-gray-500 mt-1">Total positions available in this department</p>
          {renderError('positions')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Manager</label>
          <select name="manager_id" value={form.manager_id ?? ''} onChange={handleChange} className="mt-1 w-full border rounded px-3 py-2">
            <option value="">None</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.user ? `${e.user.first_name} ${e.user.last_name}` : `Employee #${e.employee_number}`}
              </option>
            ))}
          </select>
          {renderError('manager_id')}
        </div>
      </div>

      {/* Position Management Section */}
      <div className="border-t pt-4 mt-2">
        <PositionManager 
          departmentId={initialData?.id} 
          readOnly={false}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} disabled={loading} className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50">
          {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Department')}
        </button>
      </div>
    </form>
  )
}


