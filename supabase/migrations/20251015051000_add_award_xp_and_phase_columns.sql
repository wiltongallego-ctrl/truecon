-- Ensure phases has xp_reward and allow_completion_after_deadline
ALTER TABLE public.phases
  ADD COLUMN IF NOT EXISTS xp_reward INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS allow_completion_after_deadline BOOLEAN NOT NULL DEFAULT false;

-- Seed reasonable defaults only when xp_reward is currently NULL (older databases)
UPDATE public.phases SET xp_reward = 0 WHERE phase_number = 1 AND xp_reward IS NULL;
UPDATE public.phases SET xp_reward = 25 WHERE phase_number = 2 AND xp_reward IS NULL;
UPDATE public.phases SET xp_reward = 50 WHERE phase_number = 3 AND xp_reward IS NULL;

-- Atomic XP award function with RLS-conscious checks
CREATE OR REPLACE FUNCTION public.award_xp(target_user UUID, amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF amount IS NULL OR amount <= 0 THEN
    RAISE EXCEPTION 'amount inválido para award_xp: %', amount;
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> target_user THEN
    RAISE EXCEPTION 'Acesso negado: usuário não pode premiar XP para outro perfil';
  END IF;

  UPDATE public.profiles
  SET total_xp = COALESCE(total_xp, 0) + amount
  WHERE user_id = target_user;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_xp(UUID, INTEGER) TO authenticated;