import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface CheckinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckIn: () => void;
  streak: number;
  canCheckIn: boolean;
  lastCheckinAt?: string;
  xpReward?: number; // XP configurado para a fase
}

const CheckinModal = ({ open, onOpenChange, onCheckIn, streak, canCheckIn, lastCheckinAt, xpReward = 10 }: CheckinModalProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (!canCheckIn && lastCheckinAt) {
      const updateCountdown = () => {
        const lastCheckin = new Date(lastCheckinAt);
        const nextCheckin = new Date(lastCheckin.getTime() + 24 * 60 * 60 * 1000);
        const now = new Date();
        const diff = nextCheckin.getTime() - now.getTime();

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setTimeRemaining("");
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [canCheckIn, lastCheckinAt]);

  const handleCheckIn = () => {
    if (canCheckIn) {
      onCheckIn();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs border-0 shadow-2xl">
        <div className="flex flex-col items-center gap-6 py-6">
          {/* Ícone principal - muda baseado na disponibilidade */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            canCheckIn 
              ? 'bg-gradient-to-br from-primary/20 to-primary/10' 
              : 'bg-gradient-to-br from-gray-100 to-gray-50'
          }`}>
            {canCheckIn ? (
              <CheckCircle2 className="w-8 h-8 text-primary" />
            ) : (
              <Clock className="w-8 h-8 text-gray-400" />
            )}
          </div>
          
          {/* Título e descrição */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold text-foreground">
              {canCheckIn ? "Check-in Diário" : "Aguarde para o próximo check-in"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {canCheckIn ? `Ganhe +${xpReward} XP agora` : `Próximo check-in em: ${timeRemaining}`}
            </p>
          </div>

          {/* Streak */}
          {streak > 0 && (
            <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-full">
              <p className="text-sm font-medium text-amber-700">
                🔥 {streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'}
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="w-full space-y-2">
            <Button 
              className="w-full h-11 font-medium" 
              onClick={handleCheckIn}
              disabled={!canCheckIn}
            >
              {canCheckIn ? "Fazer Check-in" : "Indisponível"}
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full h-9 text-muted-foreground" 
              onClick={() => onOpenChange(false)}
            >
              {canCheckIn ? "Depois" : "Fechar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckinModal;
