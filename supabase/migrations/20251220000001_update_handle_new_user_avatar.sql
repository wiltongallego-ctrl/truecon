-- Atualizar função handle_new_user para capturar avatar do EntraID
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avatar_url_value TEXT;
BEGIN
  -- Tentar extrair avatar_url de diferentes fontes
  avatar_url_value := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    (NEW.raw_user_meta_data->'identities'->0->'identity_data'->>'picture')::TEXT
  );

  -- Log para debug (será visível nos logs do Supabase)
  RAISE LOG 'DEBUG handle_new_user - User ID: %, Email: %, Raw metadata: %, Avatar URL: %', 
    NEW.id, NEW.email, NEW.raw_user_meta_data, avatar_url_value;

  INSERT INTO public.profiles (user_id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    avatar_url_value
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;