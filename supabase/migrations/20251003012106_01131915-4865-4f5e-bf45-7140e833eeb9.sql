-- Adicionar coluna manager_id na tabela groups
ALTER TABLE public.groups
ADD COLUMN manager_id UUID REFERENCES auth.users(id);

-- Atualizar política de upload de fotos para permitir apenas gestor
DROP POLICY IF EXISTS "Group members can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update group photos" ON storage.objects;

CREATE POLICY "Group managers can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'group-photos'
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.manager_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
);

CREATE POLICY "Group managers can update photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'group-photos'
  AND (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.manager_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
);