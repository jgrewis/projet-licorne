-- ============================================================
-- ÉTAPE 2 — Fermeture de la RLS (BASCULE / CUTOVER)
-- À exécuter SEULEMENT quand :
--   (a) 01_auth_setup.sql + 01b_authenticated_policies.sql sont passés,
--   (b) l'app déployée utilise déjà le login Supabase Auth, ET
--   (c) un compte admin Auth est créé et testé (login + CRUD OK).
-- ⚠️ Ce script retire l'accès `anon` : l'ancienne app (sans login)
--    cesse de fonctionner. À faire APRÈS le déploiement de la nouvelle.
-- Les policies `authenticated` (étape 1b) restent en place.
-- ============================================================

-- Supprimer les policies permissives anon (LA faille : base ouverte à tous)
do $$ declare r record; begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname='public' and policyname like 'anon_all_%'
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- S'assurer que la RLS est bien active partout
alter table public.users        enable row level security;
alter table public.boards       enable row level security;
alter table public.elements     enable row level security;
alter table public.sub_elements enable row level security;
alter table public.comments     enable row level security;

-- Nettoyage : l'ancien système de mot de passe maison est obsolète
-- (à décommenter une fois la bascule validée et le code nettoyé) :
-- alter table public.users drop column if exists password_hash;

-- ============================================================
-- VÉRIFICATION (plus aucune policy `anon` ne doit subsister) :
--   select tablename, policyname, roles, cmd
--   from pg_policies where schemaname='public' order by tablename;
-- Test : une requête SANS token doit désormais renvoyer [] / 401.
-- ============================================================
