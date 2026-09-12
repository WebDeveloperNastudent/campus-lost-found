-- Campus Lost & Found / Complaint Reporting System
-- Run this once in Supabase SQL Editor (Project > SQL Editor > New query)

-- 1. PROFILES TABLE (extends auth.users with role info)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  student_id text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, student_id, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'student_id', ''),
    'student'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. REPORTS TABLE (lost items, found items, facility issues)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('lost_item', 'found_item', 'facility_issue')),
  title text not null,
  description text not null,
  location text,
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'resolved')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reports enable row level security;

-- Students can create their own reports
create policy "Users can insert own reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

-- Students can view their own reports; admins can view all
create policy "Users can view own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

create policy "Admins can view all reports"
  on public.reports for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Only admins can update status / notes on any report
create policy "Admins can update reports"
  on public.reports for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
  before update on public.reports
  for each row execute procedure public.set_updated_at();

-- 3. STORAGE (optional, for photo attachments on reports)
-- Run this too if you want image uploads to work:
insert into storage.buckets (id, name, public)
values ('report-images', 'report-images', true)
on conflict (id) do nothing;

create policy "Anyone can view report images"
  on storage.objects for select
  using (bucket_id = 'report-images');

create policy "Authenticated users can upload report images"
  on storage.objects for insert
  with check (bucket_id = 'report-images' and auth.role() = 'authenticated');

-- 4. TO MAKE SOMEONE AN ADMIN, run manually after they sign up:
-- update public.profiles set role = 'admin' where id = 'their-user-uuid';
