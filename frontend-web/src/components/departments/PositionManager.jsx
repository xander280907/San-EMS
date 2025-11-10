import { useState, useEffect } from 'react'
import { positionAPI } from '../../services/api'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'

export default function PositionManager({ departmentId, readOnly = false }) {
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    min_salary: '',
    max_salary: '',
    available_slots: 1,
    status: 'active',
  })

  useEffect(() => {
    if (departmentId) {
      fetchPositions()
    }
  }, [departmentId])

  const fetchPositions = async () => {
    if (!departmentId) return
    setLoading(true)
    try {
      const res = await positionAPI.getAll({ department_id: departmentId })
      setPositions(res.data || [])
    } catch (error) {
      console.error('Failed to fetch positions:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      min_salary: '',
      max_salary: '',
      available_slots: 1,
      status: 'active',
    })
    setEditingId(null)
    setShowAddForm(false)
  }

  const handleAdd = async () => {
    try {
      const payload = {
        ...formData,
        department_id: departmentId,
        min_salary: formData.min_salary ? parseFloat(formData.min_salary) : null,
        max_salary: formData.max_salary ? parseFloat(formData.max_salary) : null,
      }
      await positionAPI.create(payload)
      await fetchPositions()
      resetForm()
    } catch (error) {
      console.error('Failed to create position:', error)
      alert('Failed to create position')
    }
  }

  const handleEdit = (position) => {
    setFormData({
      title: position.title || '',
      description: position.description || '',
      min_salary: position.min_salary || '',
      max_salary: position.max_salary || '',
      available_slots: position.available_slots || 1,
      status: position.status || 'active',
    })
    setEditingId(position.id)
    setShowAddForm(false)
  }

  const handleUpdate = async () => {
    try {
      const payload = {
        ...formData,
        min_salary: formData.min_salary ? parseFloat(formData.min_salary) : null,
        max_salary: formData.max_salary ? parseFloat(formData.max_salary) : null,
      }
      await positionAPI.update(editingId, payload)
      await fetchPositions()
      resetForm()
    } catch (error) {
      console.error('Failed to update position:', error)
      alert('Failed to update position')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this position? This action cannot be undone.')) return
    try {
      await positionAPI.delete(id)
      await fetchPositions()
    } catch (error) {
      console.error('Failed to delete position:', error)
      alert('Failed to delete position')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!departmentId && !readOnly) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm text-yellow-800">
        <p className="font-medium">Save the department first</p>
        <p className="text-xs mt-1">You can add positions after creating the department.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Positions</h3>
        {!readOnly && departmentId && (
          <button
            type="button"
            onClick={() => { setShowAddForm(true); setEditingId(null); }}
            className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Position
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && !readOnly && (
        <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Position Title*</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Software Developer"
                className="mt-1 w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder="Job responsibilities and requirements..."
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Min Salary</label>
              <input
                type="number"
                name="min_salary"
                value={formData.min_salary}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Salary</label>
              <input
                type="number"
                name="max_salary"
                value={formData.max_salary}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Available Slots</label>
              <input
                type="number"
                name="available_slots"
                value={formData.available_slots}
                onChange={handleChange}
                min="0"
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={editingId ? handleUpdate : handleAdd}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Update' : 'Add'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border rounded hover:bg-gray-50 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Positions List */}
      {loading ? (
        <div className="text-center py-4 text-gray-600">Loading positions...</div>
      ) : positions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded border border-gray-200">
          <p className="text-sm">No positions added yet.</p>
          {!readOnly && departmentId && (
            <p className="text-xs mt-1">Click "Add Position" to create one.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {positions.map((position) => (
            <div
              key={position.id}
              className="bg-white border border-gray-200 rounded p-4 hover:border-gray-300 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{position.title}</h4>
                  {position.description && (
                    <p className="text-sm text-gray-600 mt-1">{position.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600">
                    {(position.min_salary || position.max_salary) && (
                      <span>
                        Salary: ₱{position.min_salary ? parseFloat(position.min_salary).toLocaleString() : '0'} - ₱
                        {position.max_salary ? parseFloat(position.max_salary).toLocaleString() : '0'}
                      </span>
                    )}
                    <span>Slots: {position.available_slots}</span>
                    <span className={`px-2 py-0.5 rounded ${position.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {position.status}
                    </span>
                  </div>
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(position)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(position.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
