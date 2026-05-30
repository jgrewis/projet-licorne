-- ============================================================
-- ÉTAPE 1b — Donner l'accès au rôle `authenticated` (ADDITIF)
-- À exécuter MAINTENANT, après 01_auth_setup.sql.
-- Coexiste avec les policies `anon_all_*` : l'ancienne prod (anon)
-- ET la nouvelle app (authenticated) fonctionnent en parallèle.
-- La fermeture du trou (drop anon) se fait à l'étape 2, à la bascule.
-- ============================================================

-- Données projet : lecture + écriture pour les utilisateurs authentifiés
do $$ declare t text; begin
  foreach t in array array['boards','elements','sub_elements','comments'] loop
    execute format(
      'create policy auth_rw_%1$s on public.%1$I
         for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Table users : lecture pour tout authentifié (noms, avatars, assignations)
create policy users_read on public.users
  for select to authenticated using (true);

-- Écriture users : admin uniquement, + chacun peut éditer son propre profil
create policy users_admin_write on public.users
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy users_self_update on public.users
  for update to authenticated
  using (auth_id = auth.uid()) with check (auth_id = auth.uid());

-- ============================================================
-- Vérif : un utilisateur connecté doit maintenant lire les données.
--   select tablename, policyname, roles, cmd
--   from pg_policies where schemaname='public' order by tablename, roles;
-- ============================================================
