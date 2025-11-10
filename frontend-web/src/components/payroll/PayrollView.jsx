import { DollarSign, User, Calendar, CreditCard, TrendingUp, TrendingDown, Wallet } from 'lucide-react'

export default function PayrollView({ payroll }) {
  const formatCurrency = (amount) => {
    if (!amount) return '₱0.00'
    return `₱${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'processed': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'paid': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-primary-700" />
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {payroll.employee?.user 
                  ? `${payroll.employee.user.first_name} ${payroll.employee.user.last_name}`
                  : `Employee #${payroll.employee?.employee_number || payroll.employee_id}`}
              </h3>
              <p className="text-sm text-gray-600">
                {payroll.employee?.position || 'N/A'} • {payroll.employee?.department?.name || 'N/A'}
              </p>
            </div>
          </div>
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded ${getStatusColor(payroll.status)}`}>
            {payroll.status || 'draft'}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700">
              <strong>Period:</strong> {payroll.payroll_period || '-'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700">
              <strong>Pay Date:</strong> {formatDate(payroll.pay_date)}
            </span>
          </div>
        </div>
      </div>

      {/* Earnings Section */}
      <div className="bg-green-50 p-5 rounded-lg border border-green-200">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-700" />
          <h4 className="text-lg font-semibold text-green-800">Earnings</h4>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-2">
            <span className="text-sm text-gray-700">Base Salary</span>
            <span className="font-semibold text-gray-900">{formatCurrency(payroll.base_salary)}</span>
          </div>
          
          {parseFloat(payroll.overtime_pay || 0) > 0 && (
            <div className="flex justify-between items-center pb-2 border-t pt-2">
              <span className="text-sm text-gray-700">Overtime Pay</span>
              <span className="font-semibold text-gray-900">{formatCurrency(payroll.overtime_pay)}</span>
            </div>
          )}
          
          {parseFloat(payroll.holiday_pay || 0) > 0 && (
            <div className="flex justify-between items-center pb-2 border-t pt-2">
              <span className="text-sm text-gray-700">Holiday Pay</span>
              <span className="font-semibold text-gray-900">{formatCurrency(payroll.holiday_pay)}</span>
            </div>
          )}
          
          {parseFloat(payroll.allowance || 0) > 0 && (
            <div className="flex justify-between items-center pb-2 border-t pt-2">
              <span className="text-sm text-gray-700">Allowance</span>
              <span className="font-semibold text-gray-900">{formatCurrency(payroll.allowance)}</span>
            </div>
          )}
          
          {parseFloat(payroll.bonus || 0) > 0 && (
            <div className="flex justify-between items-center pb-2 border-t pt-2">
              <span className="text-sm text-gray-700">Bonus</span>
              <span className="font-semibold text-gray-900">{formatCurrency(payroll.bonus)}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-3 border-t-2 border-green-300">
            <span className="font-semibold text-green-800">Total Earnings</span>
            <span className="text-lg font-bold text-green-700">{formatCurrency(payroll.total_earnings)}</span>
          </div>
        </div>
      </div>

      {/* Deductions Section */}
      <div className="bg-red-50 p-5 rounded-lg border border-red-200">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-5 h-5 text-red-700" />
          <h4 className="text-lg font-semibold text-red-800">Deductions</h4>
        </div>
        
        <div className="space-y-3">
          {parseFloat(payroll.philhealth || 0) > 0 && (
            <div className="flex justify-between items-center pb-2">
              <span className="text-sm text-gray-700">PhilHealth</span>
              <span className="font-semibold text-gray-900">{formatCurrency(payroll.philhealth)}</span>
            </div>
          )}
          
          {parseFloat(payroll.sss || 0) > 0 && (
            <div className="flex justify-between items-center pb-2 border-t pt-2">
              <span className="text-sm text-gray-700">SSS</span>
              <span className="font-semibold text-gray-900">{formatCurrency(payroll.sss)}</span>
            </div>
          )}
          
          {parseFloat(payroll.pagibig || 0) > 0 && (
            <div className="flex justify-between items-center pb-2 border-t pt-2">
              <span className="text-sm text-gray-700">Pag-IBIG</span>
              <span className="font-semibold text-gray-900">{formatCurrency(payroll.pagibig)}</span>
            </div>
          )}
          
          {parseFloat(payroll.withholding_tax || 0) > 0 && (
            <div className="flex justify-between items-center pb-2 border-t pt-2">
              <span className="text-sm text-gray-700">Withholding Tax</span>
              <span className="font-semibold text-gray-900">{formatCurrency(payroll.withholding_tax)}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-3 border-t-2 border-red-300">
            <span className="font-semibold text-red-800">Total Deductions</span>
            <span className="text-lg font-bold text-red-700">{formatCurrency(payroll.total_deductions)}</span>
          </div>
        </div>
      </div>

      {/* Net Pay Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 rounded-lg text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-8 h-8" />
            <div>
              <p className="text-sm text-primary-100">Net Pay</p>
              <p className="text-3xl font-bold">{formatCurrency(payroll.net_pay)}</p>
            </div>
          </div>
          <DollarSign className="w-16 h-16 opacity-20" />
        </div>
        
        <div className="mt-4 pt-4 border-t border-primary-400">
          <p className="text-xs text-primary-100">
            This is the amount to be paid to the employee after all deductions.
          </p>
        </div>
      </div>

      {/* Payroll Items (if available) */}
      {payroll.payroll_items && payroll.payroll_items.length > 0 && (
        <div className="bg-gray-50 p-5 rounded-lg border">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Additional Items</h4>
          <div className="space-y-2">
            {payroll.payroll_items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <div>
                  <span className="text-sm font-medium text-gray-800">{item.description}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                    item.item_type === 'earning' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {item.item_type}
                  </span>
                </div>
                <span className={`font-semibold ${
                  item.item_type === 'earning' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {item.item_type === 'earning' ? '+' : '-'}{formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="text-xs text-gray-500 border-t pt-4">
        <p>Created: {payroll.created_at ? new Date(payroll.created_at).toLocaleString() : '-'}</p>
        {payroll.updated_at && (
          <p>Last Updated: {new Date(payroll.updated_at).toLocaleString()}</p>
        )}
      </div>
    </div>
  )
}
