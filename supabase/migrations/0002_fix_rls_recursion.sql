-- Fix infinite recursion in RLS policies

-- 1. Create a security definer function to check if the current user is an admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profiles p
    join roles r on p.role_id = r.id
    where p.id = auth.uid() and r.name = 'admin'
  );
$$;

-- 2. Drop all the old recursive policies
drop policy if exists "profiles_admin_all" on profiles;
drop policy if exists "accounts_admin" on accounts;
drop policy if exists "transactions_admin" on transactions;
drop policy if exists "loan_apps_admin" on loan_applications;
drop policy if exists "guarantors_admin" on loan_guarantors;
drop policy if exists "loans_admin" on loans;
drop policy if exists "repayments_admin" on loan_repayments;
drop policy if exists "schedules_admin" on repayment_schedules;
drop policy if exists "contributions_admin" on contributions;

-- 3. Recreate them using the security definer function
alter table roles enable row level security;
drop policy if exists "roles_read_all" on roles;
create policy "roles_read_all" on roles for select using (true);

create policy "profiles_admin_all" on profiles for all using (public.is_admin());
create policy "accounts_admin" on accounts for all using (public.is_admin());
create policy "transactions_admin" on transactions for all using (public.is_admin());
create policy "loan_apps_admin" on loan_applications for all using (public.is_admin());
create policy "guarantors_admin" on loan_guarantors for all using (public.is_admin());
create policy "loans_admin" on loans for all using (public.is_admin());
create policy "repayments_admin" on loan_repayments for all using (public.is_admin());
create policy "schedules_admin" on repayment_schedules for all using (public.is_admin());
create policy "contributions_admin" on contributions for all using (public.is_admin());
