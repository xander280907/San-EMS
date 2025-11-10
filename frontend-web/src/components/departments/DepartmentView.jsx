import { useEffect, useState } from 'react'
import { employeeAPI } from '../../services/api'
import { Users, Mail, Phone, Calendar } from 'lucide-react'
import PositionManager from './PositionManager'

export default function DepartmentView({ department }) {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (department?.id) {
      fetchEmployees()
    }
  }, [department?.id])

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const res = await employeeAPI.getAll({ department_id: department.id, per_page: 100 })
      const data = res.data?.data || res.data || []
      setEmployees(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to load employees:', e)
    } finally {
      setLoading(false)
    }
  }

  if (!department) return null
  const manager = department.manager || {}

  const Row = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 py-2 border-b">
      <div className="text-sm font-medium text-gray-600">{label}</div>
      <div className="col-span-2 text-sm text-gray-900">{value || '-'}</div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Department Details */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Department Information</h3>
        <div className="bg-gray-50 rounded p-4">
          <Row label="Name" value={department.name} />
          <Row label="Code" value={department.code} />
          <Row label="Description" value={department.description} />
          <Row label="Total Employees" value={department.employees_count || employees.length || 0} />
        </div>
      </section>

      {/* Manager Section */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Manager</h3>
        <div className="bg-gray-50 rounded p-4">
          {manager.user ? (
            <>
              <Row label="Name" value={`${manager.user.first_name} ${manager.user.last_name}`} />
              <Row label="Email" value={manager.user.email} />
              <Row label="Employee #" value={manager.employee_number} />
            </>
          ) : (
            <p className="text-sm text-gray-600">No manager assigned</p>
          )}
        </div>
      </section>

      {/* Positions Section */}
      <section>
        <PositionManager 
          departmentId={department.id} 
          readOnly={true}
        />
      </section>

      {/* Employees List */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Employees ({employees.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="bg-gray-50 rounded p-8 text-center text-gray-600">
            Loading employees...
          </div>
        ) : employees.length === 0 ? (
          <div className="bg-gray-50 rounded p-8 text-center text-gray-600">
            No employees in this department
          </div>
        ) : (
          <div className="bg-gray-50 rounded p-4 max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {employees.map((emp) => (
                <div 
                  key={emp.id} 
                  className="bg-white rounded p-3 border border-gray-200 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">
                        {emp.user ? `${emp.user.first_name} ${emp.user.last_name}` : `Employee #${emp.employee_number}`}
                      </h4>
                      <div className="mt-2 space-y-1 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          <span>{emp.user?.email || '-'}</span>
                        </div>
                        {emp.phone_number && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            <span>{emp.phone_number}</span>
                          </div>
                        )}
                        {emp.hire_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>Hired: {new Date(emp.hire_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {emp.position || 'No Position'}
                      </span>
                      {emp.id === manager?.id && (
                        <span className="block mt-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                          Manager
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}


