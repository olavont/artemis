-- Add km_inicial column to viaturas table
ALTER TABLE public.viaturas ADD COLUMN km_inicial integer DEFAULT 0;