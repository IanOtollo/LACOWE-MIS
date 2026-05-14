export interface Role {
  id: string
  name: 'admin' | 'member' | 'committee'
  created_at: string
}

export interface Profile {
  id: string
  full_name: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  national_id?: string
  role_id: string
  roles?: Role
  member_number?: string
  employment_number?: string
  department?: string
  date_joined: string
  status: 'active' | 'suspended' | 'exited'
  next_of_kin_name?: string
  next_of_kin_phone?: string
  next_of_kin_relationship?: string
  is_first_login: boolean
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  member_id: string
  profiles?: Profile
  account_number: string
  account_type: 'savings' | 'shares' | 'fixed_deposit'
  account_name: string
  balance: number
  status: 'active' | 'dormant' | 'closed'
  opened_at: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  account_id: string
  accounts?: Account
  member_id: string
  profiles?: Profile
  transaction_type:
    | 'deposit'
    | 'withdrawal'
    | 'loan_disbursement'
    | 'loan_repayment'
    | 'shares_purchase'
    | 'registration_fee'
    | 'transfer'
  amount: number
  balance_before: number
  balance_after: number
  reference_number: string
  description?: string
  payment_method?:
    | 'cash'
    | 'mpesa'
    | 'bank_transfer'
    | 'payroll'
    | 'internal_transfer'
  mpesa_reference?: string
  processed_by?: string
  status: string
  created_at: string
}

export interface LoanProduct {
  id: string
  name: string
  description?: string
  interest_rate: number
  max_amount: number
  min_amount: number
  max_term_months: number
  min_term_months: number
  requires_guarantor: boolean
  max_guarantors: number
  min_guarantors: number
  processing_fee_percent: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface LoanApplication {
  id: string
  application_number: string
  member_id: string
  profiles?: Profile
  loan_product_id: string
  loan_products?: LoanProduct
  amount_requested: number
  term_months: number
  purpose: string
  purpose_details?: string
  monthly_repayment?: number
  total_repayment?: number
  total_interest?: number
  processing_fee?: number
  status:
    | 'pending'
    | 'under_review'
    | 'approved'
    | 'rejected'
    | 'disbursed'
  submitted_at: string
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  disbursed_by?: string
  disbursed_at?: string
  disbursement_account_id?: string
  loan_guarantors?: LoanGuarantor[]
}

export interface LoanGuarantor {
  id: string
  loan_application_id: string
  guarantor_member_id: string
  profiles?: Profile
  amount_guaranteed: number
  status: 'pending' | 'accepted' | 'declined'
  response_notes?: string
  responded_at?: string
  created_at: string
}

export interface Loan {
  id: string
  loan_number: string
  member_id: string
  profiles?: Profile
  loan_application_id: string
  loan_product_id: string
  loan_products?: LoanProduct
  principal_amount: number
  interest_rate: number
  term_months: number
  monthly_repayment: number
  total_repayable: number
  total_interest: number
  total_paid: number
  outstanding_balance: number
  installments_paid: number
  installments_remaining?: number | null
  status: 'active' | 'completed' | 'defaulted' | 'written_off'
  disbursed_at?: string
  expected_completion_date?: string
  actual_completion_date?: string
  created_at: string
  updated_at: string
}

export interface RepaymentSchedule {
  id: string
  loan_id: string
  installment_number: number
  due_date: string
  principal_due: number
  interest_due: number
  total_due: number
  amount_paid: number
  status: 'pending' | 'paid' | 'partial' | 'overdue'
  paid_at?: string
}

export interface LoanRepayment {
  id: string
  loan_id: string
  loans?: Loan
  member_id: string
  profiles?: Profile
  schedule_id?: string
  amount_paid: number
  principal_component: number
  interest_component: number
  balance_before: number
  balance_after: number
  payment_method: string
  mpesa_reference?: string
  receipt_number: string
  notes?: string
  paid_at: string
  recorded_by: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'alert' | 'loan' | 'guarantor'
  is_read: boolean
  action_url?: string
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  priority: 'normal' | 'important' | 'urgent'
  target_role: 'all' | 'member' | 'committee'
  is_active: boolean
  published_by: string
  profiles?: Profile
  published_at: string
  expires_at?: string
}

export interface AuditLog {
  id: string
  user_id?: string
  user_name?: string
  action: string
  module: string
  table_name?: string
  record_id?: string
  old_data?: unknown
  new_data?: unknown
  ip_address?: string
  created_at: string
}

export interface SystemSettings {
  id: string
  group_name: string
  group_motto?: string
  contact_email?: string
  contact_phone?: string
  address?: string
  registration_fee: number
  minimum_shares: number
  minimum_savings: number
  max_loan_multiplier: number
  welfare_fund_balance: number
  updated_at: string
}

