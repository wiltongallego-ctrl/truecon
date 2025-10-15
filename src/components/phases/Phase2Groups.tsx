import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Users, Crown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import GroupWall from "@/components/GroupWall";
import GroupPhotoUpload from "@/components/GroupPhotoUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Group {
  id: string;
  name: string;
  photo_url: string | null;
  manager_id: string | null;
}

interface GroupMember {
  profiles: {
    name: string | null;
    email: string | null;
    user_id: string;
  };
  user_id: string;
}

const Phase2Groups = () => {
  const navigate = useNavigate();
  const [userGroup, setUserGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        await fetchUserGroup(user.id);
      }
    };
    init();
  }, []);

  const fetchUserGroup = async (userId: string) => {

    // Buscar grupo do usuário
    const { data: memberData, error: memberError } = await supabase
      .from("group_members")
      .select("group_id, groups(id, name, photo_url, manager_id)")
      .eq("user_id", userId)
      .single();

    if (memberError || !memberData) {
      setLoading(false);
      return;
    }

    const group = memberData.groups as unknown as Group;
    setUserGroup(group);

    // Buscar IDs dos membros do grupo
    const { data: memberIds, error: membersError } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", group.id);

    if (!membersError && memberIds) {
      // Buscar perfis dos membros
      const userIds = memberIds.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("name, email, user_id")
        .in("user_id", userIds);
      
      if (profiles) {
        setGroupMembers(profiles.map(p => ({ 
          profiles: p,
          user_id: p.user_id
        })));
      }
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto p-5">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/home")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Fase 2: Grupos Híbridos</h1>
            <p className="text-sm text-muted-foreground">Conheça seu grupo</p>
          </div>
        </div>

        <div className="space-y-4">
          {!userGroup ? (
            <Card className="p-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Aguardando Grupo</h2>
                  <p className="text-sm text-muted-foreground">
                    Você ainda não foi adicionado a um grupo. Aguarde a organização dos grupos pelos administradores.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <>
              <Tabs defaultValue="members" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="members">Membros</TabsTrigger>
                  <TabsTrigger value="wall">Mural</TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="space-y-4 mt-4">
                  {/* Foto do Grupo - será adicionada na Fase 3 */}
                  {userGroup.photo_url && (
                    <Card className="p-4">
                      <div className="flex justify-center">
                        <img
                          src={userGroup.photo_url}
                          alt="Foto do grupo"
                          className="w-full max-w-sm rounded-lg object-cover"
                        />
                      </div>
                    </Card>
                  )}

                  <Card className="p-6">
                    <div className="flex flex-col gap-4">
                      <div className="text-center">
                        <h2 className="text-xl font-semibold mb-2">Sua Equipe</h2>
                        <p className="text-sm text-muted-foreground">
                          {groupMembers.length} membros
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          O nome será definido na Fase 3
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Membros do grupo */}
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Membros do Grupo</h3>
                    <div className="space-y-6">
                      {/* Gerente */}
                      {(() => {
                        const manager = groupMembers.find(m => m.user_id === userGroup.manager_id);
                        if (!manager) return null;
                        
                        return (
                          <div className="pb-4 border-b">
                            <p className="text-xs font-medium text-muted-foreground mb-3">Gerente</p>
                            <div className="flex flex-col items-center gap-2">
                              <div className="relative">
                                <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 h-6 w-6 text-warning" />
                                <Avatar className="h-16 w-16">
                                  <AvatarFallback className="text-lg">
                                    {manager.profiles.name?.[0]?.toUpperCase() || manager.profiles.email?.[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                              <div className="text-center">
                                <p className="font-medium">{manager.profiles.name || "Sem nome"}</p>
                                <p className="text-xs text-muted-foreground">{manager.profiles.email}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Liderados em grade 3x3 */}
                      {(() => {
                        const followers = groupMembers.filter(m => m.user_id !== userGroup.manager_id);
                        if (followers.length === 0) return null;
                        
                        return (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-3">Liderados</p>
                            <div className="grid grid-cols-3 gap-4">
                              {followers.map((member, index) => (
                                <div key={index} className="flex flex-col items-center gap-2">
                                  <Avatar className="h-12 w-12">
                                    <AvatarFallback>
                                      {member.profiles.name?.[0]?.toUpperCase() || member.profiles.email?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="text-center">
                                    <p className="text-xs font-medium truncate w-full">{member.profiles.name || "Sem nome"}</p>
                                    <p className="text-[10px] text-muted-foreground truncate w-full">{member.profiles.email}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Objetivos desta fase</h3>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      <li>• Se apresentar no mural do grupo</li>
                      <li>• Interagir com pelo menos 3 membros</li>
                      <li>• Ganhar pontos coletivos com seu grupo</li>
                    </ul>
                  </Card>
                </TabsContent>

                <TabsContent value="wall" className="mt-4">
                  {currentUserId && userGroup && (
                    <GroupWall groupId={userGroup.id} currentUserId={currentUserId} />
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Phase2Groups;
