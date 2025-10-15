-- Adicionar campo para permitir conclusão após vencimento sem pontos
ALTER TABLE public.phases 
ADD COLUMN allow_completion_after_deadline BOOLEAN DEFAULT false;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.phases.allow_completion_after_deadline IS 'Permite que a fase seja concluída após o prazo de vencimento, mas sem conceder pontos ao usuário';

-- Definir valores padrão para as fases existentes
-- Por padrão, todas as fases não permitem conclusão após vencimento
UPDATE public.phases 
SET allow_completion_after_deadline = false 
WHERE allow_completion_after_deadline IS NULL;