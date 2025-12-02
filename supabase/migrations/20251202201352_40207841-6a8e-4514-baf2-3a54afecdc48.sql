-- Corrigir search_path das funções
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.gerar_numero_protocolo()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  ano TEXT;
  sequencia INTEGER;
  numero TEXT;
BEGIN
  ano := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_protocolo FROM 5 FOR 6) AS INTEGER)), 0) + 1
  INTO sequencia
  FROM public.protocolos_empenho
  WHERE numero_protocolo LIKE ano || '%';
  
  numero := ano || LPAD(sequencia::TEXT, 6, '0');
  
  RETURN numero;
END;
$$;