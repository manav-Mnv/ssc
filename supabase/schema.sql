-- ==============================================================================
-- SWIFT STUDENT CHALLENGE 2027: SUPABASE DATABASE & BACKUP ARCHITECTURE
-- ==============================================================================
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- 1. PRIMARY REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Core Identity
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  faculty_institute TEXT NOT NULL,
  programme_course TEXT NOT NULL,
  current_semester_year TEXT NOT NULL,
  division_batch TEXT,
  github_profile TEXT,
  linkedin_profile TEXT,
  portfolio_website TEXT,

  -- Verification
  has_uni_email BOOLEAN NOT NULL,
  uni_email TEXT,
  uni_enrollment_id TEXT,
  personal_email TEXT,
  student_status TEXT,
  enrollment_number TEXT UNIQUE NOT NULL,

  -- Device & Access
  mac_access TEXT NOT NULL,
  device_frequency TEXT,
  needs_mac_lab TEXT NOT NULL,
  hours_per_week_prep TEXT NOT NULL,

  -- Experience & Skill
  app_experience TEXT NOT NULL,
  apple_experience TEXT NOT NULL,
  independence_confidence TEXT NOT NULL,
  interests_improving TEXT[],
  previous_competitions BOOLEAN NOT NULL DEFAULT false,
  competition_details TEXT,

  -- Commitment
  commitment_level TEXT NOT NULL,
  hours_per_week_program TEXT NOT NULL,
  work_schedule TEXT[] NOT NULL,
  willing_to_attend TEXT NOT NULL,

  -- Idea & Motivation
  why_interested TEXT NOT NULL,
  has_idea TEXT NOT NULL,
  idea_description TEXT NOT NULL,
  excitement_level TEXT[] NOT NULL,
  build_interest TEXT[] NOT NULL,

  -- Consent & Submission
  confirm_accurate BOOLEAN NOT NULL DEFAULT false,
  understand_no_guarantee BOOLEAN NOT NULL DEFAULT false,
  agree_contact BOOLEAN NOT NULL DEFAULT false,
  anything_else TEXT,
  email_sent BOOLEAN NOT NULL DEFAULT false
);

-- Performance Indexes on Primary Table
CREATE INDEX IF NOT EXISTS registrations_created_at_idx ON public.registrations (created_at DESC);
CREATE INDEX IF NOT EXISTS registrations_email_idx ON public.registrations (email);
CREATE INDEX IF NOT EXISTS registrations_enrollment_idx ON public.registrations (enrollment_number);
CREATE INDEX IF NOT EXISTS registrations_faculty_idx ON public.registrations (faculty_institute);

-- Row Level Security (RLS) for Primary Table
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon can insert" ON public.registrations;
CREATE POLICY "anon can insert"
  ON public.registrations
  FOR INSERT
  WITH CHECK (true);

-- (No public SELECT, UPDATE, or DELETE policies - only Service Role or authenticated admin can read/manage)


-- ==============================================================================
-- 2. DEDICATED IMMUTABLE BACKUP TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.registrations_backup (
  backup_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Original Registration Fields
  original_id UUID,
  created_at TIMESTAMPTZ,
  email TEXT,
  full_name TEXT,
  contact_number TEXT,
  faculty_institute TEXT,
  programme_course TEXT,
  current_semester_year TEXT,
  division_batch TEXT,
  github_profile TEXT,
  linkedin_profile TEXT,
  portfolio_website TEXT,
  has_uni_email BOOLEAN,
  uni_email TEXT,
  uni_enrollment_id TEXT,
  personal_email TEXT,
  student_status TEXT,
  enrollment_number TEXT,
  mac_access TEXT,
  device_frequency TEXT,
  needs_mac_lab TEXT,
  hours_per_week_prep TEXT,
  app_experience TEXT,
  apple_experience TEXT,
  independence_confidence TEXT,
  interests_improving TEXT[],
  previous_competitions BOOLEAN,
  competition_details TEXT,
  commitment_level TEXT,
  hours_per_week_program TEXT,
  work_schedule TEXT[],
  willing_to_attend TEXT,
  why_interested TEXT,
  has_idea TEXT,
  idea_description TEXT,
  excitement_level TEXT[],
  build_interest TEXT[],
  confirm_accurate BOOLEAN,
  understand_no_guarantee BOOLEAN,
  agree_contact BOOLEAN,
  anything_else TEXT,
  email_sent BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS registrations_backup_created_idx ON public.registrations_backup (backup_created_at DESC);

-- Lock Down Backup Table: RLS Enabled, zero public access
ALTER TABLE public.registrations_backup ENABLE ROW LEVEL SECURITY;


-- ==============================================================================
-- 3. AUTOMATIC POSTGRESQL TRIGGER: MIRROR EVERY REGISTRATION TO BACKUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.backup_student_registration()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.registrations_backup (
    original_id, created_at, email, full_name, contact_number,
    faculty_institute, programme_course, current_semester_year, division_batch,
    github_profile, linkedin_profile, portfolio_website, has_uni_email,
    uni_email, uni_enrollment_id, personal_email, student_status,
    enrollment_number, mac_access, device_frequency, needs_mac_lab,
    hours_per_week_prep, app_experience, apple_experience,
    independence_confidence, interests_improving, previous_competitions,
    competition_details, commitment_level, hours_per_week_program,
    work_schedule, willing_to_attend, why_interested, has_idea,
    idea_description, excitement_level, build_interest, confirm_accurate,
    understand_no_guarantee, agree_contact, anything_else, email_sent
  ) VALUES (
    NEW.id, NEW.created_at, NEW.email, NEW.full_name, NEW.contact_number,
    NEW.faculty_institute, NEW.programme_course, NEW.current_semester_year, NEW.division_batch,
    NEW.github_profile, NEW.linkedin_profile, NEW.portfolio_website, NEW.has_uni_email,
    NEW.uni_email, NEW.uni_enrollment_id, NEW.personal_email, NEW.student_status,
    NEW.enrollment_number, NEW.mac_access, NEW.device_frequency, NEW.needs_mac_lab,
    NEW.hours_per_week_prep, NEW.app_experience, NEW.apple_experience,
    NEW.independence_confidence, NEW.interests_improving, NEW.previous_competitions,
    NEW.competition_details, NEW.commitment_level, NEW.hours_per_week_program,
    NEW.work_schedule, NEW.willing_to_attend, NEW.why_interested, NEW.has_idea,
    NEW.idea_description, NEW.excitement_level, NEW.build_interest, NEW.confirm_accurate,
    NEW.understand_no_guarantee, NEW.agree_contact, NEW.anything_else, NEW.email_sent
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to public.registrations
DROP TRIGGER IF EXISTS trigger_backup_student_registration ON public.registrations;
CREATE TRIGGER trigger_backup_student_registration
AFTER INSERT ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.backup_student_registration();
