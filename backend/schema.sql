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
  created_at     timestamptz not null default now()
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

-- ============================================================
-- Authorization notes (backend-managed)
-- ============================================================
-- This schema is intended for a backend-managed authorization model
-- (JWT + role checks in application middleware) rather than Supabase RLS.
