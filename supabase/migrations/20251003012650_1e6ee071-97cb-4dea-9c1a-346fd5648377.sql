-- Criar tabela de respostas dos posts
CREATE TABLE public.group_post_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_post_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies para group_post_replies
CREATE POLICY "Users can view replies from their groups"
ON public.group_post_replies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_posts
    INNER JOIN public.group_members ON group_members.group_id = group_posts.group_id
    WHERE group_posts.id = group_post_replies.post_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create replies in their groups"
ON public.group_post_replies FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_posts
    INNER JOIN public.group_members ON group_members.group_id = group_posts.group_id
    WHERE group_posts.id = group_post_replies.post_id
    AND group_members.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Users can update their own replies"
ON public.group_post_replies FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies"
ON public.group_post_replies FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_group_post_replies_updated_at
BEFORE UPDATE ON public.group_post_replies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para replies
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_post_replies;