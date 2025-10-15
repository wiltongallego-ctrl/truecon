-- Inserir as 7 fases fixas do TrueCon 2025
INSERT INTO public.phases (
  phase_number,
  title,
  description,
  objective,
  points_type,
  start_date,
  end_date,
  is_active,
  display_order
) VALUES
  (
    1,
    'Onboarding + Check-in diário',
    'Cadastro, perfil completo, primeiros pontos com streak de check-in',
    'Cadastro, perfil completo, primeiros pontos com streak de check-in',
    'individual',
    '2025-11-04',
    '2025-11-10',
    false,
    1
  ),
  (
    2,
    'Conheça seu grupo',
    'Liberação dos grupos híbridos + mural exclusivo',
    'Liberação dos grupos híbridos + mural exclusivo',
    'coletivo',
    '2025-11-11',
    '2025-11-17',
    false,
    2
  ),
  (
    3,
    'Personalização do grupo',
    'Nome + foto criativa do grupo',
    'Nome + foto criativa do grupo',
    'coletivo',
    '2025-11-18',
    '2025-11-24',
    false,
    3
  ),
  (
    4,
    'Desafios Surpresa',
    'Missões relâmpago liberadas via push',
    'Missões relâmpago liberadas via push',
    'misto',
    '2025-11-25',
    '2025-12-01',
    false,
    4
  ),
  (
    5,
    'TrueAwards',
    'Liberação da votação oficial',
    'Liberação da votação oficial',
    'individual',
    '2025-12-02',
    '2025-12-03',
    false,
    5
  ),
  (
    6,
    'Presencial + Dinâmicas ao vivo',
    'Quizzes, perguntas para palestrantes, jogos extras',
    'Quizzes, perguntas para palestrantes, jogos extras',
    'misto',
    '2025-12-04',
    '2025-12-06',
    false,
    6
  ),
  (
    7,
    'Feedback & Encerramento',
    'Pesquisa de satisfação + "Replay" de conteúdos',
    'Pesquisa de satisfação + "Replay" de conteúdos',
    'individual',
    '2025-12-09',
    NULL,
    false,
    7
  )
ON CONFLICT DO NOTHING;