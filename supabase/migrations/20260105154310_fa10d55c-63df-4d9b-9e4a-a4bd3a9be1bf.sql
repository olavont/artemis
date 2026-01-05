-- Update audit trigger function to handle Keycloak users
-- For INSERT/UPDATE, try to get user from the record itself if auth.uid() is null
-- For profiles table, use the record's own id as the user

CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id_val uuid;
  user_name_val text;
BEGIN
  -- First try auth.uid() for regular Supabase users
  user_id_val := auth.uid();
  
  -- If null and we're dealing with profiles table, use the record's id
  IF user_id_val IS NULL AND TG_TABLE_NAME = 'profiles' THEN
    IF TG_OP = 'DELETE' THEN
      user_id_val := OLD.id;
    ELSE
      user_id_val := NEW.id;
    END IF;
  END IF;
  
  -- If still null and table has agente_responsavel_id, use that
  IF user_id_val IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      IF TG_TABLE_NAME IN ('protocolos_empenho', 'protocolos_devolucao') THEN
        user_id_val := OLD.agente_responsavel_id;
      END IF;
    ELSE
      IF TG_TABLE_NAME IN ('protocolos_empenho', 'protocolos_devolucao') THEN
        user_id_val := NEW.agente_responsavel_id;
      END IF;
    END IF;
  END IF;
  
  -- Get user name if we have a user_id
  IF user_id_val IS NOT NULL THEN
    SELECT nome INTO user_name_val FROM public.profiles WHERE id = user_id_val;
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, user_name, action, table_name, record_id, new_data)
    VALUES (user_id_val, user_name_val, 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, user_name, action, table_name, record_id, old_data, new_data)
    VALUES (user_id_val, user_name_val, 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, user_name, action, table_name, record_id, old_data)
    VALUES (user_id_val, user_name_val, 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;