-- Criar bucket para fotos de grupos
INSERT INTO storage.buckets (id, name, public)
VALUES ('group-photos', 'group-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies para group-photos bucket
CREATE POLICY "Anyone can view group photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'group-photos');

CREATE POLICY "Group members can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'group-photos'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Admins can update group photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'group-photos'
  AND (
    auth.uid() IS NOT NULL
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
);

CREATE POLICY "Admins can delete group photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'group-photos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);