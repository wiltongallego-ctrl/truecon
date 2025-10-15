-- Adicionar coluna is_first na tabela user_phase1_checkins
-- Esta coluna indica se é a primeira vez que o usuário completa a fase 1

ALTER TABLE public.user_phase1_checkins 
ADD COLUMN is_first BOOLEAN DEFAULT TRUE;

-- Comentário na coluna para documentação
COMMENT ON COLUMN public.user_phase1_checkins.is_first IS 'Indica se é a primeira vez que o usuário completa a fase 1. Usado para controlar a exibição do balão de informação.';