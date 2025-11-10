<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payslip - {{ $employee->user->first_name }} {{ $employee->user->last_name }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            margin: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }
        .document-title {
            font-size: 18px;
            font-weight: bold;
            margin-top: 10px;
        }
        .info-section {
            margin-bottom: 20px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        .info-label {
            font-weight: bold;
            width: 40%;
        }
        .info-value {
            width: 60%;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th {
            background-color: #2563eb;
            color: white;
            padding: 10px;
            text-align: left;
            font-weight: bold;
        }
        td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
        }
        .amount {
            text-align: right;
        }
        .total-row {
            font-weight: bold;
            background-color: #f3f4f6;
        }
        .net-pay-row {
            font-weight: bold;
            background-color: #2563eb;
            color: white;
            font-size: 14px;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
            color: #2563eb;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">Employee Management System</div>
        <div>Philippine Employee Payroll</div>
        <div class="document-title">PAYSLIP</div>
    </div>

    <div class="info-section">
        <div class="info-row">
            <div class="info-label">Employee Name:</div>
            <div class="info-value">{{ $employee->user->first_name }} {{ $employee->user->last_name }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Employee Number:</div>
            <div class="info-value">{{ $employee->employee_number }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Department:</div>
            <div class="info-value">{{ $employee->department->name ?? 'N/A' }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Position:</div>
            <div class="info-value">{{ $employee->position }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Pay Period:</div>
            <div class="info-value">{{ \Carbon\Carbon::parse($payroll->payroll_period . '-01')->format('F Y') }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Pay Date:</div>
            <div class="info-value">{{ \Carbon\Carbon::parse($payroll->pay_date)->format('F d, Y') }}</div>
        </div>
    </div>

    <div class="section-title">EARNINGS</div>
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th class="amount">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Base Salary</td>
                <td class="amount">₱{{ number_format($payroll->base_salary, 2) }}</td>
            </tr>
            @if($payroll->allowance > 0)
            <tr>
                <td>Allowance</td>
                <td class="amount">₱{{ number_format($payroll->allowance, 2) }}</td>
            </tr>
            @endif
            @if($payroll->overtime_pay > 0)
            <tr>
                <td>Overtime Pay</td>
                <td class="amount">₱{{ number_format($payroll->overtime_pay, 2) }}</td>
            </tr>
            @endif
            @if($payroll->holiday_pay > 0)
            <tr>
                <td>Holiday Pay</td>
                <td class="amount">₱{{ number_format($payroll->holiday_pay, 2) }}</td>
            </tr>
            @endif
            @if($payroll->bonus > 0)
            <tr>
                <td>Bonus</td>
                <td class="amount">₱{{ number_format($payroll->bonus, 2) }}</td>
            </tr>
            @endif
            <tr class="total-row">
                <td>TOTAL EARNINGS</td>
                <td class="amount">₱{{ number_format($payroll->total_earnings, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="section-title">DEDUCTIONS</div>
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th class="amount">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>SSS Contribution</td>
                <td class="amount">₱{{ number_format($payroll->sss, 2) }}</td>
            </tr>
            <tr>
                <td>PhilHealth Contribution</td>
                <td class="amount">₱{{ number_format($payroll->philhealth, 2) }}</td>
            </tr>
            <tr>
                <td>Pag-IBIG Contribution</td>
                <td class="amount">₱{{ number_format($payroll->pagibig, 2) }}</td>
            </tr>
            <tr>
                <td>Withholding Tax</td>
                <td class="amount">₱{{ number_format($payroll->withholding_tax, 2) }}</td>
            </tr>
            @if(isset($custom_deductions) && $custom_deductions->count() > 0)
                @foreach($custom_deductions as $deduction)
                <tr>
                    <td>{{ $deduction->description }}</td>
                    <td class="amount">₱{{ number_format($deduction->amount, 2) }}</td>
                </tr>
                @endforeach
            @endif
            <tr class="total-row">
                <td>TOTAL DEDUCTIONS</td>
                <td class="amount">₱{{ number_format($payroll->total_deductions, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <table>
        <tbody>
            <tr class="net-pay-row">
                <td>NET PAY</td>
                <td class="amount">₱{{ number_format($payroll->net_pay, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        <p>This is a computer-generated payslip and does not require a signature.</p>
        <p>Generated on {{ \Carbon\Carbon::now()->format('F d, Y h:i A') }}</p>
    </div>
</body>
</html>
