-- SSC 2027 — Supabase schema for the registrations table
-- Run this in the Supabase SQL editor (or `supabase db push`).

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Core identity
  email text unique not null,

  -- Personal info
  full_name text not null,
  contact_number text not null,
  faculty_institute text not null,
  programme_course text not null,
  current_semester_year text not null,
  division_batch text,
  github_profile text,
  linkedin_profile text,
  portfolio_website text,

  -- Verification
  has_uni_email boolean not null,
  uni_email text,
  uni_enrollment_id text,
  personal_email text,
  student_status text not null,
  enrollment_number text unique not null,

  -- Device & access
  mac_access text not null,
  device_frequency text,
  needs_mac_lab text not null,
  hours_per_week_prep text not null,

  -- Experience
  app_experience text not null,
  apple_experience text not null,
  independence_confidence text not null,
  interests_improving text[],
  previous_competitions boolean not null,
  competition_details text,

  -- Commitment
  commitment_level text not null,
  hours_per_week_program text not null,
  work_schedule text[] not null,
  willing_to_attend text not null,

  -- Idea & motivation
  why_interested text not null,
  has_idea text not null,
  idea_description text not null,
  excitement_level text[] not null,
  build_interest text[] not null,

  -- Consent
  confirm_accurate boolean not null,
  understand_no_guarantee boolean not null,
  agree_contact boolean not null,
  anything_else text,
  email_sent boolean not null default false
);

-- Indexes
create index if not exists registrations_created_at_idx on public.registrations (created_at desc);
create index if not exists registrations_faculty_idx on public.registrations (faculty_institute);
create index if not exists registrations_status_idx on public.registrations (student_status);

-- Row Level Security: anon key may only INSERT.
-- No select / update / delete policies are created for anon,
-- so the public key cannot read or modify existing rows.
alter table public.registrations enable row level security;

drop policy if exists "anon can insert" on public.registrations;
create policy "anon can insert"
  on public.registrations
  for insert
  with check (true);
