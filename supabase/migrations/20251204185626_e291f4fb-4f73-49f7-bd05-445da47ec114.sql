-- Add km_atual column to viaturas table
ALTER TABLE public.viaturas ADD COLUMN km_atual integer DEFAULT 0;

-- Initialize km_atual with km_inicial value for existing records
UPDATE public.viaturas SET km_atual = km_inicial WHERE km_atual IS NULL OR km_atual = 0;