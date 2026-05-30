-- ============================================================
-- Durcissement sécurité — Projet Licorne
-- À exécuter dans Supabase > SQL Editor APRÈS migration vers Supabase Auth.
-- ============================================================
-- État actuel : policies anon `USING(true) WITH CHECK(true)` = base ouverte
-- à tous. Tant qu'on n'authentifie pas via un vrai JWT, RLS ne peut pas
-- distinguer les utilisateurs. La vraie correction = Supabase Auth.
-- Ce fichier documente la cible une fois l'auth en place.
-- ============================================================

-- 1) Supprimer les policies permissives anon (la faille)
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname='public' AND policyname LIKE 'anon_all_%' LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 2) Lecture réservée aux utilisateurs authentifiés
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE format('CREATE POLICY auth_read_%s ON public.%I FOR SELECT TO authenticated USING (true)', t, t);
  END LOOP;
END $$;

-- 3) Écriture (INSERT/UPDATE/DELETE) réservée aux authentifiés
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE format('CREATE POLICY auth_write_%s ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- 4) (Recommandé) Restreindre la gestion des users au rôle admin.
--    Suppose une table profiles(id=auth.uid(), role). À adapter.
-- CREATE POLICY admin_manage_users ON public.users FOR ALL TO authenticated
--   USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
--   WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- ⚠️ NE PAS exécuter tant que l'app utilise la clé anon sans login :
--    cela couperait toutes les requêtes. Migrer l'auth d'abord.
