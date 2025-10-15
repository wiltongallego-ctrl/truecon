import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/sweetAlert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Trash2, Send, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Reply {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    name: string | null;
    email: string | null;
  };
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    name: string | null;
    email: string | null;
  };
  likes_count: number;
  user_liked: boolean;
  replies_count: number;
  replies?: Reply[];
}

interface GroupWallProps {
  groupId: string;
  currentUserId: string;
}

const GroupWall = ({ groupId, currentUserId }: GroupWallProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPosts();
    
    // Configurar realtime para posts
    const channel = supabase
      .channel(`group-wall-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_posts',
          filter: `group_id=eq.${groupId}`
        },
        () => {
          fetchPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_post_likes'
        },
        () => {
          fetchPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_post_replies'
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const fetchPosts = async () => {
    // Buscar posts
    const { data: postsData, error: postsError } = await supabase
      .from("group_posts")
      .select("id, content, created_at, user_id")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Erro ao carregar posts:", postsError);
      return;
    }

    if (!postsData || postsData.length === 0) {
      setPosts([]);
      return;
    }

    // Buscar perfis dos autores
    const userIds = postsData.map(p => p.user_id);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, name, email")
      .in("user_id", userIds);

    // Criar mapa de perfis
    const profilesMap = new Map(
      (profilesData || []).map(p => [p.user_id, p])
    );

    // Buscar curtidas e replies para cada post
    const postsWithData = await Promise.all(
      postsData.map(async (post) => {
        const { count } = await supabase
          .from("group_post_likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        const { data: userLike } = await supabase
          .from("group_post_likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", currentUserId)
          .maybeSingle();

        const { count: repliesCount } = await supabase
          .from("group_post_replies")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        const profile = profilesMap.get(post.user_id);

        return {
          ...post,
          profiles: profile || { name: null, email: null },
          likes_count: count || 0,
          user_liked: !!userLike,
          replies_count: repliesCount || 0,
        };
      })
    );

    setPosts(postsWithData);
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) {
      toast.error("Digite algo antes de postar");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("group_posts").insert([
      {
        group_id: groupId,
        user_id: currentUserId,
        content: newPost.trim(),
      },
    ]);

    if (error) {
      toast.error("Erro ao criar post");
      setLoading(false);
      return;
    }

    setNewPost("");
    setLoading(false);
    toast.success("Post criado com sucesso!");
  };

  const handleToggleLike = async (postId: string, isLiked: boolean) => {
    if (isLiked) {
      // Remover curtida
      const { error } = await supabase
        .from("group_post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", currentUserId);

      if (error) {
        toast.error("Erro ao remover curtida");
        return;
      }
    } else {
      // Adicionar curtida
      const { error } = await supabase
        .from("group_post_likes")
        .insert([{ post_id: postId, user_id: currentUserId }]);

      if (error) {
        toast.error("Erro ao curtir post");
        return;
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Tem certeza que deseja excluir este post?")) return;

    const { error } = await supabase
      .from("group_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      toast.error("Erro ao excluir post");
      return;
    }

    toast.success("Post excluído com sucesso");
  };

  const toggleExpandPost = async (postId: string) => {
    const newExpanded = new Set(expandedPosts);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
      // Buscar replies quando expandir
      await fetchReplies(postId);
    }
    setExpandedPosts(newExpanded);
  };

  const fetchReplies = async (postId: string) => {
    const { data: repliesData } = await supabase
      .from("group_post_replies")
      .select("id, content, created_at, user_id")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!repliesData) return;

    // Buscar perfis dos autores das respostas
    const userIds = repliesData.map(r => r.user_id);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, name, email")
      .in("user_id", userIds);

    const profilesMap = new Map(
      (profilesData || []).map(p => [p.user_id, p])
    );

    const repliesWithProfiles = repliesData.map(reply => ({
      ...reply,
      profiles: profilesMap.get(reply.user_id) || { name: null, email: null }
    }));

    // Atualizar o post com as replies
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, replies: repliesWithProfiles }
          : post
      )
    );
  };

  const handleCreateReply = async (postId: string) => {
    const content = replyContent[postId]?.trim();
    if (!content) {
      toast.error("Digite algo antes de responder");
      return;
    }

    const { error } = await supabase
      .from("group_post_replies")
      .insert([{
        post_id: postId,
        user_id: currentUserId,
        content
      }]);

    if (error) {
      toast.error("Erro ao criar resposta");
      return;
    }

    setReplyContent({ ...replyContent, [postId]: "" });
    toast.success("Resposta publicada!");
    await fetchReplies(postId);
  };

  const handleDeleteReply = async (replyId: string, postId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta resposta?")) return;

    const { error } = await supabase
      .from("group_post_replies")
      .delete()
      .eq("id", replyId);

    if (error) {
      toast.error("Erro ao excluir resposta");
      return;
    }

    toast.success("Resposta excluída com sucesso");
    await fetchReplies(postId);
  };

  return (
    <div className="space-y-4">
      {/* Formulário para novo post */}
      <Card className="p-4">
        <Textarea
          placeholder="Escreva sua mensagem de apresentação ou compartilhe algo com o grupo..."
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          rows={3}
          className="mb-3"
        />
        <Button
          onClick={handleCreatePost}
          disabled={loading || !newPost.trim()}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          Publicar
        </Button>
      </Card>

      {/* Lista de posts */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            Nenhuma mensagem ainda. Seja o primeiro a se apresentar! 👋
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>
                    {post.profiles?.name?.[0]?.toUpperCase() || 
                     post.profiles?.email?.[0]?.toUpperCase() || 
                     "?"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">
                        {post.profiles?.name || "Usuário"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    
                    {post.user_id === currentUserId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-sm mb-3 whitespace-pre-wrap">{post.content}</p>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 ${post.user_liked ? "text-red-500" : ""}`}
                      onClick={() => handleToggleLike(post.id, post.user_liked)}
                    >
                      <Heart
                        className={`h-4 w-4 mr-1 ${
                          post.user_liked ? "fill-current" : ""
                        }`}
                      />
                      {post.likes_count > 0 && (
                        <span className="text-xs">{post.likes_count}</span>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => toggleExpandPost(post.id)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {post.replies_count > 0 && (
                        <span className="text-xs">{post.replies_count}</span>
                      )}
                    </Button>
                  </div>

                  {/* Seção de respostas */}
                  {expandedPosts.has(post.id) && (
                    <div className="mt-4 space-y-3 pl-4 border-l-2 border-border">
                      {/* Lista de respostas */}
                      {post.replies && post.replies.length > 0 && (
                        <div className="space-y-2">
                          {post.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-2 text-sm">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {reply.profiles?.name?.[0]?.toUpperCase() || 
                                   reply.profiles?.email?.[0]?.toUpperCase() || 
                                   "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-xs">
                                    {reply.profiles?.name || "Usuário"}
                                  </p>
                                  {reply.user_id === currentUserId && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleDeleteReply(reply.id, post.id)}
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(reply.created_at), {
                                    addSuffix: true,
                                    locale: ptBR,
                                  })}
                                </p>
                                <p className="text-sm mt-1">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Formulário para nova resposta */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Escreva uma resposta..."
                          value={replyContent[post.id] || ""}
                          onChange={(e) => setReplyContent({
                            ...replyContent,
                            [post.id]: e.target.value
                          })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleCreateReply(post.id);
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleCreateReply(post.id)}
                          disabled={!replyContent[post.id]?.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default GroupWall;
