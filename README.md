# CampusWatch — Lost & Found / Complaint Reporting System

A simple portal where students report lost items, found items, or facility
issues (broken chairs, leaks, etc.), and admin staff track and resolve them
from a dashboard.

Built with **Vite + React + Supabase**.

## Features

- Student sign up / log in (Supabase Auth)
- Students submit reports (lost item / found item / facility issue) with
  an optional photo
- Students see their own reports and current status
- Admin dashboard: view all reports, filter by status/category, update
  status (Pending → In progress → Resolved), and leave admin notes
- Row Level Security in Supabase so students only ever see their own
  reports, and only admins can update status

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** → paste the contents of `supabase/schema.sql` → **Run**.
   This creates the `profiles` and `reports` tables, RLS policies, the
   auto-profile trigger, and the `report-images` storage bucket.
3. Go to **Project Settings → API** and copy your **Project URL** and
   **anon public key**.

### Making a user an admin

By default every new sign-up gets `role = 'student'`. To promote someone:

```sql
update public.profiles set role = 'admin' where id = 'their-user-uuid';
```

You can find a user's UUID in **Authentication → Users**.

## 2. Configure the app

```bash
cp .env.example .env
```

Fill in `.env`:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## 4. Build for production

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  components/     ReportForm, ReportCard, Navbar, StatusBadge, ProtectedRoute
  context/        AuthContext (session, profile, role)
  pages/          Login, Signup, StudentDashboard, AdminDashboard
  supabaseClient.js
supabase/
  schema.sql      Full DB schema, RLS policies, storage bucket
```

## Tech stack

- React 19 + Vite
- React Router
- Supabase (Auth, Postgres, Storage, RLS)
