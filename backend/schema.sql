-- ============================================================
-- EduSphere — PostgreSQL Schema (NeonDB compatible)
-- Run this in your PostgreSQL SQL editor/client
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── users ──────────────────────────────────────────────────────────────────
create table if not exists users (
  id             uuid primary key default gen_random_uuid(),
  username       text unique not null,
  name           text,
  email          text unique not null,
  password_hash  text,                              -- null for OAuth-only users
  role           text not null default 'student'
                   check (role in ('student', 'professor', 'admin')),
  oauth_provider text,                              -- 'google' | 'github' | null
  created_at     timestamptz not null default now(),
  last_active_at timestamptz                         -- updated on each authenticated request
);

create index if not exists idx_users_email on users(email);
create index if not exists idx_users_role  on users(role);

-- ── subjects ───────────────────────────────────────────────────────────────
create table if not exists subjects (
  id         uuid primary key default gen_random_uuid(),
  branch     text not null,
  semester   int  not null,
  name_full  text not null,
  acronym    text not null,
  added_by   uuid references users(id) on delete set null,
  added_date timestamptz not null default now()
);

create index if not exists idx_subjects_branch   on subjects(branch);
create index if not exists idx_subjects_semester on subjects(semester);

-- ── resources ──────────────────────────────────────────────────────────────
create table if not exists resources (
  id            uuid primary key default gen_random_uuid(),
  subject_id    uuid not null references subjects(id) on delete cascade,
  resource_type text not null
                  check (resource_type in ('notes','assignment','pyq','lecture')),
  title         text not null,
  description   text,
  year          int,
  pyq_type      text check (pyq_type in ('minor1','minor2','major')),
  external_link text,                              -- legacy Google Drive URL
  aws_s3_key    text,                              -- Tigris S3 object key
  youtube_url   text,                              -- YouTube lecture URL
  uploaded_by   uuid references users(id) on delete set null,
  created_at    timestamptz not null default now(),
  slug          text unique not null,

  -- Enforce exactly one source (Drive link, S3 key, or YouTube URL)
  constraint chk_one_source check (
    (external_link is not null)::int +
    (aws_s3_key    is not null)::int +
    (youtube_url   is not null)::int = 1
  )
);

create index if not exists idx_resources_slug          on resources(slug);
create index if not exists idx_resources_subject_id    on resources(subject_id);
create index if not exists idx_resources_resource_type on resources(resource_type);
create index if not exists idx_resources_uploaded_by   on resources(uploaded_by);
create index if not exists idx_resources_year          on resources(year);

-- ── announcements ──────────────────────────────────────────────────────────
create table if not exists announcements (
  id         uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id) on delete set null,
  title      text not null,
  content    text not null,
  posted_by  uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_announcements_subject_id on announcements(subject_id);

-- ── saved_resources ────────────────────────────────────────────────────────
create table if not exists saved_resources (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, resource_id)
);

create index if not exists idx_saved_resources_user_id on saved_resources(user_id);

-- ── user_sessions (Telemetry) ──────────────────────────────────────────────
create table if not exists user_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete set null,
  started_at timestamptz not null default now()
);

create index if not exists idx_user_sessions_started_at on user_sessions(started_at);
create index if not exists idx_user_sessions_user_time  on user_sessions(user_id, started_at desc);

-- ── resource_events (Telemetry) ────────────────────────────────────────────
create table if not exists resource_events (
  id          uuid primary key default gen_random_uuid(),
  event_type  text not null
                check (event_type in ('OPEN', 'DOWNLOAD_REQUEST', 'SAVE', 'UNSAVE')),
  user_id     uuid references users(id) on delete set null,
  resource_id uuid references resources(id) on delete set null,
  subject_id  uuid references subjects(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_resource_events_resource on resource_events(resource_id, event_type);
create index if not exists idx_resource_events_subject  on resource_events(subject_id, event_type);
create index if not exists idx_resource_events_time     on resource_events(created_at);

-- ── quiz_attempts (Telemetry) ──────────────────────────────────────────────
create table if not exists quiz_attempts (
  id              uuid primary key,
  user_id         uuid references users(id) on delete set null,
  subject_id      uuid references subjects(id) on delete set null,
  chapter_title   text not null,
  difficulty      text not null check (difficulty in ('easy', 'medium', 'hard')),
  score           int not null check (score >= 0 and score <= total_questions),
  total_questions int not null check (total_questions > 0),
  submitted_at    timestamptz not null default now()
);

create index if not exists idx_quiz_attempts_subject on quiz_attempts(subject_id, difficulty);
create index if not exists idx_quiz_attempts_time    on quiz_attempts(submitted_at);

-- ── ai_feature_events (Telemetry) ──────────────────────────────────────────
create table if not exists ai_feature_events (
  id           uuid primary key default gen_random_uuid(),
  feature_type text not null
                 check (feature_type in ('AI_TUTOR', 'MCQ_GENERATOR', 'FLASHCARDS', 'PYQ_PREDICTOR')),
  user_id      uuid references users(id) on delete set null,
  subject_id   uuid references subjects(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_ai_events_feature on ai_feature_events(feature_type, created_at);

-- ── users academic profile additions ───────────────────────────────────────
alter table users add column if not exists academic_branch text;
alter table users add column if not exists enrollment_year int;

-- ── syllabi (Dynamic AI Syllabus System) ──────────────────────────────────
create table if not exists syllabi (
  id           uuid primary key default gen_random_uuid(),
  subject_name text not null,
  subject_code text,
  branch       text not null,
  semester     int not null,
  content      text not null,
  section_a    text,
  section_b    text,
  created_by   uuid references users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index if not exists idx_syllabi_subject_branch_sem on syllabi (lower(subject_name), upper(branch), semester);
create index if not exists idx_syllabi_branch_sem on syllabi (upper(branch), semester);

-- ============================================================
-- Authorization notes (backend-managed)
-- ============================================================
-- This schema is intended for a backend-managed authorization model
-- (JWT + role checks in application middleware) rather than Supabase RLS.

