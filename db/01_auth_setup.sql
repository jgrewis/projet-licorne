-- ============================================================
-- ÉTAPE 1 — Mise en place de l'auth Supabase (NON DESTRUCTIF)
-- À exécuter MAINTENANT dans Supabase > SQL Editor.
-- Ne casse pas l'app : tout est additif. La RLS reste ouverte
-- jusqu'à l'étape 2 (02_rls_cutover.sql), exécutée à la bascule.
-- ============================================================

-- 1) Lier chaque profil public.users à un compte auth.users.
--    On NE touche PAS à users.id (référencé par des FK partout).
alter table public.users
  add column if not exists auth_id uuid unique references auth.users(id) on delete set null;

alter table public.users
  add column if not exists email text unique;

-- 2) Liaison automatique : quand un compte Auth est créé (dashboard ou signup),
--    on rattache le profil existant qui a le même email. Si aucun profil
--    n'existe, on en crée un minimal (modifiable ensuite dans l'app).
create or replace function public.link_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
     set auth_id = new.id
   where email = new.email
     and auth_id is null;

  if not found then
    insert into public.users (name, initials, color, role, email, auth_id)
    values (
      coalesce(split_part(new.email, '@', 1), 'Utilisateur'),
      upper(left(coalesce(split_part(new.email, '@', 1), 'U'), 2)),
      '#4169e1',
      'user',
      new.email,
      new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.link_auth_user();

-- 3) Helpers RLS (utilisés à l'étape 2). SECURITY DEFINER pour lire users
--    sans dépendre des policies de la table elle-même.
create or replace function public.current_profile_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.users where auth_id = auth.uid() limit 1;
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where auth_id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- APRÈS cette étape :
--   • Authentication > Providers > Email : activer "Email".
--   • Authentication > Providers > Email : DÉSACTIVER "Confirm email"
--     (outil interne, pas de SMTP requis), sinon configurer un SMTP.
--   • Authentication > Users > Add user : créer un compte pour chaque
--     personne AVEC LE MÊME EMAIL que celui renseigné dans public.users.
--     Le trigger rattache automatiquement auth_id.
--   • Pour les 3 profils de démo, renseigner d'abord leur email :
--       update public.users set email = 'jp@licorne.local'    where name = 'Jean-Philippe';
--       update public.users set email = 'marie@licorne.local' where name = 'Marie Dupont';
--       update public.users set email = 'luc@licorne.local'   where name = 'Luc Martin';
--     puis créer les comptes Auth correspondants (même emails).
-- ============================================================
