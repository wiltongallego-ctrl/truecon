-- Adicionar coluna para rastrear último check-in
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_checkin_at TIMESTAMP WITH TIME ZONE;