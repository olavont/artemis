-- Adicionar novos valores ao enum situacao_item
ALTER TYPE situacao_item ADD VALUE IF NOT EXISTS 'presente';
ALTER TYPE situacao_item ADD VALUE IF NOT EXISTS 'incompleto';
ALTER TYPE situacao_item ADD VALUE IF NOT EXISTS 'ausente';