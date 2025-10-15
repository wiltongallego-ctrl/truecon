-- Criar tabela de posts do mural
CREATE TABLE public.group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de curtidas
CREATE TABLE public.group_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies para group_posts
CREATE POLICY "Users can view posts from their groups"
ON public.group_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_posts.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create posts in their groups"
ON public.group_posts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_posts.group_id
    AND group_members.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Users can update their own posts"
ON public.group_posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON public.group_posts FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies para group_post_likes
CREATE POLICY "Users can view likes from their groups"
ON public.group_post_likes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_posts
    INNER JOIN public.group_members ON group_members.group_id = group_posts.group_id
    WHERE group_posts.id = group_post_likes.post_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create likes in their groups"
ON public.group_post_likes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_posts
    INNER JOIN public.group_members ON group_members.group_id = group_posts.group_id
    WHERE group_posts.id = group_post_likes.post_id
    AND group_members.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Users can delete their own likes"
ON public.group_post_likes FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_group_posts_updated_at
BEFORE UPDATE ON public.group_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_post_likes;