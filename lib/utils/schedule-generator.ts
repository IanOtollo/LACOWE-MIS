import { generateRepaymentSchedule, type ScheduleInstallment } from './loan-calculator'

export function generateRepaymentScheduleForLoan(
  principal: number,
  annualInterestRate: number,
  termMonths: number,
  startDate: Date,
): ScheduleInstallment[] {
  return generateRepaymentSchedule(principal, annualInterestRate, termMonths, startDate)
}

