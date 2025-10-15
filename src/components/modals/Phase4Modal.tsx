import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "@/lib/sweetAlert";
import PrizeWheel from "@/components/PrizeWheel";
import { checkPhaseCompletion, calculatePhasePoints, formatCompletionMessage } from "@/utils/phaseLogic";

interface Phase4ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Phase4Modal = ({ open, onOpenChange }: Phase4ModalProps) => {
  const [hasSpun, setHasSpun] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    if (open) {
      const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          // Resetar o estado da roleta quando o modal abrir
          setHasSpun(false);
          setLoading(false);
        }
      };
      init();
    }
  }, [open]);

  const handlePrizeWon = async (points: number) => {
    if (!currentUserId) return;

    // Marcar como girado na sessão atual
    setHasSpun(true);

    try {
      // Buscar a fase 4 com todas as configurações necessárias
      const { data: phase4 } = await supabase
        .from("phases")
        .select("id, xp_reward, start_date, end_date, allow_completion_after_deadline, is_active")
        .eq("phase_number", 4)
        .maybeSingle();

      if (!phase4) {
        toast.error("Fase 4 não encontrada");
        return;
      }

      // Verificar se a fase pode ser concluída e se deve conceder pontos
      const completionResult = checkPhaseCompletion(phase4);
      
      if (!completionResult.canComplete) {
        toast.error(`Não é possível completar a fase: ${completionResult.reason}`);
        return;
      }

      // Calcular pontos finais baseado na verificação de data
      const finalPoints = calculatePhasePoints(points, completionResult.shouldAwardPoints);

      // Atualizar XP do usuário se houver pontos a serem concedidos
      if (finalPoints > 0) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_xp")
          .eq("user_id", currentUserId)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({ total_xp: (profile.total_xp || 0) + finalPoints })
            .eq("user_id", currentUserId);
        }
      }

      // Marcar fase como completa
      const { data: existingProgress } = await supabase
        .from("user_phase_progress")
        .select("id")
        .eq("user_id", currentUserId)
        .eq("phase_id", phase4.id)
        .maybeSingle();

      if (existingProgress) {
        await supabase
          .from("user_phase_progress")
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
            points_earned: finalPoints,
          })
          .eq("id", existingProgress.id);
      } else {
        await supabase
          .from("user_phase_progress")
          .insert({
            user_id: currentUserId,
            phase_id: phase4.id,
            completed: true,
            completed_at: new Date().toISOString(),
            points_earned: finalPoints,
          });
      }

      setHasSpun(true);

      // Mostrar mensagem personalizada baseada no resultado
      if (finalPoints > 0) {
        const message = formatCompletionMessage(4, finalPoints, completionResult);
        toast.success(message);
      } else if (completionResult.reason === "Após vencimento - sem pontos") {
        toast.info("Fase 4 completa! Concluída após o prazo - sem pontos XP.");
      } else {
        toast.info("Que pena! Tente novamente na próxima vez.");
      }

      // Fechar modal após 3 segundos
      setTimeout(() => {
        onOpenChange(false);
      }, 3000);
    } catch (error) {
      console.error("Erro ao processar prêmio:", error);
      toast.error("Erro ao processar prêmio");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Fase 4: Roleta de Prêmios</DialogTitle>
          <p className="text-sm text-muted-foreground">Gire e ganhe até 100 XP!</p>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <div className="text-lg">Carregando...</div>
          </div>
        ) : (
          <div className="space-y-4">
            <PrizeWheel onPrizeWon={handlePrizeWon} disabled={hasSpun} />

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Regras da Roleta</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>• Você pode girar a roleta apenas uma vez</li>
                <li>• Prêmios variam de 0 a 100 XP</li>
                <li>• Os pontos são adicionados automaticamente ao seu total</li>
                <li>• A fase será marcada como completa após girar</li>
              </ul>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Phase4Modal;