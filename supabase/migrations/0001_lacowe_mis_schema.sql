-- ============================================
-- LACOWE WELFARE MIS — DATABASE SCHEMA
-- ============================================

-- ROLES
create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null, -- 'admin', 'member', 'committee'
  created_at timestamptz default now()
);

-- PROFILES (linked to auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  first_name text not null,
  last_name text not null,
  email text unique not null,
  phone text,
  national_id text unique,
  role_id uuid references roles(id),
  member_number text unique, -- e.g. LCW-0001
  employment_number text,
  department text,
  date_joined date default now(),
  status text default 'active', -- active, suspended, exited
  next_of_kin_name text,
  next_of_kin_phone text,
  next_of_kin_relationship text,
  is_first_login boolean default true,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SYSTEM SETTINGS (group-level)
create table if not exists system_settings (
  id uuid primary key default gen_random_uuid(),
  group_name text default 'LACOWE Welfare Group',
  group_motto text,
  contact_email text,
  contact_phone text,
  address text,
  registration_fee numeric(15,2) default 500.00,
  minimum_shares numeric(15,2) default 200.00,
  minimum_savings numeric(15,2) default 500.00,
  max_loan_multiplier numeric(5,2) default 3.00, -- loan = X * savings
  welfare_fund_balance numeric(15,2) default 100000.00, -- virtual fund admin can disburse from
  updated_by uuid references profiles(id),
  updated_at timestamptz default now()
);

-- ACCOUNTS
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references profiles(id) on delete cascade,
  account_number text unique not null,
  account_type text not null, -- 'savings', 'shares', 'fixed_deposit'
  account_name text not null,
  balance numeric(15,2) default 0.00,
  status text default 'active', -- active, dormant, closed
  opened_at date default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TRANSACTIONS
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id),
  member_id uuid references profiles(id),
  transaction_type text not null, -- 'deposit', 'withdrawal', 'loan_disbursement', 'loan_repayment', 'shares_purchase', 'registration_fee', 'transfer'
  amount numeric(15,2) not null,
  balance_before numeric(15,2),
  balance_after numeric(15,2),
  reference_number text unique not null,
  description text,
  payment_method text, -- 'cash', 'mpesa', 'bank_transfer', 'payroll'
  mpesa_reference text,
  processed_by uuid references profiles(id),
  status text default 'completed', -- completed, pending, reversed
  created_at timestamptz default now()
);

-- LOAN PRODUCTS
create table if not exists loan_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  interest_rate numeric(5,2) not null, -- annual % (reducing balance)
  max_amount numeric(15,2) not null,
  min_amount numeric(15,2) default 1000,
  max_term_months int not null,
  min_term_months int default 1,
  requires_guarantor boolean default true,
  max_guarantors int default 2,
  min_guarantors int default 1,
  processing_fee_percent numeric(5,2) default 1.00,
  is_active boolean default true,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- LOAN APPLICATIONS
create table if not exists loan_applications (
  id uuid primary key default gen_random_uuid(),
  application_number text unique not null,
  member_id uuid references profiles(id),
  loan_product_id uuid references loan_products(id),
  amount_requested numeric(15,2) not null,
  term_months int not null,
  purpose text not null,
  purpose_details text,
  monthly_repayment numeric(15,2),
  total_repayment numeric(15,2),
  total_interest numeric(15,2),
  processing_fee numeric(15,2),
  status text default 'pending', -- pending, under_review, approved, rejected, disbursed, active, completed, defaulted
  submitted_at timestamptz default now(),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  disbursed_by uuid references profiles(id),
  disbursed_at timestamptz,
  disbursement_account_id uuid references accounts(id)
);

