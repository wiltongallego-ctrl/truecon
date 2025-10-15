-- Atualizar função RPC admin_reset_system para limpar TODAS as tabelas de controle
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

  -- Apagar dados de grupos (cascateia posts, likes, replies e membros)
  DELETE FROM public.group_post_replies WHERE TRUE;
  DELETE FROM public.group_post_likes WHERE TRUE;
  DELETE FROM public.group_posts WHERE TRUE;
  DELETE FROM public.group_members WHERE TRUE;
  DELETE FROM public.groups WHERE TRUE;

  -- Apagar progresso de fases
  DELETE FROM public.user_phase_progress WHERE TRUE;

  -- Apagar check-ins da Fase 1
  DELETE FROM public.user_phase1_checkins WHERE TRUE;

  -- Apagar roles de usuários (exceto admins para manter acesso)
  DELETE FROM public.user_roles WHERE role != 'admin';

  -- Zerar XP e último check-in de perfis
  UPDATE public.profiles
  SET total_xp = 0,
      last_checkin_at = NULL
  WHERE TRUE;

  -- Desativar todas as fases
  UPDATE public.phases
  SET is_active = false
  WHERE TRUE;

  -- Log da operação
  RAISE NOTICE 'Sistema resetado completamente. Todas as tabelas de controle foram limpas.';
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reset_system() TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION public.admin_reset_system() IS 'Função para reset completo do sistema, limpando todas as tabelas de controle: grupos, posts, likes, replies, membros, progresso de fases, check-ins, roles (exceto admins), zerando XP e desativando fases.';