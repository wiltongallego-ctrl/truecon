import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Crown, CheckCircle2, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GroupWall from "@/components/GroupWall";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { checkPhaseCompletion, calculatePhasePoints, formatCompletionMessage } from "@/utils/phaseLogic";
import { toast } from "@/hooks/use-toast";

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

interface Phase2ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPhaseCompleted?: () => void;
}

const Phase2Modal = ({ open, onOpenChange, onPhaseCompleted }: Phase2ModalProps) => {
  const [userGroup, setUserGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [step1Completed, setStep1Completed] = useState(false);

  useEffect(() => {
    if (open) {
      const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          await fetchUserGroup(user.id);
          // Não marcar como completo automaticamente - aguardar as 2 etapas
        }
      };
      init();
    }
  }, [open]);

  const markPhaseAsComplete = async (userId: string) => {
    // Buscar a fase 2 com todas as configurações necessárias
    const { data: phase2 } = await supabase
      .from("phases")
      .select("id, xp_reward, start_date, end_date, allow_completion_after_deadline, is_active")
      .eq("phase_number", 2)
      .maybeSingle();

    if (!phase2) return;

    // Verificar se a fase pode ser concluída e se deve conceder pontos
    const completionResult = checkPhaseCompletion(phase2);
    
    if (!completionResult.canComplete) {
      toast.error(`Não é possível completar a fase: ${completionResult.reason}`);
      return false;
    }

    const baseXP = phase2.xp_reward || 0;
    const xpToAward = calculatePhasePoints(baseXP, completionResult.shouldAwardPoints);

    // Verificar se já existe progresso
    const { data: existingProgress } = await supabase
      .from("user_phase_progress")
      .select("id, completed")
      .eq("user_id", userId)
      .eq("phase_id", phase2.id)
      .maybeSingle();

    let wasFirstTimeCompletion = false;

    if (existingProgress) {
      // Se já existe mas não está completo, atualizar
      if (!existingProgress.completed) {
        wasFirstTimeCompletion = true;
        await supabase
          .from("user_phase_progress")
          .update({ 
            completed: true, 
            completed_at: new Date().toISOString(),
            points_earned: xpToAward
          })
          .eq("id", existingProgress.id);
      }
    } else {
      // Se não existe, criar
      wasFirstTimeCompletion = true;
      await supabase
        .from("user_phase_progress")
        .insert({
          user_id: userId,
          phase_id: phase2.id,
          completed: true,
          completed_at: new Date().toISOString(),
          points_earned: xpToAward
        });
    }

    // Atualizar XP do usuário se houver XP a ser concedido
    if (xpToAward > 0) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_xp")
        .eq("user_id", userId)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ total_xp: (profile.total_xp || 0) + xpToAward })
          .eq("user_id", userId);
      }
    }

    // Mostrar mensagem personalizada baseada no resultado
    const message = formatCompletionMessage(2, xpToAward, completionResult);
    toast.success(message);

    // Retornar se foi primeira conclusão para o callback
    return wasFirstTimeCompletion;
  };

  const fetchUserGroup = async (userId: string) => {
    // Buscar grupo do usuário
    const { data: memberData, error: memberError } = await supabase
      .from("group_members")
      .select("group_id, groups(id, name, photo_url, manager_id)")
      .eq("user_id", userId)
      .maybeSingle();

    if (memberError || !memberData) {
      console.log("Erro ao buscar grupo:", memberError);
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

    console.log("IDs dos membros:", memberIds);
    console.log("Gerente ID:", group.manager_id);

    if (!membersError && memberIds) {
      // Buscar perfis dos membros
      const userIds = memberIds.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("name, email, user_id")
        .in("user_id", userIds);
      
      console.log("Perfis encontrados:", profiles);
      
      if (profiles) {
        setGroupMembers(profiles.map(p => ({ 
          profiles: p,
          user_id: p.user_id
        })));
      }
    }

    setLoading(false);
  };

  const handleStep1Complete = () => {
    setStep1Completed(true);
    setCurrentStep(2);
  };

  const handleStep2Complete = async () => {
    if (currentUserId) {
      const wasFirstTime = await markPhaseAsComplete(currentUserId);
      
      // Se foi a primeira vez completando e há callback, chamar
      if (wasFirstTime && onPhaseCompleted) {
        onPhaseCompleted();
      }
      
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2 pb-3">
          <DialogTitle className="text-xl sm:text-2xl font-bold leading-tight">
            Fase 2: Grupos Híbridos
          </DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Etapa {currentStep} de 2 - {currentStep === 1 ? 'Conheça seu grupo' : 'Interaja no mural'}
          </p>
          
          {/* Indicador de progresso */}
          <div className="flex items-center gap-2 pt-2">
            <div className={`flex items-center gap-1 ${step1Completed ? 'text-green-600' : 'text-blue-600'}`}>
              {step1Completed ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
              <span className="text-xs font-medium">Conhecer grupo</span>
            </div>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <div className={`flex items-center gap-1 ${currentStep === 2 ? 'text-blue-600' : 'text-muted-foreground'}`}>
              <div className="w-4 h-4 rounded-full border-2 border-current" />
              <span className="text-xs font-medium">Interagir no mural</span>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-lg">Carregando...</div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {!userGroup ? (
              <Card className="p-4 sm:p-6">
                <div className="flex flex-col items-center gap-3 sm:gap-4 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted flex items-center justify-center">
                    <Users className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Aguardando Grupo</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Você ainda não foi adicionado a um grupo. Aguarde a organização dos grupos pelos administradores.
                    </p>
                  </div>
                </div>
              </Card>
            ) : currentStep === 1 ? (
              // ETAPA 1: Conhecer o grupo
              <div className="space-y-3 sm:space-y-4">
                {/* Foto do Grupo */}
                {userGroup.photo_url && (
                  <Card className="p-3 sm:p-4">
                    <div className="flex justify-center">
                      <img
                        src={userGroup.photo_url}
                        alt="Foto do grupo"
                        className="w-full max-w-xs sm:max-w-sm rounded-lg object-cover"
                      />
                    </div>
                  </Card>
                )}

                <Card className="p-4 sm:p-6">
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="text-center space-y-1">
                      <h2 className="text-lg sm:text-xl font-semibold">Sua Equipe</h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {groupMembers.length} {groupMembers.length === 1 ? 'membro' : 'membros'}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        O nome será definido na Fase 3
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Membros do grupo */}
                <Card className="p-4 sm:p-6">
                  <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Membros do Grupo</h3>
                  <div className="space-y-4 sm:space-y-6">
                    {/* Gerente */}
                    {(() => {
                      const manager = groupMembers.find(m => m.user_id === userGroup.manager_id);
                      if (!manager) return null;
                      
                      return (
                        <div className="pb-3 sm:pb-4 border-b">
                          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-2 sm:mb-3">Gerente</p>
                          <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                            <div className="relative">
                              <Crown className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 h-5 w-5 sm:h-6 sm:w-6 text-warning" />
                              <Avatar className="h-14 w-14 sm:h-16 sm:w-16">
                                <AvatarFallback className="text-base sm:text-lg">
                                  {manager.profiles.name?.[0]?.toUpperCase() || manager.profiles.email?.[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="text-center max-w-full px-2">
                              <p className="text-sm sm:text-base font-medium truncate">{manager.profiles.name || "Sem nome"}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{manager.profiles.email}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Liderados em grade 2x2 no mobile, 3x3 no desktop */}
                    {(() => {
                      const followers = groupMembers.filter(m => m.user_id !== userGroup.manager_id);
                      if (followers.length === 0) return null;
                      
                      return (
                        <div>
                          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-2 sm:mb-3">Liderados</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                            {followers.map((member, index) => (
                              <div key={index} className="flex flex-col items-center gap-1.5 sm:gap-2">
                                <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                                  <AvatarFallback className="text-xs sm:text-sm">
                                    {member.profiles.name?.[0]?.toUpperCase() || member.profiles.email?.[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="text-center w-full px-1">
                                  <p className="text-[10px] sm:text-xs font-medium truncate">{member.profiles.name || "Sem nome"}</p>
                                  <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">{member.profiles.email}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </Card>

                <Card className="p-4 sm:p-6">
                  <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Objetivo da Etapa 1</h3>
                  <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground mb-6">
                    <li className="leading-relaxed">• Conhecer os membros do seu grupo</li>
                    <li className="leading-relaxed">• Identificar o gerente e liderados</li>
                    <li className="leading-relaxed">• Entender a estrutura da equipe</li>
                  </ul>
                  <div className="flex justify-center">
                    <Button 
                      onClick={handleStep1Complete}
                      className="w-full max-w-xs"
                      size="lg"
                    >
                      Continuar para Etapa 2
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </Card>
              </div>
            ) : (
              // ETAPA 2: Interagir no mural
              <div className="space-y-3 sm:space-y-4">
                <Card className="p-4 sm:p-6">
                  <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Objetivo da Etapa 2</h3>
                  <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground mb-4">
                    <li className="leading-relaxed">• Se apresentar no mural do grupo</li>
                    <li className="leading-relaxed">• Interagir com pelo menos 3 membros</li>
                    <li className="leading-relaxed">• Ganhar pontos coletivos com seu grupo</li>
                  </ul>
                </Card>

                {currentUserId && userGroup && (
                  <GroupWall groupId={userGroup.id} currentUserId={currentUserId} />
                )}

                <Card className="p-4 sm:p-6">
                  <div className="flex justify-center">
                    <Button 
                      onClick={handleStep2Complete}
                      className="w-full max-w-xs"
                      size="lg"
                    >
                      Finalizar Fase 2
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Phase2Modal;