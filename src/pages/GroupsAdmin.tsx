import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "@/lib/sweetAlert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, Users as UsersIcon, Crown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Group {
  id: string;
  name: string;
  photo_url: string | null;
  manager_id: string | null;
  created_at: string;
}

interface Profile {
  user_id: string;
  name: string | null;
  email: string | null;
}

interface GroupMember {
  user_id: string;
  profile: Profile;
}

const GroupsAdmin = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupManager, setNewGroupManager] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<string>("");

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      toast.error("Acesso negado. Você não é um administrador.");
      navigate("/home");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
    fetchGroups();
    fetchProfiles();
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, name, email")
      .order("name");

    if (error) {
      toast.error("Erro ao carregar usuários");
      return;
    }

    setProfiles(data || []);
  };

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .order("created_at");

    if (error) {
      toast.error("Erro ao carregar grupos");
      return;
    }

    setGroups(data || []);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("Digite um nome para o grupo");
      return;
    }

    if (!newGroupManager) {
      toast.error("Selecione um gestor para o grupo");
      return;
    }

    const { error } = await supabase
      .from("groups")
      .insert([{ 
        name: newGroupName,
        manager_id: newGroupManager 
      }]);

    if (error) {
      toast.error("Erro ao criar grupo");
      return;
    }

    toast.success("Grupo criado com sucesso");
    setNewGroupName("");
    setNewGroupManager("");
    fetchGroups();
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este grupo?")) return;

    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir grupo");
      return;
    }

    toast.success("Grupo excluído com sucesso");
    fetchGroups();
  };

  const fetchGroupMembers = async (groupId: string) => {
    const { data, error } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);

    if (error) {
      toast.error("Erro ao carregar membros");
      return;
    }

    const memberIds = data.map((m) => m.user_id);
    setGroupMembers(memberIds);
    
    // Filtrar usuários disponíveis (que não estão no grupo)
    const available = profiles.filter((p) => !memberIds.includes(p.user_id));
    setAvailableUsers(available);
  };

  const handleOpenManageMembers = async (group: Group) => {
    setSelectedGroup(group);
    setEditingManager(group.manager_id || "");
    await fetchGroupMembers(group.id);
    setIsAddMembersOpen(true);
  };

  const handleUpdateManager = async () => {
    if (!selectedGroup) return;

    if (!editingManager) {
      toast.error("Selecione um gestor para o grupo");
      return;
    }

    const { error } = await supabase
      .from("groups")
      .update({ manager_id: editingManager })
      .eq("id", selectedGroup.id);

    if (error) {
      toast.error("Erro ao atualizar gestor");
      return;
    }

    toast.success("Gestor atualizado com sucesso");
    fetchGroups();
    setSelectedGroup({ ...selectedGroup, manager_id: editingManager });
  };

  const handleAddMember = async (userId: string) => {
    if (!selectedGroup) return;

    const { error } = await supabase
      .from("group_members")
      .insert([{ group_id: selectedGroup.id, user_id: userId }]);

    if (error) {
      toast.error("Erro ao adicionar membro");
      return;
    }

    toast.success("Membro adicionado com sucesso");
    await fetchGroupMembers(selectedGroup.id);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return;

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", selectedGroup.id)
      .eq("user_id", userId);

    if (error) {
      toast.error("Erro ao remover membro");
      return;
    }

    toast.success("Membro removido com sucesso");
    await fetchGroupMembers(selectedGroup.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/admin")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Gerenciar Grupos Híbridos</h1>
            <p className="text-sm text-muted-foreground">Fase 2 - Organização de grupos</p>
          </div>
        </div>

        {/* Criar novo grupo */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Criar Novo Grupo</h2>
          <div className="space-y-4">
            <Input
              placeholder="Nome do grupo"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Gestor do Grupo
              </label>
              <Select value={newGroupManager} onValueChange={setNewGroupManager}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gestor" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.user_id} value={profile.user_id}>
                      {profile.name || profile.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleCreateGroup} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Criar
            </Button>
          </div>
        </Card>

        {/* Lista de grupos */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Grupos Cadastrados</h2>
          {groups.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              Nenhum grupo cadastrado ainda
            </Card>
          ) : (
            groups.map((group) => {
              const manager = profiles.find(p => p.user_id === group.manager_id);
              
              return (
                <Card key={group.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{group.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Crown className="h-4 w-4 text-warning" />
                        <p className="text-sm text-muted-foreground">
                          Gestor: {manager?.name || manager?.email || "Não definido"}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Criado em {new Date(group.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenManageMembers(group)}
                        >
                          <UsersIcon className="h-4 w-4 mr-2" />
                          Gerenciar Membros
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Gerenciar Membros - {selectedGroup?.name}</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          {/* Gestor do Grupo */}
                          <div className="pb-4 border-b">
                            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                              <Crown className="h-4 w-4 text-warning" />
                              Gestor do Grupo
                            </label>
                            <div className="flex gap-2">
                              <Select value={editingManager} onValueChange={setEditingManager}>
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Selecione o gestor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {profiles.map((profile) => (
                                    <SelectItem key={profile.user_id} value={profile.user_id}>
                                      {profile.name || profile.email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button 
                                onClick={handleUpdateManager}
                                disabled={editingManager === selectedGroup?.manager_id}
                              >
                                Salvar
                              </Button>
                            </div>
                          </div>

                          {/* Membros atuais */}
                          <div>
                            <h4 className="font-medium mb-3">Membros Atuais</h4>
                            {groupMembers.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Nenhum membro ainda</p>
                            ) : (
                              <div className="space-y-2">
                                {profiles
                                  .filter((p) => groupMembers.includes(p.user_id))
                                  .map((profile) => (
                                    <div
                                      key={profile.user_id}
                                      className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                      <div>
                                        <p className="font-medium">{profile.name || "Sem nome"}</p>
                                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                                      </div>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleRemoveMember(profile.user_id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>

                          {/* Adicionar membros */}
                          <div>
                            <h4 className="font-medium mb-3">Adicionar Membros</h4>
                            {availableUsers.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                Todos os usuários já estão no grupo
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {availableUsers.map((profile) => (
                                  <div
                                    key={profile.user_id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                                  >
                                    <div>
                                      <p className="font-medium">{profile.name || "Sem nome"}</p>
                                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleAddMember(profile.user_id)}
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Adicionar
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupsAdmin;
