-- Função RPC segura para resetar todos os check-ins da Fase 1
-- Usa SECURITY DEFINER para contornar RLS com validação de admin
CREATE OR REPLACE FUNCTION public.admin_reset_phase1_checkins()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Garantir que apenas admin execute
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem executar este reset';
  END IF;

  -- Apagar todos os registros de check-in
  DELETE FROM public.user_phase1_checkins
  WHERE id <> '00000000-0000-0000-0000-000000000000';

  -- Zerar indicador de último check-in em perfis
  UPDATE public.profiles
  SET last_checkin_at = NULL
  WHERE user_id <> '00000000-0000-0000-0000-000000000000';
END;
$$;

-- Conceder permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION public.admin_reset_phase1_checkins() TO authenticated;