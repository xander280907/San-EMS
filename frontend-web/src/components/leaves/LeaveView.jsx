export default function LeaveView({ leave, leaveTypes = [] }) {
  if (!leave) return null

  const Row = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 py-2 border-b">
      <div className="text-sm font-medium text-gray-600">{label}</div>
      <div className="col-span-2 text-sm text-gray-900">{value || '-'}</div>
    </div>
  )

  const employeeName = leave.employee?.user
    ? `${leave.employee.user.first_name} ${leave.employee.user.last_name}`
    : (leave.employee?.name || `Employee #${leave.employee_id}`)

  const approverName = leave.approver
    ? `${leave.approver.first_name || ''} ${leave.approver.last_name || ''}`.trim()
    : null

  const typeName = leave.leaveType?.name || (leaveTypes.find(t => String(t.id) === String(leave.leave_type_id))?.name) || `#${leave.leave_type_id ?? ''}`

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Leave Details</h3>
        <div className="bg-gray-50 rounded p-4">
          <Row label="Employee" value={employeeName} />
          <Row label="Type" value={typeName} />
          <Row label="Start Date" value={leave.start_date} />
          <Row label="End Date" value={leave.end_date} />
          <Row label="Days" value={leave.days_count} />
          <Row label="Reason" value={leave.reason} />
          <Row label="Status" value={leave.status} />
          {approverName && <Row label="Approver" value={approverName} />}
        </div>
      </section>
    </div>
  )
}


