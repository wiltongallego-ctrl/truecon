import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "@/lib/sweetAlert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Users, Trash2, RotateCcw, UserX, AlertTriangle, Shield, UserCheck, Search, ChevronLeft, ChevronRight, Edit, Save, X, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Phase {
  id: string;
  phase_number: number;
  title: string;
  description: string;
  objective: string | null;
  points_type: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  display_order: number;
  xp_reward: number;
  allow_completion_after_deadline: boolean | null;
}

interface UserWithRole {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

const Admin = () => {
  const navigate = useNavigate();
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [users, setUsers] = useState<Array<{id: string; email: string; name: string}>>([]);
  const [usersWithRoles, setUsersWithRoles] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [xpInputValues, setXpInputValues] = useState<Record<string, number>>({});
  const [editingPhase, setEditingPhase] = useState<string | null>(null);
  const [phaseFormData, setPhaseFormData] = useState<{
    start_date: string;
    end_date: string;
    allow_completion_after_deadline: boolean;
  }>({
    start_date: '',
    end_date: '',
    allow_completion_after_deadline: false
  });

  // useEffect para atualizar filteredUsers quando usersWithRoles mudar
  useEffect(() => {
    handleSearch(searchTerm);
  }, [usersWithRoles]);

  useEffect(() => {
    checkAdmin();
    fetchPhases();
    fetchUsers();
    fetchUsersWithRoles();
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
  };

  const fetchPhases = async () => {
    const { data, error } = await supabase
      .from("phases")
      .select("*")
      .order("display_order");

    if (error) {
      toast.error("Erro ao carregar fases");
      return;
    }

    setPhases(data || []);
    
    // Inicializar valores dos inputs de XP
    const initialXpValues: Record<string, number> = {};
    (data || []).forEach(phase => {
      initialXpValues[phase.id] = phase.xp_reward || 0;
    });
    setXpInputValues(initialXpValues);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("phases")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    toast.success(currentStatus ? "Fase desativada" : "Fase ativada");
    fetchPhases();
  };

  const updatePhaseXP = async (id: string, xpReward: number) => {
    try {
      const { error } = await supabase
        .from("phases")
        .update({ xp_reward: xpReward })
        .eq("id", id);

      if (error) {
        console.error("Erro ao atualizar XP:", error);
        toast.error("Erro ao atualizar XP da fase");
        return;
      }

      // Atualizar o estado local
      setPhases(phases.map(phase => 
        phase.id === id ? { ...phase, xp_reward: xpReward } : phase
      ));

      // Atualizar também o estado dos inputs
      setXpInputValues(prev => ({
        ...prev,
        [id]: xpReward
      }));

      toast.success("XP da fase atualizado com sucesso");
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast.error("Erro inesperado ao atualizar XP");
    }
  };

  const getPointsTypeBadge = (type: string): "default" | "destructive" | "outline" | "secondary" => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      individual: "default",
      coletivo: "secondary",
      misto: "outline"
    };
    return variants[type] || "default";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    });
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, email, name")
      .order("name");

    if (error) {
      console.error("Erro ao carregar usuários:", error);
      return;
    }

    setUsers(data?.map(u => ({ id: u.user_id, email: u.email || "", name: u.name || "" })) || []);
  };

  const fetchUsersWithRoles = async () => {
    console.log("Buscando usuários com roles...");
    
    // Primeiro, vamos buscar todos os usuários
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, email, name")
      .order("name");

    if (profilesError) {
      console.error("Erro ao carregar profiles:", profilesError);
      return;
    }

    console.log("Profiles encontrados:", profilesData?.length || 0);

    if (!profilesData || profilesData.length === 0) {
      console.log("Nenhum profile encontrado na tabela profiles");
      setUsersWithRoles([]);
      return;
    }

    // Agora vamos buscar as roles para cada usuário
    const usersWithRoles = [];
    
    for (const profile of profilesData) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profile.user_id)
        .single();

      usersWithRoles.push({
        id: profile.user_id,
        email: profile.email || "",
        name: profile.name || "",
        role: roleData?.role || 'user' as 'admin' | 'user'
      });
    }

    console.log("Usuários com roles processados:", usersWithRoles.length);
    setUsersWithRoles(usersWithRoles);
    setFilteredUsers(usersWithRoles);
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId);

    if (error) {
      console.error("Erro ao atualizar role do usuário:", error);
      toast.error("Erro ao atualizar role do usuário");
      return;
    }

    toast.success(`Role do usuário atualizada para ${newRole}`);
    fetchUsersWithRoles();
  };

  // Função para filtrar usuários baseado no termo de busca
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset para primeira página ao buscar
    
    if (!term.trim()) {
      setFilteredUsers(usersWithRoles);
      return;
    }

    const filtered = usersWithRoles.filter(user => 
      user.name.toLowerCase().includes(term.toLowerCase()) ||
      user.email.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  // Lógica de paginação
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Funções para gerenciamento de fases
  const startEditingPhase = (phase: Phase) => {
    setEditingPhase(phase.id);
    setPhaseFormData({
      start_date: phase.start_date,
      end_date: phase.end_date || '',
      allow_completion_after_deadline: phase.allow_completion_after_deadline || false
    });
  };

  const cancelEditingPhase = () => {
    setEditingPhase(null);
    setPhaseFormData({
      start_date: '',
      end_date: '',
      allow_completion_after_deadline: false
    });
  };

  const updatePhaseConfiguration = async (phaseId: string) => {
    const { error } = await supabase
      .from("phases")
      .update({
        start_date: phaseFormData.start_date,
        end_date: phaseFormData.end_date || null,
        // Temporariamente removido até aplicar migração:
        // allow_completion_after_deadline: phaseFormData.allow_completion_after_deadline
      })
      .eq("id", phaseId);

    if (error) {
      toast.error("Erro ao atualizar configuração da fase");
      console.error(error);
      return;
    }

    toast.success("Configuração da fase atualizada com sucesso!");
    setEditingPhase(null);
    fetchPhases(); // Recarregar as fases
  };

  const resetAllPhases = async () => {
    const { error } = await supabase
      .from("user_phase_progress")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      toast.error("Erro ao zerar fases");
      console.error(error);
      return;
    }

    // Limpar localStorage de tooltips para todos os usuários
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('hasShownPhase1Tooltip_') || key.startsWith('hasShownPhase2Tooltip_')) {
        localStorage.removeItem(key);
      }
    });

    toast.success("Todas as fases foram zeradas!");
  };

  const resetUserPhases = async (userId: string) => {
    const { error } = await supabase
      .from("user_phase_progress")
      .delete()
      .eq("user_id", userId);

    if (error) {
      toast.error("Erro ao zerar fases do usuário");
      console.error(error);
      return;
    }

    // Limpar localStorage de tooltips para este usuário específico
    localStorage.removeItem(`hasShownPhase1Tooltip_${userId}`);
    localStorage.removeItem(`hasShownPhase2Tooltip_${userId}`);

    toast.success("Fases do usuário zeradas!");
  };

  const deleteUser = async (userId: string) => {
    // Primeiro deletar progresso
    await supabase.from("user_phase_progress").delete().eq("user_id", userId);
    
    // Deletar das relações de grupo
    await supabase.from("group_members").delete().eq("user_id", userId);
    
    // Deletar perfil
    await supabase.from("profiles").delete().eq("user_id", userId);
    
    // Deletar papéis
    await supabase.from("user_roles").delete().eq("user_id", userId);

    // Por fim, deletar da autenticação (requer função de admin ou Service Role Key)
    // Como não temos acesso direto aqui, informamos ao usuário
    toast.success("Dados do usuário removidos! Para remover completamente, acesse o painel de autenticação.");
    fetchUsers();
  };

  const resetSystem = async () => {
    try {
      // Reset completo via RPC (bypass RLS e operações em lote)
      const { error } = await supabase.rpc('admin_reset_system');
      if (error) throw error;

      // Limpar localStorage de tooltips para todos os usuários
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('hasShownPhase1Tooltip_') || key.startsWith('hasShownPhase2Tooltip_')) {
          localStorage.removeItem(key);
        }
      });

      toast.success("Sistema resetado para o estado inicial!", {
        iconHtml: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>'
      });
      fetchPhases();
      fetchUsers();
    } catch (error) {
      toast.error("Erro ao resetar sistema");
      console.error(error);
    }
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
    <div className="min-h-screen bg-background">
      {/* Container principal com padding responsivo */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header responsivo */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/home")}
              className="self-start sm:self-auto"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Painel Administrativo</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Gerenciar TrueCon 2025</p>
            </div>
          </div>

          <Tabs defaultValue="phases" className="w-full">
            {/* TabsList responsivo */}
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="phases" className="text-xs sm:text-sm py-2 sm:py-3">
                Fases
              </TabsTrigger>
              <TabsTrigger value="system" className="text-xs sm:text-sm py-2 sm:py-3">
                Funções do Sistema
              </TabsTrigger>
              <TabsTrigger value="roles" className="text-xs sm:text-sm py-2 sm:py-3">
                <Shield className="h-4 w-4 mr-1" />
                Roles
              </TabsTrigger>
            </TabsList>

            <TabsContent value="phases" className="space-y-4 mt-4">
              {phases.map((phase) => (
                <Card key={phase.id} className="p-4 sm:p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header da fase - responsivo */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 text-primary font-bold text-sm sm:text-base">
                            {phase.phase_number}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base sm:text-lg font-semibold truncate">{phase.title}</h3>
                          </div>
                        </div>
                        <Badge variant={getPointsTypeBadge(phase.points_type)} className="self-start sm:self-auto">
                          {phase.points_type}
                        </Badge>
                      </div>
                      
                      {/* Descrição */}
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3 pl-0 sm:pl-[52px]">
                        {phase.description}
                      </p>
                      
                      {/* Datas - layout responsivo */}
                      {editingPhase === phase.id ? (
                        // Modo de edição
                        <div className="pl-0 sm:pl-[52px] space-y-4 border rounded-lg p-4 bg-muted/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Configuração de Datas</span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground block mb-1">
                                Data de Início *
                              </label>
                              <Input
                                type="date"
                                value={phaseFormData.start_date}
                                onChange={(e) => setPhaseFormData(prev => ({
                                  ...prev,
                                  start_date: e.target.value
                                }))}
                                className="text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="text-xs font-medium text-muted-foreground block mb-1">
                                Data de Término
                              </label>
                              <Input
                                type="date"
                                value={phaseFormData.end_date}
                                onChange={(e) => setPhaseFormData(prev => ({
                                  ...prev,
                                  end_date: e.target.value
                                }))}
                                className="text-sm"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pt-2 border-t">
                            <input
                              type="checkbox"
                              id={`allow-completion-${phase.id}`}
                              checked={phaseFormData.allow_completion_after_deadline}
                              onChange={(e) => setPhaseFormData(prev => ({
                                ...prev,
                                allow_completion_after_deadline: e.target.checked
                              }))}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label 
                              htmlFor={`allow-completion-${phase.id}`}
                              className="text-xs sm:text-sm text-muted-foreground cursor-pointer"
                            >
                              Permitir conclusão após vencimento (sem pontos)
                            </label>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 pt-3">
                            <Button
                              size="sm"
                              onClick={() => updatePhaseConfiguration(phase.id)}
                              className="flex-1 sm:flex-none"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditingPhase}
                              className="flex-1 sm:flex-none"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Modo de visualização
                        <div className="pl-0 sm:pl-[52px]">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span className="font-medium">Início:</span>
                              <span>{formatDate(phase.start_date)}</span>
                            </div>
                            {phase.end_date && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span className="font-medium">Término:</span>
                                  <span>{formatDate(phase.end_date)}</span>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Indicador de configuração especial */}
                          {phase.allow_completion_after_deadline && (
                            <div className="flex items-center gap-2 text-xs text-amber-600 mb-3">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Conclusão permitida após vencimento (sem pontos)</span>
                            </div>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditingPhase(phase)}
                            className="mb-3"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Configurar Datas
                          </Button>
                        </div>
                      )}

                      {/* Configuração de XP - novo campo */}
                      {phase.phase_number !== 4 && ( // Não mostrar para fase 4 (roleta)
                        <div className="pl-0 sm:pl-[52px] mt-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                              XP da Fase:
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="1000"
                                value={xpInputValues[phase.id] || 0}
                                onChange={(e) => setXpInputValues(prev => ({
                                  ...prev,
                                  [phase.id]: parseInt(e.target.value) || 0
                                }))}
                                className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updatePhaseXP(phase.id, xpInputValues[phase.id] || 0)}
                                className="h-8 px-2 text-xs"
                              >
                                Salvar
                              </Button>
                              <span className="text-xs text-muted-foreground">XP</span>
                            </div>
                          </div>
                          
                          {/* Indicador do XP atual */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              XP Atual: <span className="font-medium text-foreground">{phase.xp_reward || 0}</span>
                            </span>
                            {xpInputValues[phase.id] !== phase.xp_reward && (
                              <span className="text-xs text-orange-600">
                                → Será alterado para: <span className="font-medium">{xpInputValues[phase.id] || 0}</span>
                              </span>
                            )}
                          </div>
                          
                          {phase.phase_number === 1 && (
                            <p className="text-xs text-muted-foreground mt-1 pl-0 sm:pl-0">
                              * Fase 1 usa check-ins diários (10 XP cada)
                            </p>
                          )}
                        </div>
                      )}

                      {/* Botão de grupos - responsivo */}
                      {phase.phase_number === 2 && phase.is_active && (
                        <div className="pl-0 sm:pl-[52px] mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate("/admin/groups")}
                            className="w-full sm:w-auto"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Configurar Grupos
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Switch de ativação - responsivo */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 lg:border-l lg:pl-4">
                      <span className="text-xs sm:text-sm font-medium flex-1 lg:flex-none">
                        {phase.is_active ? "Ativa" : "Inativa"}
                      </span>
                      <Switch
                        checked={phase.is_active}
                        onCheckedChange={() => toggleActive(phase.id, phase.is_active)}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="system" className="space-y-4 mt-4">
              {/* Zerar Fases */}
              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <RotateCcw className="h-6 w-6 text-warning mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold mb-2">Zerar Progresso de Fases</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                      Remove o progresso de fases completadas de todos os usuários ou de um usuário específico.
                    </p>
                    
                    <div className="flex flex-col gap-4">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="w-full sm:w-auto">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Zerar Todas as Fases
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="mx-4 max-w-md sm:max-w-lg">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso irá apagar o progresso de TODOS os usuários em TODAS as fases. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={resetAllPhases} className="w-full sm:w-auto">Confirmar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <div className="border-t pt-4">
                        <p className="text-xs text-muted-foreground mb-3">Zerar fases de um usuário específico:</p>
                        <div className="flex flex-col gap-3">
                          <select 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            onChange={(e) => setUserEmail(e.target.value)}
                            value={userEmail}
                          >
                            <option value="">Selecione um usuário</option>
                            {users.map(user => (
                              <option key={user.id} value={user.id}>
                                {user.name || user.email}
                              </option>
                            ))}
                          </select>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" disabled={!userEmail} className="w-full sm:w-auto">
                                Zerar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="mx-4 max-w-md sm:max-w-lg">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Isso irá apagar o progresso deste usuário em todas as fases.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => resetUserPhases(userEmail)} className="w-full sm:w-auto">
                                  Confirmar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Gerenciar Usuários */}
              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <UserX className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold mb-2">Remover Usuário</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                      Remove um usuário e todos os seus dados do sistema.
                    </p>
                    
                    <div className="flex flex-col gap-3">
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        onChange={(e) => setUserEmail(e.target.value)}
                        value={userEmail}
                      >
                        <option value="">Selecione um usuário</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name || user.email}
                          </option>
                        ))}
                      </select>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" disabled={!userEmail} className="w-full sm:w-auto">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="mx-4 max-w-md sm:max-w-lg">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso irá remover permanentemente todos os dados deste usuário. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteUser(userEmail)} className="w-full sm:w-auto">
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Reset Completo do Sistema */}
              <Card className="p-4 sm:p-6 border-destructive">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <AlertTriangle className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold mb-2 text-destructive">Resetar Sistema Completo</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                      <strong>ATENÇÃO:</strong> Isso irá apagar todos os grupos, progresso de fases, posts e resetar os pontos de todos os usuários. Os usuários permanecerão cadastrados mas com dados zerados.
                    </p>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Resetar Sistema
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="mx-4 max-w-md sm:max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-destructive">⚠️ ATENÇÃO - AÇÃO IRREVERSÍVEL</AlertDialogTitle>
                          <AlertDialogDescription className="text-xs sm:text-sm">
                            Você está prestes a resetar TODO o sistema para o estado inicial. Isso irá:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>Apagar todos os grupos e membros</li>
                              <li>Apagar todo o progresso de fases</li>
                              <li>Apagar todos os posts e interações</li>
                              <li>Resetar pontos de todos os usuários para 0</li>
                            </ul>
                            <span className="mt-3 font-bold block">Esta ação NÃO pode ser desfeita!</span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={resetSystem}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                          >
                            Sim, resetar tudo
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="roles" className="space-y-4 mt-4">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Gerenciamento de Roles</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Gerencie as permissões dos usuários do sistema. Administradores têm acesso total ao painel administrativo.
                </p>
                
                {/* Campo de busca */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuário por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Informações de resultados */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <p className="text-sm text-muted-foreground">
                    {filteredUsers.length === 0 ? (
                      "Nenhum usuário encontrado"
                    ) : (
                      <>
                        Mostrando {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} de {filteredUsers.length} usuários
                        {searchTerm && ` (filtrado de ${usersWithRoles.length} total)`}
                      </>
                    )}
                  </p>
                  
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <span className="text-sm text-muted-foreground px-2">
                        {currentPage} de {totalPages}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Lista de usuários */}
                <div className="space-y-3">
                  {currentUsers.map((user, index) => (
                    <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4 hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                            {indexOfFirstUser + index + 1}
                          </div>
                          <UserCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium truncate">{user.name}</span>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="flex-shrink-0">
                            {user.role === 'admin' ? 'Admin' : 'Usuário'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate pl-10">{user.email}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:ml-4">
                        <Select
                          value={user.role}
                          onValueChange={(value: 'admin' | 'user') => updateUserRole(user.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuário</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                  
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">
                        {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                      </p>
                      <p className="text-sm">
                        {searchTerm 
                          ? "Tente ajustar os termos de busca ou limpar o filtro"
                          : "Os usuários aparecerão aqui quando se cadastrarem no sistema"
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Paginação inferior para mobile */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6 sm:hidden">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Button>
                      
                      <span className="text-sm text-muted-foreground px-4">
                        {currentPage} de {totalPages}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Próximo
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Admin;
