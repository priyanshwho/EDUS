-- ============================================================
-- EduSphere — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor
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
                  check (resource_type in ('notes','assignment','pyq','lecture','youtube')),
  title         text not null,
  description   text,
  year          int,
  pyq_type      text check (pyq_type in ('minor1','minor2','major', null)),
  external_link text,                              -- legacy Google Drive URL
  aws_s3_key    text,                              -- Tigris S3 object key
  uploaded_by   uuid references users(id) on delete set null,
  created_at    timestamptz not null default now(),
  slug          text unique not null,

  -- Enforce exactly one source
  constraint chk_one_source check (
    (external_link is null) != (aws_s3_key is null)
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
-- Row Level Security (RLS) — enable and set policies
-- ============================================================

alter table users             enable row level security;
alter table subjects          enable row level security;
alter table resources         enable row level security;
alter table announcements     enable row level security;
alter table saved_resources   enable row level security;

-- Service role bypasses RLS (used by backend)
-- The Supabase client using SERVICE_ROLE_KEY bypasses all RLS policies.
-- These policies apply to anonymous / authenticated JWT users only.

-- Public read on subjects and resources
create policy "public read subjects"
  on subjects for select using (true);

create policy "public read resources"
  on resources for select using (true);

create policy "public read announcements"
  on announcements for select using (true);

-- Users can read their own saved resources
create policy "own saved resources"
  on saved_resources for all
  using (auth.uid() = user_id);
