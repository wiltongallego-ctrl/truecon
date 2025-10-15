-- Adicionar campo xp_reward na tabela phases
ALTER TABLE phases ADD COLUMN xp_reward INTEGER DEFAULT 0;

-- Definir valores padrão de XP baseados nos valores atuais hardcoded
-- Fase 1: Check-ins diários (10 XP por check-in, não tem XP fixo de conclusão)
UPDATE phases SET xp_reward = 0 WHERE phase_number = 1;

-- Fase 2: Trabalho em equipe (não tem XP fixo de conclusão no código atual)
UPDATE phases SET xp_reward = 0 WHERE phase_number = 2;

-- Fase 3: Criatividade (50 XP fixo)
UPDATE phases SET xp_reward = 50 WHERE phase_number = 3;

-- Fase 4: Desafio surpresa (usa roleta, 0-100 XP variável)
UPDATE phases SET xp_reward = 0 WHERE phase_number = 4;

-- Fases 5 e 6: Definir valores padrão (não encontrados no código)
UPDATE phases SET xp_reward = 25 WHERE phase_number = 5;
UPDATE phases SET xp_reward = 25 WHERE phase_number = 6;

-- Adicionar comentário na coluna
COMMENT ON COLUMN phases.xp_reward IS 'XP fixo concedido ao completar a fase (0 para fases com XP variável como roleta ou check-ins)';