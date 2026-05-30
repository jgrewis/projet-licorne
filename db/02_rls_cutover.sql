-- ============================================================
-- ÉTAPE 2 — Fermeture de la RLS (BASCULE / CUTOVER)
-- À exécuter SEULEMENT quand :
--   (a) l'app déployée utilise déjà le login Supabase Auth
--       (branche feat/supabase-auth mergée + déployée), ET
--   (b) au moins un compte admin Auth est créé et testé.
-- ⚠️ Avant ça, exécuter ce script COUPERAIT l'app (rôle anon).
-- ============================================================

-- 1) Supprimer les policies permissives anon (la faille)
do $$ declare r record; begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname='public' and policyname like 'anon_all_%'
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- 2) Activer RLS sur toutes les tables métier
alter table public.users        enable row level security;
alter table public.boards       enable row level security;
alter table public.elements     enable row level security;
alter table public.sub_elements enable row level security;
alter table public.comments     enable row level security;

-- 3) Données projet : lecture + écriture réservées aux utilisateurs authentifiés
do $$ declare t text; begin
  foreach t in array array['boards','elements','sub_elements','comments']
  loop
    execute format(
      'create policy auth_rw_%1$s on public.%1$I
         for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- 4) Table users :
--    - lecture : tout utilisateur authentifié (besoin des noms/avatars/assignations)
--    - écriture (insert/update/delete) : admin uniquement
--    - chaque utilisateur peut mettre à jour SON propre profil
create policy users_read on public.users
  for select to authenticated using (true);

create policy users_admin_write on public.users
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy users_self_update on public.users
  for update to authenticated
  using (auth_id = auth.uid()) with check (auth_id = auth.uid());

-- 5) Nettoyage : l'ancien système de mot de passe maison n'a plus lieu d'être.
--    (À exécuter une fois la bascule validée.)
-- alter table public.users drop column if exists password_hash;

-- ============================================================
-- VÉRIFICATION
--   select tablename, policyname, roles, cmd
--   from pg_policies where schemaname='public' order by tablename;
-- ============================================================
