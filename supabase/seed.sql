-- ========================================
-- SEED : Configuration initiale sécurisée
-- ========================================
-- Ce fichier initialise l'application avec un super-admin unique
-- Les identifiants doivent être définis via variables d'environnement

-- Fonction pour créer le super-admin au premier démarrage
CREATE OR REPLACE FUNCTION public.create_super_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_email text := COALESCE(current_setting('app.seed_admin_email', true), 'admin@epil-inv.local');
  admin_password text := COALESCE(current_setting('app.seed_admin_password', true), 'ChangeMe123!@#');
  admin_user_id uuid;
BEGIN
  -- Vérifier si un admin existe déjà
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RAISE NOTICE 'Un administrateur existe déjà. Création annulée.';
    RETURN;
  END IF;

  -- Créer l'utilisateur admin dans auth.users
  -- Note: Cette partie doit être adaptée selon votre configuration Supabase
  -- En production, l'admin doit être créé manuellement via Supabase Auth
  
  RAISE NOTICE 'IMPORTANT: Créez manuellement le compte admin avec ces identifiants:';
  RAISE NOTICE 'Email: %', admin_email;
  RAISE NOTICE 'Password: %', admin_password;
  RAISE NOTICE 'Puis assignez le rôle admin via la table user_roles';
END;
$$;

-- Appeler la fonction de seed (commenté par défaut pour éviter les erreurs)
-- SELECT public.create_super_admin();

-- ========================================
-- IMPORTANT: Instructions de création du super-admin
-- ========================================
-- 
-- Pour créer le super-admin, suivez ces étapes :
-- 
-- 1. Connectez-vous à votre dashboard Supabase
-- 2. Allez dans Authentication > Users
-- 3. Créez un nouvel utilisateur avec :
--    Email: admin@epil-inv.local (ou votre email)
--    Password: Un mot de passe fort
-- 4. Notez l'UUID de l'utilisateur créé
-- 5. Exécutez cette requête SQL en remplaçant {USER_UUID} :
--
--    INSERT INTO public.user_roles (user_id, role)
--    VALUES ('{USER_UUID}', 'admin');
--
-- ========================================
