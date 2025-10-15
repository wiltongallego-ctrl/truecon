-- Função RPC para reset completo do sistema
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

  -- Apagar progresso de fases
  DELETE FROM public.user_phase_progress;

  -- Apagar check-ins da Fase 1
  DELETE FROM public.user_phase1_checkins;

  -- Apagar grupos (cascateia posts, likes, replies e membros)
  DELETE FROM public.groups;

  -- Zerar XP e último check-in de perfis
  UPDATE public.profiles
  SET total_xp = 0,
      last_checkin_at = NULL;

  -- Desativar todas as fases
  UPDATE public.phases
  SET is_active = false;
END;
$$;

-- Permitir execução por usuários autenticados (checagem de admin ocorre dentro da função)
GRANT EXECUTE ON FUNCTION public.admin_reset_system() TO authenticated;