-- LOAN GUARANTORS
create table if not exists loan_guarantors (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid references loan_applications(id) on delete cascade,
  guarantor_member_id uuid references profiles(id),
  amount_guaranteed numeric(15,2),
  status text default 'pending', -- pending, accepted, declined
  response_notes text,
  responded_at timestamptz,
  notified_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ACTIVE LOANS
create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  loan_number text unique not null,
  member_id uuid references profiles(id),
  loan_application_id uuid references loan_applications(id),
  loan_product_id uuid references loan_products(id),
  principal_amount numeric(15,2) not null,
  interest_rate numeric(5,2) not null,
  term_months int not null,
  monthly_repayment numeric(15,2) not null,
  total_repayable numeric(15,2) not null,
  total_interest numeric(15,2) not null,
  total_paid numeric(15,2) default 0.00,
  outstanding_balance numeric(15,2) not null,
  installments_paid int default 0,
  installments_remaining int,
  status text default 'active', -- active, completed, defaulted, written_off
  disbursed_at timestamptz,
  expected_completion_date date,
  actual_completion_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- REPAYMENT SCHEDULES
create table if not exists repayment_schedules (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid references loans(id) on delete cascade,
  installment_number int not null,
  due_date date not null,
  principal_due numeric(15,2) not null,
  interest_due numeric(15,2) not null,
  total_due numeric(15,2) not null,
  amount_paid numeric(15,2) default 0.00,
  status text default 'pending', -- pending, paid, partial, overdue
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- LOAN REPAYMENTS (actual payment records)
create table if not exists loan_repayments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid references loans(id),
  member_id uuid references profiles(id),
  schedule_id uuid references repayment_schedules(id),
  amount_paid numeric(15,2) not null,
  principal_component numeric(15,2) not null,
  interest_component numeric(15,2) not null,
  balance_before numeric(15,2) not null,
  balance_after numeric(15,2) not null,
  payment_method text default 'cash', -- cash, mpesa, bank_transfer, payroll_deduction
  mpesa_reference text,
  receipt_number text unique not null,
  notes text,
  paid_at timestamptz default now(),
  recorded_by uuid references profiles(id)
);

-- CONTRIBUTIONS
create table if not exists contributions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references profiles(id),
  account_id uuid references accounts(id),
  amount numeric(15,2) not null,
  contribution_type text not null, -- 'monthly_savings', 'shares', 'registration_fee', 'welfare_levy'
  period text, -- e.g., '2026-01'
  payment_method text default 'payroll',
  reference text,
  recorded_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- GENERAL LEDGER
create table if not exists general_ledger (
  id uuid primary key default gen_random_uuid(),
  entry_date date default now(),
  account_code text not null,
  account_name text not null,
  entry_type text not null, -- 'debit', 'credit'
  amount numeric(15,2) not null,
  description text not null,
  reference_number text,
  reference_type text, -- 'transaction', 'loan', 'repayment', 'contribution'
  reference_id uuid,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- NOTIFICATIONS
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text default 'info', -- 'info', 'success', 'warning', 'alert', 'loan', 'guarantor'
  is_read boolean default false,
  action_url text,
  created_at timestamptz default now()
);

-- ANNOUNCEMENTS (admin broadcasts)
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  priority text default 'normal', -- 'normal', 'important', 'urgent'
  target_role text default 'all', -- 'all', 'member', 'committee'
  is_active boolean default true,
  published_by uuid references profiles(id),
  published_at timestamptz default now(),
  expires_at timestamptz
);

-- AUDIT LOGS
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  user_name text,
  action text not null,
  module text not null,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert roles
insert into roles (name) values ('admin'), ('member'), ('committee')
on conflict (name) do nothing;

-- Insert system settings
insert into system_settings (group_name, group_motto, contact_email, contact_phone, address, welfare_fund_balance)
values ('LACOWE Welfare Group', 'Together We Prosper', 'info@lacowe.co.ke', '+254700000000', 'JKUAT Main Campus, Juja, Kiambu County', 100000.00)
on conflict do nothing;

