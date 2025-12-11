-- Create audit log table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid REFERENCES public.profiles(id),
  user_name text,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admin/gestor can view logs
CREATE POLICY "Admin/Gestor pode ver logs de auditoria"
ON public.audit_logs
FOR SELECT
USING (is_admin_or_gestor(auth.uid()));

-- System can insert logs
CREATE POLICY "Sistema pode inserir logs de auditoria"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Create audit function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name_val text;
BEGIN
  -- Get user name
  SELECT nome INTO user_name_val FROM public.profiles WHERE id = auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, user_name, action, table_name, record_id, new_data)
    VALUES (auth.uid(), user_name_val, 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, user_name, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), user_name_val, 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, user_name, action, table_name, record_id, old_data)
    VALUES (auth.uid(), user_name_val, 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers for viaturas
CREATE TRIGGER audit_viaturas
AFTER INSERT OR UPDATE OR DELETE ON public.viaturas
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Create triggers for itens_viatura
CREATE TRIGGER audit_itens_viatura
AFTER INSERT OR UPDATE OR DELETE ON public.itens_viatura
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Create triggers for protocolos_empenho
CREATE TRIGGER audit_protocolos_empenho
AFTER INSERT OR UPDATE OR DELETE ON public.protocolos_empenho
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Create triggers for protocolos_devolucao
CREATE TRIGGER audit_protocolos_devolucao
AFTER INSERT OR UPDATE OR DELETE ON public.protocolos_devolucao
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Create triggers for profiles
CREATE TRIGGER audit_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Create index for better query performance
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);