-- Fix security warnings

-- Fix search_path for update_profile_timestamp function
CREATE OR REPLACE FUNCTION public.update_profile_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix search_path for log_admin_credentials function
CREATE OR REPLACE FUNCTION public.log_admin_credentials(
  admin_email text,
  admin_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  result := jsonb_build_object(
    'email', admin_email,
    'password', admin_password,
    'message', 'CONSERVEZ CES IDENTIFIANTS DE MANIÈRE SÉCURISÉE',
    'timestamp', now()
  );
  
  RETURN result;
END;
$$;