-- Insert loan products
insert into loan_products (name, description, interest_rate, max_amount, min_amount, max_term_months, min_term_months, requires_guarantor, max_guarantors, min_guarantors, processing_fee_percent) values
('Normal Loan', 'Standard loan for general personal and professional needs', 12.00, 500000, 5000, 36, 3, true, 2, 1, 1.00),
('Emergency Loan', 'Fast-tracked loan for urgent financial needs — disbursed within 24 hours', 10.00, 50000, 1000, 6, 1, false, 0, 0, 0.50),
('Development Loan', 'Long-term loan for investment and development purposes', 14.00, 1000000, 10000, 60, 6, true, 2, 2, 1.50),
('School Fees Loan', 'Education financing for members and dependents', 8.00, 200000, 5000, 12, 3, true, 1, 1, 0.50)
on conflict do nothing;

-- ============================================
-- RLS POLICIES
-- ============================================

alter table profiles enable row level security;
alter table accounts enable row level security;
alter table transactions enable row level security;
alter table loan_applications enable row level security;
alter table loan_guarantors enable row level security;
alter table loans enable row level security;
alter table loan_repayments enable row level security;
alter table repayment_schedules enable row level security;
alter table notifications enable row level security;
alter table contributions enable row level security;

-- Profiles: admins see all, members see own
create policy "profiles_admin_all" on profiles for all
using ((select name from roles where id = (select role_id from profiles where id = auth.uid())) = 'admin');

create policy "profiles_own" on profiles for select
using (auth.uid() = id);

create policy "profiles_own_update" on profiles for update
using (auth.uid() = id);

-- Accounts: admin all, member own
create policy "accounts_admin" on accounts for all
using ((select name from roles where id = (select role_id from profiles where id = auth.uid())) = 'admin');

create policy "accounts_member_own" on accounts for select
using (auth.uid() = member_id);

-- Transactions: admin all, member own
create policy "transactions_admin" on transactions for all
using ((select name from roles where id = (select role_id from profiles where id = auth.uid())) = 'admin');

create policy "transactions_member_own" on transactions for select
using (auth.uid() = member_id);

-- Loan applications: admin all, member own
create policy "loan_apps_admin" on loan_applications for all
using ((select name from roles where id = (select role_id from profiles where id = auth.uid())) = 'admin');

create policy "loan_apps_member_own" on loan_applications for select
using (auth.uid() = member_id);

create policy "loan_apps_member_insert" on loan_applications for insert
with check (auth.uid() = member_id);

-- Guarantors: member can see requests assigned to them
create policy "guarantors_admin" on loan_guarantors for all
using ((select name from roles where id = (select role_id from profiles where id = auth.uid())) = 'admin');

create policy "guarantors_own" on loan_guarantors for select
using (auth.uid() = guarantor_member_id);

create policy "guarantors_own_update" on loan_guarantors for update
using (auth.uid() = guarantor_member_id);

-- Loans
create policy "loans_admin" on loans for all
using ((select name from roles where id = (select role_id from profiles where id = auth.uid())) = 'admin');

create policy "loans_member_own" on loans for select
using (auth.uid() = member_id);

-- Repayments
create policy "repayments_admin" on loan_repayments for all
using ((select name from roles where id = (select role_id from profiles where id = auth.uid())) = 'admin');

create policy "repayments_member_own" on loan_repayments for select
using (auth.uid() = member_id);

-- Repayment schedules
create policy "schedules_admin" on repayment_schedules for all
using ((select name from roles where id = (select role_id from profiles where id = auth.uid())) = 'admin');

create policy "schedules_member_own" on repayment_schedules for select
using (
  auth.uid() = (select member_id from loans where id = repayment_schedules.loan_id)
);

-- Notifications: own only
create policy "notifications_own" on notifications for all
using (auth.uid() = user_id);

-- Contributions: admin all, member own
create policy "contributions_admin" on contributions for all
using ((select name from roles where id = (select role_id from profiles where id = auth.uid())) = 'admin');

create policy "contributions_member_own" on contributions for select
using (auth.uid() = member_id);

