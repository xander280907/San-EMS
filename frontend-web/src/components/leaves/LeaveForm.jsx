import { useEffect, useState } from 'react'

export default function LeaveForm({
  leaveTypes = [],
  onSubmit,
  onCancel,
  loading = false,
  serverErrors = null,
  remainingDays = null,
  annualLimit = null,
}) {
  const [form, setForm] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: '',
  })
  
  const [requestedDays, setRequestedDays] = useState(0)
  const [validationError, setValidationError] = useState('')

  const calculateDays = (start, end) => {
    if (!start || !end) return 0
    const startDate = new Date(start)
    const endDate = new Date(end)
    if (endDate < startDate) return 0
    
    // Calculate difference in days (inclusive)
    const diffTime = Math.abs(endDate - startDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const newForm = { ...form, [name]: value }
    setForm(newForm)
    
    // Recalculate days if dates change
    if (name === 'start_date' || name === 'end_date') {
      const days = calculateDays(newForm.start_date, newForm.end_date)
      setRequestedDays(days)
      
      // Validate against remaining days
      if (remainingDays !== null && days > remainingDays) {
        setValidationError(`You are requesting ${days} days but only have ${remainingDays} days remaining. Please reduce your request or it will be automatically rejected.`)
      } else if (days > 0 && newForm.end_date && new Date(newForm.end_date) < new Date(newForm.start_date)) {
        setValidationError('End date must be on or after start date.')
      } else {
        setValidationError('')
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Final validation before submit
    if (remainingDays !== null && requestedDays > remainingDays) {
      setValidationError(`Cannot submit: You are requesting ${requestedDays} days but only have ${remainingDays} days remaining.`)
      return
    }
    
    if (form.end_date && new Date(form.end_date) < new Date(form.start_date)) {
      setValidationError('End date must be on or after start date.')
      return
    }
    
    onSubmit({ ...form })
  }

  const renderError = (field) => {
    if (!serverErrors) return null
    const err = serverErrors?.[field]
    if (!err) return null
    const message = Array.isArray(err) ? err.join(', ') : String(err)
    return <p className="text-sm text-red-600 mt-1">{message}</p>
  }

  const exceedsLimit = remainingDays !== null && requestedDays > remainingDays

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Leave Balance Warning */}
      {remainingDays !== null && annualLimit !== null && (
        <div className={`p-4 rounded-lg border ${
          remainingDays === 0 
            ? 'bg-red-50 border-red-300 text-red-800'
            : remainingDays <= 3
            ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
            : 'bg-blue-50 border-blue-300 text-blue-800'
        }`}>
          <div className="flex items-start gap-2">
            <div className="font-semibold">Annual Leave Balance:</div>
            <div className="flex-1">
              <div className="font-bold">{remainingDays} of {annualLimit} days remaining</div>
              {remainingDays === 0 && (
                <p className="text-sm mt-1">⚠️ You have used all your annual leave. New requests will be rejected.</p>
              )}
              {remainingDays > 0 && remainingDays <= 3 && (
                <p className="text-sm mt-1">⚠️ Low balance - use your remaining days wisely.</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Validation Error */}
      {validationError && (
        <div className="p-4 rounded-lg border bg-red-50 border-red-300">
          <p className="text-red-800 font-semibold">{validationError}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Leave Type</label>
          <select name="leave_type_id" value={form.leave_type_id} onChange={handleChange} required className="mt-1 w-full border rounded px-3 py-2">
            <option value="">Select type</option>
            {leaveTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name || t.title || `Type #${t.id}`}</option>
            ))}
          </select>
          {renderError('leave_type_id')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input 
            type="date" 
            name="start_date" 
            value={form.start_date} 
            onChange={handleChange} 
            required 
            min={new Date().toISOString().split('T')[0]}
            className="mt-1 w-full border rounded px-3 py-2" 
          />
          {renderError('start_date')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input 
            type="date" 
            name="end_date" 
            value={form.end_date} 
            onChange={handleChange} 
            required 
            min={form.start_date || new Date().toISOString().split('T')[0]}
            className="mt-1 w-full border rounded px-3 py-2" 
          />
          {renderError('end_date')}
          {requestedDays > 0 && (
            <p className={`text-sm mt-1 font-medium ${
              exceedsLimit ? 'text-red-600' : 'text-blue-600'
            }`}>
              Requesting {requestedDays} day{requestedDays !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Reason</label>
          <textarea name="reason" value={form.reason} onChange={handleChange} required rows={3} className="mt-1 w-full border rounded px-3 py-2" />
          {renderError('reason')}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} disabled={loading} className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50">Cancel</button>
        <button 
          type="submit" 
          disabled={loading || exceedsLimit || (remainingDays === 0)} 
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title={exceedsLimit ? 'Request exceeds available leave balance' : remainingDays === 0 ? 'No leave days remaining' : ''}
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </form>
  )
}


