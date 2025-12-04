-- Adicionar campo de nome do agente (texto livre) nas tabelas de protocolo
ALTER TABLE public.protocolos_empenho 
ADD COLUMN nome_agente TEXT;

ALTER TABLE public.protocolos_devolucao 
ADD COLUMN nome_agente TEXT;