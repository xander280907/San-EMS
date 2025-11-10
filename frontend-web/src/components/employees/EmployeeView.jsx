export default function EmployeeView({ employee }) {
  if (!employee) return null
  const user = employee.user || {}
  const dept = employee.department || {}

  const Row = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 py-2 border-b">
      <div className="text-sm font-medium text-gray-600">{label}</div>
      <div className="col-span-2 text-sm text-gray-900">{value || '-'}</div>
    </div>
  )

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Account</h3>
        <div className="bg-gray-50 rounded p-4">
          <Row label="Email" value={user.email} />
          <Row label="Name" value={`${user.first_name || ''} ${user.last_name || ''}`} />
          <Row label="Phone" value={user.phone} />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Employment</h3>
        <div className="bg-gray-50 rounded p-4">
          <Row label="Employee #" value={employee.employee_number} />
          <Row label="Department" value={dept.name} />
          <Row label="Position" value={employee.position} />
          <Row label="Employment Type" value={employee.employment_type} />
          <Row label="Hire Date" value={employee.hire_date} />
          <Row label="Status" value={employee.status} />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Compensation</h3>
        <div className="bg-gray-50 rounded p-4">
          <Row label="Base Salary" value={employee.base_salary} />
          <Row label="Allowance" value={employee.allowance} />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Government IDs</h3>
        <div className="bg-gray-50 rounded p-4">
          <Row label="SSS" value={employee.sss_number} />
          <Row label="PhilHealth" value={employee.philhealth_number} />
          <Row label="Pag-IBIG" value={employee.pagibig_number} />
          <Row label="TIN" value={employee.tin_number} />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Personal</h3>
        <div className="bg-gray-50 rounded p-4">
          <Row label="Gender" value={employee.gender} />
          <Row label="Birth Date" value={employee.birth_date} />
          <Row label="Marital Status" value={employee.marital_status} />
          <Row label="Address" value={employee.address} />
        </div>
      </section>
    </div>
  )
}


