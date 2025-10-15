import { useEffect, useState } from "react";
import { launchConfetti } from "@/lib/confetti";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, Trophy, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { checkPhaseCompletion, calculatePhasePoints, formatCompletionMessage } from "@/utils/phaseLogic";
import CheckinModal from "./CheckinModal";

interface Phase1ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPhaseCompleted?: () => void;
  isFirstTimeClick?: boolean;
  isFirstCompletion?: boolean;
  onShowTooltip?: () => void; // Callback para mostrar tooltip
}

const Phase1Modal = ({ open, onOpenChange, onPhaseCompleted, isFirstTimeClick = false, isFirstCompletion = true, onShowTooltip }: Phase1ModalProps) => {
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [hasCompletedPhase, setHasCompletedPhase] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [phaseXP, setPhaseXP] = useState(10);

  useEffect(() => {
    if (open) {
      const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          await fetchUserData(user.id);
        }
      };
      init();
    }
  }, [open, isFirstTimeClick]);

  const fetchUserData = async (userId: string) => {
    setLoading(true);
    
    // Buscar dados do perfil
    const { data: profileData } = await supabase
      .from("profiles")
      .select("total_xp, last_checkin_at")
      .eq("user_id", userId)
      .single();

    if (profileData) {
      setProfile(profileData);
      setTotalXP(profileData.total_xp || 0);
      
      // Verificar se pode fazer check-in
      if (!profileData.last_checkin_at) {
        setCanCheckIn(true);
      } else {
        const lastCheckin = new Date(profileData.last_checkin_at);
        const now = new Date();
        const hoursSinceLastCheckin = (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60);
        setCanCheckIn(hoursSinceLastCheckin >= 24);
      }
      
      // Calcular streak baseado nos check-ins consecutivos
      const calculatedStreak = await calculateStreak(userId, profileData.last_checkin_at);
      setStreak(calculatedStreak);
    }

    // Buscar XP da fase
    const { data: phase1Data } = await supabase
      .from("phases")
      .select("id, xp_reward")
      .eq("phase_number", 1)
      .maybeSingle();

    if (phase1Data) {
      setPhaseXP(phase1Data.xp_reward || 10);
      
      const { data: progress } = await supabase
        .from("user_phase_progress")
        .select("completed")
        .eq("user_id", userId)
        .eq("phase_id", phase1Data.id)
        .maybeSingle();

      setHasCompletedPhase(progress?.completed || false);
    }

    setLoading(false);
  };

  const handleCheckIn = async () => {
    if (!currentUserId || !canCheckIn) return;

    try {
      const now = new Date();
      const amount = phaseXP || 10;
      // Tentar conceder XP via RPC (atômico)
      const { error: awardErr } = await supabase.rpc('award_xp', { target_user: currentUserId, amount });
      if (awardErr) {
        console.warn('award_xp falhou; aplicando fallback no check-in:', awardErr);
        const { data: prof } = await supabase
          .from('profiles')
          .select('total_xp')
          .eq('user_id', currentUserId)
          .single();
        if (prof) {
          const newXP = (prof.total_xp || 0) + amount;
          await supabase
            .from('profiles')
            .update({ total_xp: newXP })
            .eq('user_id', currentUserId);
        }
      }

      // Atualizar last_checkin_at independentemente do XP
      await supabase
        .from("profiles")
        .update({ last_checkin_at: now.toISOString() })
        .eq("user_id", currentUserId);

      setCanCheckIn(false);
      setShowCheckinModal(false);
      
      // Atualizar dados
      await fetchUserData(currentUserId);

      try { launchConfetti(); } catch {}
    } catch (error) {
      console.error("Erro ao fazer check-in:", error);
    }
  };

  const handleCelebrationComplete = () => {
    // NÃO fechar o modal automaticamente - deixar o usuário fechar manualmente
    // O modal só deve fechar quando o usuário clicar no X ou fora do modal
    
    // NÃO mostrar o tooltip automaticamente aqui
    // O tooltip só deve aparecer quando o usuário fechar o modal manualmente
  };

  // Função para calcular o streak baseado nos check-ins consecutivos
  const calculateStreak = async (userId: string, lastCheckinAt: string | null): Promise<number> => {
    if (!lastCheckinAt) return 0;

    const lastCheckin = new Date(lastCheckinAt);
    const now = new Date();
    const hoursSinceLastCheckin = (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60);

    // Se passou mais de 48 horas desde o último check-in, o streak foi quebrado
    if (hoursSinceLastCheckin > 48) {
      return 0;
    }

    // Buscar todos os check-ins do usuário ordenados por data
    const { data: profile } = await supabase
      .from("profiles")
      .select("last_checkin_at")
      .eq("user_id", userId)
      .single();

    if (!profile?.last_checkin_at) return 0;

    // Para simplificar, vamos calcular o streak baseado na diferença de dias
    // desde o primeiro check-in até hoje, assumindo check-ins diários
    const firstCheckin = new Date(profile.last_checkin_at);
    const daysDifference = Math.floor((now.getTime() - firstCheckin.getTime()) / (1000 * 60 * 60 * 24));
    
    // Se o usuário fez check-in recentemente (últimas 24-48h), conta como streak ativo
    if (hoursSinceLastCheckin <= 48) {
      return Math.max(1, daysDifference + 1);
    }

    return 0;
  };

  const markPhaseAsComplete = async () => {
    if (!currentUserId) return;

    // Buscar a fase 1 com todas as configurações necessárias
    const { data: phase1 } = await supabase
      .from("phases")
      .select("id, xp_reward, start_date, end_date, allow_completion_after_deadline, is_active")
      .eq("phase_number", 1)
      .maybeSingle();

    if (!phase1) return;

    // Verificar se a fase pode ser concluída e se deve conceder pontos
    const completionResult = checkPhaseCompletion(phase1);
    
    if (!completionResult.canComplete) {
      toast.error(`Não é possível completar a fase: ${completionResult.reason}`);
      return;
    }

    const baseXP = phase1.xp_reward || 0;
    const xpToAward = calculatePhasePoints(baseXP, completionResult.shouldAwardPoints);

    // Verificar se já existe progresso
    const { data: existingProgress } = await supabase
      .from("user_phase_progress")
      .select("id, completed")
      .eq("user_id", currentUserId)
      .eq("phase_id", phase1.id)
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
          user_id: currentUserId,
          phase_id: phase1.id,
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
    const message = formatCompletionMessage(1, xpToAward, completionResult);
    toast.success(message);

    setHasCompletedPhase(true);
    
    // Se foi a primeira vez completando e há callback, chamar
    if (wasFirstTimeCompletion && onPhaseCompleted) {
      onPhaseCompleted();
    }
    
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        // Se o modal está sendo fechado E a fase foi completada, mostrar o tooltip
        if (!isOpen && hasCompletedPhase && isFirstCompletion) {
          // Verificar se é a primeira vez que o tooltip será mostrado
          const hasShownPhase1CompletedTooltip = localStorage.getItem('hasShownPhase1CompletedTooltip');
          if (!hasShownPhase1CompletedTooltip) {
            setTimeout(() => {
              onShowTooltip?.();
            }, 500);
          }
        }
      }}>
        <DialogContent className="max-w-md w-[95vw] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="space-y-2 pb-3">
            <DialogTitle className="text-xl sm:text-2xl font-bold leading-tight">
              Fase 1: Check-in Diário
            </DialogTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isFirstTimeClick ? "Faça seu primeiro check-in!" : "Evidências da sua jornada de check-ins"}
            </p>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {isFirstTimeClick ? (
                // Conteúdo para primeiro clique
                <Card className="p-4 sm:p-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-primary" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold mb-2">
                        Bem-vindo à Fase 1!
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Comece sua jornada fazendo seu primeiro check-in diário. O modal de check-in está aberto em segundo plano.
                      </p>
                    </div>
                    
                    <Button 
                      onClick={() => setShowCheckinModal(true)}
                      className="w-full"
                      size="lg"
                    >
                      Fazer Primeiro Check-in
                    </Button>
                  </div>
                </Card>
              ) : (
                // Conteúdo normal para visualização de progresso
                <>
                  {/* Estatísticas do usuário */}
                  <Card className="p-4 sm:p-6">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-green-600" />
                      </div>
                      
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-2">
                          Parabéns pela consistência!
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Você demonstrou disciplina e comprometimento
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Métricas alcançadas */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div className="text-lg font-bold text-primary">{totalXP}</div>
                      <div className="text-xs text-muted-foreground">XP Total</div>
                    </Card>
                    
                    <Card className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Target className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="text-lg font-bold text-primary">{streak}</div>
                      <div className="text-xs text-muted-foreground">Sequência</div>
                    </Card>
                  </div>

                  {/* Objetivos alcançados */}
                  <Card className="p-4 sm:p-6">
                    <h3 className="font-semibold mb-4">Objetivos Alcançados</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        <span className="text-sm">Perfil completado com sucesso</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        <span className="text-sm">Check-ins diários realizados</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        <span className="text-sm">Primeiros XP conquistados</span>
                      </li>
                    </ul>
                  </Card>

                  {/* Próximos passos */}
                  <Card className="p-4 sm:p-6">
                    <h3 className="font-semibold mb-3">Próximos Passos</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Agora que você dominou a consistência, está pronto para trabalhar em equipe na Fase 2!
                    </p>
                    <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg">
                      💡 Dica: Continue fazendo check-ins diários para manter sua sequência ativa
                    </div>
                  </Card>

                  {/* Botão de conclusão */}
                  {!hasCompletedPhase && (
                    <Card className="p-4 sm:p-6">
                      <div className="text-center">
                        <Button 
                          onClick={markPhaseAsComplete}
                          className="w-full"
                          size="lg"
                        >
                          Marcar Fase como Concluída
                          <CheckCircle2 className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </Card>
                  )}

                  {hasCompletedPhase && (
                    <Card className="p-4 sm:p-6 bg-green-50 border-green-200">
                      <div className="text-center">
                        <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-green-800">
                          Fase 1 concluída com sucesso!
                        </p>
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Check-in em segundo plano */}
      <CheckinModal
        open={showCheckinModal}
        onOpenChange={setShowCheckinModal}
        onCheckIn={handleCheckIn}
        streak={streak}
        canCheckIn={canCheckIn}
        lastCheckinAt={profile?.last_checkin_at}
        xpReward={phaseXP}
        onCelebrationComplete={handleCelebrationComplete}
      />
    </>
  );
};

export default Phase1Modal;