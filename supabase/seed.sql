-- Seed data para popular o ranking com usuários fictícios
-- Este arquivo será executado após as migrações

-- Primeiro, inserir usuários fictícios na tabela auth.users
-- Nota: Isso é apenas para demonstração do ranking
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  is_sso_user
) VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'ana.silva@exemplo.com',
    '$2a$10$example.hash.for.password123',
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Ana Silva"}',
    FALSE,
    FALSE
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'carlos.santos@exemplo.com',
    '$2a$10$example.hash.for.password123',
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Carlos Santos"}',
    FALSE,
    FALSE
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'maria.oliveira@exemplo.com',
    '$2a$10$example.hash.for.password123',
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Maria Oliveira"}',
    FALSE,
    FALSE
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'joao.pereira@exemplo.com',
    '$2a$10$example.hash.for.password123',
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "João Pereira"}',
    FALSE,
    FALSE
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'lucia.costa@exemplo.com',
    '$2a$10$example.hash.for.password123',
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Lúcia Costa"}',
    FALSE,
    FALSE
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'pedro.almeida@exemplo.com',
    '$2a$10$example.hash.for.password123',
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Pedro Almeida"}',
    FALSE,
    FALSE
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'fernanda.lima@exemplo.com',
    '$2a$10$example.hash.for.password123',
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Fernanda Lima"}',
    FALSE,
    FALSE
  ),
  (
    '88888888-8888-8888-8888-888888888888',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'ricardo.souza@exemplo.com',
    '$2a$10$example.hash.for.password123',
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Ricardo Souza"}',
    FALSE,
    FALSE
  )
ON CONFLICT (id) DO NOTHING;

-- Inserir perfis fictícios com diferentes níveis de XP para demonstrar o ranking
-- Usando UUIDs únicos para evitar conflitos
INSERT INTO public.profiles (user_id, email, name, total_xp, created_at, updated_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'ana.silva@exemplo.com', 'Ana Silva', 250, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'carlos.santos@exemplo.com', 'Carlos Santos', 180, NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'maria.oliveira@exemplo.com', 'Maria Oliveira', 320, NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'joao.pereira@exemplo.com', 'João Pereira', 95, NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', 'lucia.costa@exemplo.com', 'Lúcia Costa', 150, NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666666', 'pedro.almeida@exemplo.com', 'Pedro Almeida', 75, NOW(), NOW()),
  ('77777777-7777-7777-7777-777777777777', 'fernanda.lima@exemplo.com', 'Fernanda Lima', 200, NOW(), NOW()),
  ('88888888-8888-8888-8888-888888888888', 'ricardo.souza@exemplo.com', 'Ricardo Souza', 130, NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- Inserir roles de usuário para os perfis fictícios
INSERT INTO public.user_roles (user_id, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'user'),
  ('22222222-2222-2222-2222-222222222222', 'user'),
  ('33333333-3333-3333-3333-333333333333', 'user'),
  ('44444444-4444-4444-4444-444444444444', 'user'),
  ('55555555-5555-5555-5555-555555555555', 'user'),
  ('66666666-6666-6666-6666-666666666666', 'user'),
  ('77777777-7777-7777-7777-777777777777', 'user'),
  ('88888888-8888-8888-8888-888888888888', 'user')
ON CONFLICT (user_id, role) DO NOTHING;