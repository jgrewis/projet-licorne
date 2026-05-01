-- ============================================================
-- PROJET LICORNE — Schéma Supabase
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- ============================================================

-- Extension UUID
create extension if not exists "pgcrypto";

-- ─── UTILISATEURS ────────────────────────────────────────────
create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  initials    text not null,
  color       text not null default '#4169e1',
  role        text not null default 'user' check (role in ('admin', 'user')),
  created_at  timestamptz not null default now()
);

-- ─── TABLEAUX MAÎTRES ────────────────────────────────────────
create table if not exists boards (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  color       text not null default '#4169e1',
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ─── ÉLÉMENTS ────────────────────────────────────────────────
create table if not exists elements (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid not null references boards(id) on delete cascade,
  name        text not null,
  assigned_to uuid references users(id) on delete set null,
  responsible uuid references users(id) on delete set null,
  date_start  date,
  date_end    date,
  status      text not null default 'en_attente'
              check (status in ('en_cours','en_attente','fait','refuse','annule')),
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ─── SOUS-ÉLÉMENTS ───────────────────────────────────────────
create table if not exists sub_elements (
  id          uuid primary key default gen_random_uuid(),
  element_id  uuid not null references elements(id) on delete cascade,
  name        text not null,
  assigned_to uuid references users(id) on delete set null,
  responsible uuid references users(id) on delete set null,
  date_start  date,
  date_end    date,
  status      text not null default 'en_attente'
              check (status in ('en_cours','en_attente','fait','refuse','annule')),
  ref_board_id uuid references boards(id) on delete set null,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ─── COMMENTAIRES ────────────────────────────────────────────
create table if not exists comments (
  id          uuid primary key default gen_random_uuid(),
  element_id  uuid not null,   -- peut pointer un element ou sub_element
  element_type text not null check (element_type in ('element','sub_element')),
  author_id   uuid references users(id) on delete set null,
  content     text not null,
  created_at  timestamptz not null default now()
);

-- ─── INDEX ───────────────────────────────────────────────────
create index if not exists idx_elements_board_id on elements(board_id);
create index if not exists idx_sub_elements_element_id on sub_elements(element_id);
create index if not exists idx_comments_element_id on comments(element_id);

-- ─── DONNÉES D'EXEMPLE ───────────────────────────────────────
insert into users (id, name, initials, color, role) values
  ('00000000-0000-0000-0000-000000000001', 'Jean-Philippe', 'JP', '#4169e1', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'Marie Dupont',  'MD', '#e14169', 'user'),
  ('00000000-0000-0000-0000-000000000003', 'Luc Martin',    'LM', '#41e169', 'user')
on conflict (id) do nothing;

insert into boards (id, name, description, color, position) values
  ('10000000-0000-0000-0000-000000000001', 'Gestion Marketing',    'Projets et campagnes marketing', '#4169e1', 0),
  ('10000000-0000-0000-0000-000000000002', 'Gestion Événements',   'Organisation d''événements',     '#e14169', 1),
  ('10000000-0000-0000-0000-000000000003', 'Gestion Logistique',   'Suivi logistique et fournitures','#41e169', 2)
on conflict (id) do nothing;

insert into elements (id, board_id, name, assigned_to, responsible, date_start, date_end, status, position) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Campagne Réseaux Sociaux',
   '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   '2026-05-01', '2026-05-31', 'en_cours', 0),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Refonte Site Web',
   '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
   '2026-06-01', '2026-07-31', 'en_attente', 1),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Gala Annuel 2026',
   '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   '2026-09-01', '2026-09-30', 'en_cours', 0)
on conflict (id) do nothing;

insert into sub_elements (id, element_id, name, assigned_to, responsible, date_start, date_end, status, ref_board_id, position) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Design visuels',
   '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
   '2026-05-01', '2026-05-10', 'fait', null, 0),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Rédaction contenus',
   '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   '2026-05-05', '2026-05-15', 'en_cours', null, 1),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Coordination événement',
   '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   '2026-09-01', '2026-09-30', 'en_cours', '10000000-0000-0000-0000-000000000002', 0)
on conflict (id) do nothing;

-- RLS désactivé pour le MVP (pas d'auth forte)
alter table users        disable row level security;
alter table boards       disable row level security;
alter table elements     disable row level security;
alter table sub_elements disable row level security;
alter table comments     disable row level security;
