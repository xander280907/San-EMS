import { useEffect, useMemo, useState } from 'react'
import { departmentAPI, employeeAPI } from '../services/api'
import DepartmentForm from '../components/departments/DepartmentForm'
import DepartmentView from '../components/departments/DepartmentView'
import { ToastContainer } from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { Building, Users, UserCheck, AlertTriangle, ArrowUpDown, Search } from 'lucide-react'

export default function Departments() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [managerFilter, setManagerFilter] = useState('')
  const [departmentNameFilter, setDepartmentNameFilter] = useState('')
  const [allDepartments, setAllDepartments] = useState([])
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [stats, setStats] = useState({
    totalDepartments: 0,
    totalEmployees: 0,
    withoutManager: 0,
    avgEmployeesPerDept: 0,
  })

  const toast = useToast()

  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(null)
  const [showView, setShowView] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [serverErrors, setServerErrors] = useState(null)

  const totalPages = useMemo(() => {
    if (!total || !perPage) return 1
    return Math.max(1, Math.ceil(total / perPage))
  }, [total, perPage])

  useEffect(() => {
    fetchEmployees()
    fetchAllDepartmentsForFilter()
  }, [])

  useEffect(() => {
    fetchDepartments()
  }, [page, search, managerFilter, departmentNameFilter])

  const fetchEmployees = async () => {
    try {
      const res = await employeeAPI.getAll({ per_page: 100 })
      const data = res.data?.data || res.data || []
      setEmployees(Array.isArray(data) ? data : [])
    } catch (e) {
      // ignore; manager select will be empty
    }
  }

  const fetchAllDepartmentsForFilter = async () => {
    try {
      const res = await departmentAPI.getAll({ per_page: 1000 })
      const data = res.data?.data || res.data || []
      setAllDepartments(Array.isArray(data) ? data : [])
    } catch (e) {
      // ignore; department filter will be empty
    }
  }

  const fetchDepartments = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, per_page: perPage }
      if (search) params.search = search
      if (managerFilter) params.has_manager = managerFilter
      const res = await departmentAPI.getAll(params)
      const raw = res.data
      const data = raw?.data || raw || []
      let departments = Array.isArray(data) ? data : []
      
      // Client-side filtering by department name
      if (departmentNameFilter) {
        departments = departments.filter(dept => 
          dept.name?.toLowerCase().includes(departmentNameFilter.toLowerCase())
        )
      }
      
      // Calculate statistics
      const totalEmployees = departments.reduce((sum, dept) => sum + (dept.employees_count || 0), 0)
      const withoutManager = departments.filter(dept => !dept.manager_id).length
      const avgEmployees = departments.length > 0 ? (totalEmployees / departments.length).toFixed(1) : 0
      
      setStats({
        totalDepartments: raw?.total || departments.length,
        totalEmployees,
        withoutManager,
        avgEmployeesPerDept: avgEmployees,
      })
      
      setItems(departments)
      const count = raw?.total
      setTotal(typeof count === 'number' ? count : departments.length)
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to load departments')
      toast.error('Failed to load departments')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this departmen? This action cannot be undone.')) return
    setActionLoading(true)
    try {
      await departmentAPI.delete(id)
      toast.success('Department deleted successfully')
      await fetchDepartments()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to delete department')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreate = async (payload) => {
    setServerErrors(null)
    setActionLoading(true)
    try {
      await departmentAPI.create(payload)
      setShowCreate(false)
      toast.success('Department created successfully')
      await fetchDepartments()
    } catch (e) {
      const errors = e.response?.data?.error
      if (errors) setServerErrors(errors)
      else toast.error(e.message || 'Failed to create department')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = async (payload) => {
    if (!showEdit?.id) return
    setServerErrors(null)
    setActionLoading(true)
    try {
      await departmentAPI.update(showEdit.id, payload)
      setShowEdit(null)
      toast.success('Department updated successfully')
      await fetchDepartments()
    } catch (e) {
      const errors = e.response?.data?.error
      if (errors) setServerErrors(errors)
      else toast.error(e.message || 'Failed to update department')
    } finally {
      setActionLoading(false)
    }
  }

  // Sorting
  const sortedItems = useMemo(() => {
    const sorted = [...items]
    sorted.sort((a, b) => {
      let aVal, bVal
      
      switch (sortBy) {
        case 'name':
          aVal = a.name?.toLowerCase() || ''
          bVal = b.name?.toLowerCase() || ''
          break
        case 'code':
          aVal = a.code?.toLowerCase() || ''
          bVal = b.code?.toLowerCase() || ''
          break
        case 'employees':
          aVal = a.employees_count || 0
          bVal = b.employees_count || 0
          break
        case 'manager':
          aVal = a.manager?.user ? `${a.manager.user.first_name} ${a.manager.user.last_name}` : ''
          bVal = b.manager?.user ? `${b.manager.user.first_name} ${b.manager.user.last_name}` : ''
          break
        default:
          return 0
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [items, sortBy, sortOrder])

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const SortHeader = ({ field, label }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortBy === field && (
          <ArrowUpDown className={`w-3 h-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
        )}
      </div>
    </th>
  )

  const Pagination = () => (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
      <div className="flex items-center gap-2">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  )

  const Modal = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Departments</h1>
        <button onClick={() => { setShowCreate(true); setServerErrors(null) }} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
          New Department
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Departments</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalDepartments}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalEmployees}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Employees/Dept</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.avgEmployeesPerDept}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Without Manager</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.withoutManager}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              placeholder="Search name or code..." 
              value={search} 
              onChange={(e) => { setPage(1); setSearch(e.target.value) }} 
              onKeyPress={(e) => e.key === 'Enter' && fetchDepartments()}
              className="w-full pl-10 pr-3 py-2 border rounded" 
            />
          </div>
          <select 
            value={departmentNameFilter} 
            onChange={(e) => { setPage(1); setDepartmentNameFilter(e.target.value) }}
            className="border rounded px-3 py-2"
          >
            <option value="">All Department Names</option>
            {allDepartments.map((dept) => (
              <option key={dept.id} value={dept.name}>{dept.name}</option>
            ))}
          </select>
          <select 
            value={managerFilter} 
            onChange={(e) => { setPage(1); setManagerFilter(e.target.value) }}
            className="border rounded px-3 py-2"
          >
            <option value="">Manager Status</option>
            <option value="1">With Manager</option>
            <option value="0">Without Manager</option>
          </select>
        </div>
        <div className="mt-3">
          <button 
            onClick={() => { 
              setSearch(''); 
              setManagerFilter('');
              setDepartmentNameFilter('');
              setPage(1);
            }} 
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200 text-red-700">{error}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <SortHeader field="code" label="Code" />
                <SortHeader field="name" label="Name" />
                <SortHeader field="employees" label="Employees" />
                <SortHeader field="manager" label="Manager" />
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-gray-600">Loading...</td>
                </tr>
              ) : sortedItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-gray-600">No departments found.</td>
                </tr>
              ) : (
                sortedItems.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{dept.code || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{dept.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {dept.employees_count || 0} employees
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{dept.manager?.user ? `${dept.manager.user.first_name} ${dept.manager.user.last_name}` : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{dept.description || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="px-3 py-1 border rounded hover:bg-gray-50" onClick={() => setShowView(dept)}>View</button>
                        <button className="px-3 py-1 border rounded hover:bg-gray-50" onClick={() => { setShowEdit(dept); setServerErrors(null) }}>Edit</button>
                        <button className="px-3 py-1 border rounded hover:bg-red-50 text-red-700" disabled={actionLoading} onClick={() => handleDelete(dept.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t">
          <Pagination />
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Create Department" onClose={() => setShowCreate(false)}>
          <DepartmentForm
            initialData={null}
            employees={employees}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            loading={actionLoading}
            serverErrors={serverErrors}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <Modal title="Edit Department" onClose={() => setShowEdit(null)}>
          <DepartmentForm
            initialData={showEdit}
            employees={employees}
            onSubmit={handleEdit}
            onCancel={() => setShowEdit(null)}
            loading={actionLoading}
            serverErrors={serverErrors}
          />
        </Modal>
      )}

      {/* View Modal */}
      {showView && (
        <Modal title="Department Details" onClose={() => setShowView(null)}>
          <DepartmentView department={showView} />
        </Modal>
      )}
    </div>
  )
}

