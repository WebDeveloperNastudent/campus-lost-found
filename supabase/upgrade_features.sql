-- Upgrade features: priority flag, comments thread, student can delete own pending reports

-- 1. Priority flag on reports
alter table public.reports
  add column if not exists priority text not null default 'normal'
  check (priority in ('normal', 'urgent'));

-- 2. Students can delete their own report while it's still pending
drop policy if exists "Users can delete own pending reports" on public.reports;
create policy "Users can delete own pending reports"
  on public.reports for delete
  using (auth.uid() = reporter_id and status = 'pending');

-- 3. Comment thread per report
create table if not exists public.report_comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_role text not null check (author_role in ('student', 'admin')),
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.report_comments enable row level security;

drop policy if exists "View comments on own or all reports" on public.report_comments;
create policy "View comments on own or all reports"
  on public.report_comments for select
  using (
    exists (
      select 1 from public.reports r
      where r.id = report_id and r.reporter_id = auth.uid()
    )
    or public.is_admin()
  );

drop policy if exists "Insert comments on own or all reports" on public.report_comments;
create policy "Insert comments on own or all reports"
  on public.report_comments for insert
  with check (
    author_id = auth.uid()
    and (
      exists (
        select 1 from public.reports r
        where r.id = report_id and r.reporter_id = auth.uid()
      )
      or public.is_admin()
    )
  );

-- Note: this file assumes public.is_admin() already exists from fix_rls_recursion.sql.
-- Run that first if you haven't already.
