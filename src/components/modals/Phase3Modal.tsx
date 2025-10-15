import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Upload, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import GroupPhotoUpload from "@/components/GroupPhotoUpload";
import { checkPhaseCompletion, calculatePhasePoints, formatCompletionMessage } from "@/utils/phaseLogic";
import { toast } from "@/hooks/use-toast";

interface Phase3ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Group {
  id: string;
  name: string;
  photo_url: string | null;
  manager_id: string | null;
}

const Phase3Modal = ({ open, onOpenChange }: Phase3ModalProps) => {
  const [groupName, setGroupName] = useState("");
  const [userGroup, setUserGroup] = useState<Group | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const canComplete = Boolean(userGroup?.name?.trim() && userGroup?.photo_url);

  useEffect(() => {
    if (open) {
      const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          await fetchUserGroup(user.id);
        }
      };
      init();
    }
  }, [open]);

  const fetchUserGroup = async (userId: string) => {
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
    console.log("Grupo carregado:", group);
    setUserGroup(group);
    setGroupName(group.name || "");
    setLoading(false);
  };

  const handleSaveGroupName = async () => {
    if (!groupName.trim()) {
      toast.error("Digite um nome para o grupo");
      return;
    }

    if (!userGroup) {
      toast.error("Grupo não encontrado");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("groups")
      .update({ name: groupName.trim() })
      .eq("id", userGroup.id);

    setSaving(false);

    if (error) {
      console.error("Erro ao salvar nome do grupo:", error);
      toast.error("Erro ao salvar nome do grupo");
      return;
    }

    toast.success("Nome do grupo salvo com sucesso!");
    setUserGroup({ ...userGroup, name: groupName.trim() });
  };

  const handleCompletePhase = async () => {
    if (!userGroup) return;
    
    // Verificar se nome e foto foram definidos
    if (!userGroup.name || userGroup.name.trim() === "") {
      toast.error("Defina um nome para o grupo antes de completar a fase");
      return;
    }

    if (!userGroup.photo_url) {
      toast.error("Envie uma foto do grupo antes de completar a fase");
      return;
    }

    setCompleting(true);

    try {
      // Buscar a fase 3 com todas as configurações necessárias
      const { data: phase3 } = await supabase
        .from("phases")
        .select("id, xp_reward, start_date, end_date, allow_completion_after_deadline, is_active")
        .eq("phase_number", 3)
        .maybeSingle();

      if (!phase3) {
        toast.error("Fase 3 não encontrada");
        setCompleting(false);
        return;
      }

      // Verificar se a fase pode ser concluída e se deve conceder pontos
      const completionResult = checkPhaseCompletion(phase3);
      
      if (!completionResult.canComplete) {
        toast.error(`Não é possível completar a fase: ${completionResult.reason}`);
        setCompleting(false);
        return;
      }

      const baseXP = phase3.xp_reward || 50; // Fallback para 50 XP se não configurado
      const xpToAward = calculatePhasePoints(baseXP, completionResult.shouldAwardPoints);

      // Verificar se já existe progresso
      const { data: existingProgress } = await supabase
        .from("user_phase_progress")
        .select("id, completed")
        .eq("user_id", currentUserId)
        .eq("phase_id", phase3.id)
        .maybeSingle();

      if (existingProgress?.completed) {
        toast.info("Você já completou esta fase!");
        setCompleting(false);
        return;
      }

      // Marcar fase como completa
      if (existingProgress) {
        await supabase
          .from("user_phase_progress")
          .update({ 
            completed: true, 
            completed_at: new Date().toISOString(),
            points_earned: xpToAward 
          })
          .eq("id", existingProgress.id);
      } else {
        await supabase
          .from("user_phase_progress")
          .insert({
            user_id: currentUserId,
            phase_id: phase3.id,
            completed: true,
            completed_at: new Date().toISOString(),
            points_earned: xpToAward
          });
      }

      // Atualizar XP do usuário se houver XP a ser concedido
      if (xpToAward > 0) {
        const { error: rpcError } = await supabase.rpc('award_xp', { target_user: currentUserId, amount: xpToAward });
        if (rpcError) {
          console.warn('award_xp falhou; aplicando fallback:', rpcError);
          const { data: profile } = await supabase
            .from("profiles")
            .select("total_xp")
            .eq("user_id", currentUserId)
            .single();
          if (profile) {
            await supabase
              .from("profiles")
              .update({ total_xp: (profile.total_xp || 0) + xpToAward })
              .eq("user_id", currentUserId);
          }
        }
      }

      // Mostrar mensagem personalizada baseada no resultado
      const message = formatCompletionMessage(3, xpToAward, completionResult);
      toast.success(message);

      // Fechar modal após 2 segundos
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);

    } catch (error) {
      console.error("Erro ao completar fase:", error);
      toast.error("Erro ao completar a fase");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fase 3: Personalização</DialogTitle>
          <p className="text-sm text-muted-foreground">Nome + foto do grupo</p>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <div className="text-lg">Carregando...</div>
          </div>
        ) : (
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
                <Card className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Type className="w-6 h-6 text-primary" />
                    <h3 className="font-semibold">Nome do Grupo</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Escolha um nome criativo para o seu grupo!
                  </p>
                  <Input
                    placeholder="Ex: Inovadores TrueCon"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="mb-4"
                  />
                  <Button 
                    onClick={handleSaveGroupName} 
                    className="w-full"
                    disabled={saving}
                  >
                    {saving ? "Salvando..." : "Salvar Nome"}
                  </Button>
                </Card>

                {/* Foto do Grupo */}
                <GroupPhotoUpload
                  groupId={userGroup.id}
                  groupName={userGroup.name || "Seu Grupo"}
                  currentPhotoUrl={userGroup.photo_url}
                  managerId={userGroup.manager_id}
                  currentUserId={currentUserId}
                  onPhotoUpdate={(newUrl) => {
                    console.log("Foto atualizada:", newUrl);
                    setUserGroup({ ...userGroup, photo_url: newUrl });
                  }}
                />
              </>
            )}

            {/* Botão Completar Fase - Sempre visível quando há grupo */}
            {userGroup && (
              <Card className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${userGroup.name && userGroup.name.trim() !== "" ? "bg-primary" : "bg-muted"}`}></div>
                    <span className={userGroup.name && userGroup.name.trim() !== "" ? "text-primary" : "text-muted-foreground"}>
                      Nome definido
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${userGroup.photo_url ? "bg-primary" : "bg-muted"}`}></div>
                    <span className={userGroup.photo_url ? "text-primary" : "text-muted-foreground"}>
                      Foto enviada
                    </span>
                  </div>
                  {canComplete && (
                    <Button 
                      onClick={handleCompletePhase}
                      className="w-full"
                      disabled={completing}
                    >
                      {completing ? "Completando..." : "Completar Fase"}
                    </Button>
                  )}
                </div>
              </Card>
            )}

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Objetivos desta fase</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>• Escolher um nome criativo para o grupo</li>
                <li>• Enviar uma foto que represente o grupo</li>
                <li>• Ganhar 50 pontos ao completar a fase</li>
              </ul>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Phase3Modal;
