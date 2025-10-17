import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Target, Calendar, Zap } from "lucide-react";
import { launchConfetti } from "@/lib/confetti";
import { useEffect } from "react";

interface Phase1CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedDays: number;
  totalDays: number;
  missedDays: number;
  isLastDay?: boolean; // Nova prop para indicar se é o último dia
}

const Phase1CompletionModal = ({ 
  isOpen, 
  onClose, 
  completedDays, 
  totalDays,
  missedDays,
  isLastDay = false
}: Phase1CompletionModalProps) => {
  
  // Determinar se é conclusão completa (sem dias perdidos) ou parcial (com dias perdidos)
  const isCompleteSuccess = missedDays === 0;
  
  // Se não é o último dia, sempre mostrar modal de evidência (botão)
  const showEvidenceModal = !isLastDay;
  
  useEffect(() => {
    if (isOpen && isCompleteSuccess && isLastDay) {
      // Só disparar confetti se for conclusão completa no último dia
      const timer = setTimeout(() => {
        launchConfetti();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, isCompleteSuccess, isLastDay]);

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-auto bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 shadow-2xl">
        <div className="text-center space-y-6 p-6">
          {showEvidenceModal ? (
            // Modal de evidência (botão) - aparece após check-ins normais
            <>
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <Target className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-gray-800">
                  🎯 Ótimo trabalho!
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Você fez seu check-in hoje! Continue assim para formar um hábito sólido.
                </p>
              </div>

              <div className="bg-white/70 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <Zap className="w-5 h-5" />
                  <span className="font-medium">Continue sua jornada!</span>
                </div>
                <p className="text-sm text-gray-600">
                  Cada check-in te aproxima do seu objetivo.
                </p>
              </div>

              <Button 
                onClick={handleClose}
                className="w-full py-3 text-lg font-semibold transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
              >
                Continuar!
              </Button>
            </>
          ) : isCompleteSuccess ? (
            // Mensagem de conclusão completa (sem dias perdidos) - último dia
            <>
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-gray-800">
                  🎉 Parabéns! Fase 1 Concluída!
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Você completou todos os <span className="font-semibold text-blue-600">{completedDays}/{totalDays} dias</span> da Fase 1 sem perder nenhum dia! 
                  Seu hábito está sendo estabelecido com sucesso.
                </p>
              </div>

              <div className="bg-white/70 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <Target className="w-5 h-5" />
                  <span className="font-medium">Consistência Perfeita!</span>
                </div>
                <p className="text-sm text-gray-600">
                  Continue assim para desbloquear novas funcionalidades!
                </p>
              </div>

              <Button 
                onClick={handleClose}
                className="w-full py-3 text-lg font-semibold transition-all duration-200 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl"
              >
                Continuar Jornada!
              </Button>
            </>
          ) : (
            // Mensagem de conclusão parcial (com dias perdidos) - último dia
            <>
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-gray-800">
                  😔 Poxa, que pena!
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Você completou <span className="font-semibold text-blue-600">{completedDays}/{totalDays} dias</span> da Fase 1, 
                  mas perdeu <span className="font-semibold text-red-600">{missedDays} {missedDays === 1 ? 'dia' : 'dias'}</span> durante o período.
                </p>
              </div>

              <div className="bg-white/70 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-center gap-2 text-orange-600">
                  <Zap className="w-5 h-5" />
                  <span className="font-medium">Não desista!</span>
                </div>
                <p className="text-sm text-gray-600">
                  Formar um hábito leva tempo. Continue tentando na próxima fase!
                </p>
              </div>

              <Button 
                onClick={handleClose}
                className="w-full py-3 text-lg font-semibold transition-all duration-200 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl"
              >
                Fechar
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Phase1CompletionModal;