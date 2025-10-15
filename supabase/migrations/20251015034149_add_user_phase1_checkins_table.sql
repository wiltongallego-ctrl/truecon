-- Criar tabela para armazenar dados de check-in da Fase 1
CREATE TABLE IF NOT EXISTS public.user_phase1_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    checkin_days JSONB NOT NULL DEFAULT '[]',
    current_cycle INTEGER NOT NULL DEFAULT 1,
    has_completed_first_time BOOLEAN NOT NULL DEFAULT false,
    last_checkin_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Garantir que cada usuário tenha apenas um registro ativo
    UNIQUE(user_id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_phase1_checkins_user_id ON public.user_phase1_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_user_phase1_checkins_start_date ON public.user_phase1_checkins(start_date);
CREATE INDEX IF NOT EXISTS idx_user_phase1_checkins_last_checkin ON public.user_phase1_checkins(last_checkin_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.user_phase1_checkins ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios dados
CREATE POLICY "Users can view own checkin data" ON public.user_phase1_checkins
    FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir que usuários insiram seus próprios dados
CREATE POLICY "Users can insert own checkin data" ON public.user_phase1_checkins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem seus próprios dados
CREATE POLICY "Users can update own checkin data" ON public.user_phase1_checkins
    FOR UPDATE USING (auth.uid() = user_id);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_user_phase1_checkins_updated_at
    BEFORE UPDATE ON public.user_phase1_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();