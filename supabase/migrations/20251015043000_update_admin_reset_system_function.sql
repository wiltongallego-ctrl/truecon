-- Atualizar função RPC admin_reset_system para cumprir exigência de WHERE
CREATE OR REPLACE FUNCTION public.admin_reset_system()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Permitir apenas admins
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem resetar o sistema';
  END IF;

  -- Apagar progresso de fases (com WHERE universal)
  DELETE FROM public.user_phase_progress WHERE TRUE;

  -- Apagar check-ins da Fase 1
  DELETE FROM public.user_phase1_checkins WHERE TRUE;

  -- Apagar grupos (cascateia posts, likes, replies e membros)
  DELETE FROM public.groups WHERE TRUE;

  -- Zerar XP e último check-in de perfis
  UPDATE public.profiles
  SET total_xp = 0,
      last_checkin_at = NULL
  WHERE TRUE;

  -- Desativar todas as fases
  UPDATE public.phases
  SET is_active = false
  WHERE TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reset_system() TO authenticated;