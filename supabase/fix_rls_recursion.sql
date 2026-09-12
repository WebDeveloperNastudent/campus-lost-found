-- Fix: infinite recursion in RLS policies
-- The original "Admins can view all X" policies checked the profiles table
-- from inside a policy ON the profiles table, causing infinite recursion.
-- This function runs with elevated privileges so it can check the role
-- without re-triggering RLS.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Replace the recursive policy on profiles
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

-- Replace the recursive policies on reports
drop policy if exists "Admins can view all reports" on public.reports;
create policy "Admins can view all reports"
  on public.reports for select
  using (public.is_admin());

drop policy if exists "Admins can update reports" on public.reports;
create policy "Admins can update reports"
  on public.reports for update
  using (public.is_admin());
