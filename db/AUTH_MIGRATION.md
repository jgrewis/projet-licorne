# Migration vers Supabase Auth — Runbook

Objectif : remplacer l'« auth » maison (hash SHA-256 exposé au client, vérif côté
navigateur) par une vraie authentification Supabase (JWT) avec RLS appliquée côté
serveur. Séquencé pour **ne jamais casser la prod**.

## Ordre des opérations (important)

| # | Acteur | Action | Risque |
|---|--------|--------|--------|
| 1 | **Toi** | Exécuter `db/01_auth_setup.sql` (auth_id, trigger, helpers) | Aucun (additif) |
| 1b | **Toi** | Exécuter `db/01b_authenticated_policies.sql` (accès rôle `authenticated`, coexiste avec anon) | Aucun (additif) |
| 2 | **Toi** | Auth > Providers > Email : activer Email, **désactiver « Confirm email »** | Aucun |
| 3 | **Toi** | Renseigner les emails des profils existants (voir bas de `01_auth_setup.sql`) | Aucun |
| 4 | **Toi** | Auth > Users > Add user : créer 1 compte par personne, **même email** que le profil. Le trigger lie `auth_id` automatiquement | Aucun |
| 5 | **Moi** | Merger `feat/supabase-auth` → déployer (login email+mdp, session JWT) | Faible — anon ET authenticated marchent |
| 6 | **Nous** | Tester : login avec un compte réel, vérifier CRUD | — |
| 7 | **Toi** | Exécuter `db/02_rls_cutover.sql` (retire l'accès anon → ferme le trou) | **Bascule** — après 6 OK |
| 8 | **Moi** | Décommenter le `drop column password_hash` + retirer `crypto.ts`/`PasswordManager` | Nettoyage |

> ⚠️ Important (découvert en test live) : les policies `anon_all_*` sont `TO anon`
> seulement. Sans l'étape **1b**, un utilisateur connecté (rôle `authenticated`)
> ne voit **aucune** donnée. 1b est donc obligatoire avant le déploiement.

## Vérifications

Après l'étape 4, vérifier la liaison :
```sql
select name, email, role, auth_id is not null as lie
from public.users order by name;
```

Après l'étape 7, vérifier les policies :
```sql
select tablename, policyname, roles, cmd
from pg_policies where schemaname='public' order by tablename;
```

## Rollback (si l'étape 7 pose problème)
Réexécuter le DO-loop permissif d'origine pour rouvrir temporairement :
```sql
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('create policy anon_all_%s on public.%I for all to anon using (true) with check (true)', t, t);
  end loop;
end $$;
```

## Note sécurité
Une fois Supabase Auth en place, les mots de passe sont gérés par Supabase
(hash bcrypt salé côté serveur, jamais exposés). Le système maison
(`password_hash` SHA-256 + `crypto.ts`) devient obsolète et est supprimé à l'étape 8.
