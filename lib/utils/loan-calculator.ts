export interface LoanCalculation {
  monthlyRepayment: number
  totalRepayable: number
  totalInterest: number
  processingFee: number
}

export function calculateLoan(
  principal: number,
  annualInterestRate: number,
  termMonths: number,
  processingFeePercent: number = 1,
): LoanCalculation {
  const monthlyRate = annualInterestRate / 100 / 12

  const monthly =
    monthlyRate === 0
      ? principal / termMonths
      : (principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
        (Math.pow(1 + monthlyRate, termMonths) - 1)

  const total = monthly * termMonths
  const interest = total - principal
  const processingFee = (principal * processingFeePercent) / 100

  return {
    monthlyRepayment: Math.round(monthly * 100) / 100,
    totalRepayable: Math.round(total * 100) / 100,
    totalInterest: Math.round(interest * 100) / 100,
    processingFee: Math.round(processingFee * 100) / 100,
  }
}

export interface ScheduleInstallment {
  installmentNumber: number
  dueDate: string
  principalDue: number
  interestDue: number
  totalDue: number
  openingBalance: number
  closingBalance: number
}

export function generateRepaymentSchedule(
  principal: number,
  annualInterestRate: number,
  termMonths: number,
  startDate: Date,
): ScheduleInstallment[] {
  const monthlyRate = annualInterestRate / 100 / 12
  const monthly = calculateLoan(principal, annualInterestRate, termMonths).monthlyRepayment

  let balance = principal
  const schedule: ScheduleInstallment[] = []

  for (let i = 1; i <= termMonths; i++) {
    const interest = Math.round(balance * monthlyRate * 100) / 100
    const principalComponent = Math.round((monthly - interest) * 100) / 100
    const openingBalance = balance
    balance = Math.max(0, Math.round((balance - principalComponent) * 100) / 100)

    const dueDate = new Date(startDate)
    dueDate.setMonth(dueDate.getMonth() + i)

    schedule.push({
      installmentNumber: i,
      dueDate: dueDate.toISOString().split('T')[0],
      principalDue: principalComponent,
      interestDue: interest,
      totalDue: Math.round(monthly * 100) / 100,
      openingBalance,
      closingBalance: balance,
    })
  }

  return schedule
}

