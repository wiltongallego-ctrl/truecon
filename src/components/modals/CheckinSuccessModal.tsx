import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useEffect } from "react";
import confetti from "canvas-confetti";

interface CheckinSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  xpGained: number;
  streak: number;
}

const CheckinSuccessModal = ({ open, onOpenChange, xpGained, streak }: CheckinSuccessModalProps) => {
  useEffect(() => {
    if (open) {
      // Disparar confetis quando o modal abrir
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Confetis do lado esquerdo
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });

        // Confetis do lado direito
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      // Auto fechar após 4 segundos
      const autoCloseTimer = setTimeout(() => {
        onOpenChange(false);
      }, 4000);

      return () => {
        clearInterval(interval);
        clearTimeout(autoCloseTimer);
      };
    }
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs border-0 shadow-2xl bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="flex flex-col items-center gap-6 py-6">
          {/* Ícone de sucesso com animação */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 animate-pulse">
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          
          {/* Mensagem de sucesso */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-green-700">Parabéns! 🎉</h2>
            <p className="text-lg font-semibold text-green-600">
              +{xpGained} XP ganhos!
            </p>
            <p className="text-sm text-green-600/80">
              Check-in realizado com sucesso
            </p>
          </div>

          {/* Streak - se existir */}
          {streak > 0 && (
            <div className="px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200 rounded-full">
              <p className="text-sm font-bold text-orange-700">
                🔥 {streak} {streak === 1 ? 'dia consecutivo' : 'dias consecutivos'}!
              </p>
            </div>
          )}

          {/* Botão para fechar */}
          <Button 
            className="w-full h-11 font-medium bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600" 
            onClick={() => onOpenChange(false)}
          >
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckinSuccessModal;