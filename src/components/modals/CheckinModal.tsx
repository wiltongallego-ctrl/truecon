import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, X } from "lucide-react";
import { useEffect, useState } from "react";

interface CheckinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckIn: () => void;
  streak: number;
  canCheckIn: boolean;
  lastCheckinAt?: string;
  xpReward?: number; // XP configurado para a fase
  onCelebrationComplete?: () => void; // Callback para quando a celebração terminar
}

const CheckinModal = ({ 
  open, 
  onOpenChange, 
  onCheckIn, 
  streak, 
  canCheckIn, 
  lastCheckinAt, 
  xpReward = 10,
  onCelebrationComplete 
}: CheckinModalProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiElements, setConfettiElements] = useState<JSX.Element[]>([]);

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

  // Função para criar confetes com efeito de fogos de artifício
  const createConfetti = () => {
    const confettiArray = [];
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#FF8A80', '#B39DDB', '#81C784', '#FFB74D'];
    
    // Criar múltiplas explosões em pontos diferentes da tela
    const explosionPoints = [
      { x: 50, y: 50 }, // Centro
      { x: 25, y: 30 }, // Superior esquerda
      { x: 75, y: 30 }, // Superior direita
      { x: 20, y: 70 }, // Inferior esquerda
      { x: 80, y: 70 }, // Inferior direita
      { x: 50, y: 25 }, // Superior centro
      { x: 15, y: 50 }, // Centro esquerda
      { x: 85, y: 50 }, // Centro direita
    ];
    
    explosionPoints.forEach((point, explosionIndex) => {
      const particlesPerExplosion = 15;
      const explosionDelay = explosionIndex * 0.1; // Delay escalonado entre explosões
      
      for (let i = 0; i < particlesPerExplosion; i++) {
        const delay = explosionDelay + Math.random() * 0.3;
        const duration = 2 + Math.random() * 1.5;
        const angle = (Math.random() * 360) * (Math.PI / 180);
        const distance = 200 + Math.random() * 300; // Distância maior para cobrir toda a tela
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 2 + Math.random() * 4; // Tamanhos variados
        
        confettiArray.push(
          <div
            key={`${explosionIndex}-${i}`}
            className="absolute opacity-90 rounded-full"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              animation: `fireworks-explosion ${duration}s ease-out ${delay}s forwards`,
              transform: 'translate(-50%, -50%)',
              '--explosion-x': `${Math.cos(angle) * distance}px`,
              '--explosion-y': `${Math.sin(angle) * distance}px`,
              '--rotation': `${Math.random() * 1080}deg`,
              '--scale-start': `${0.5 + Math.random() * 0.5}`,
            } as React.CSSProperties & { [key: string]: string }}
          />
        );
      }
    });
    
    return confettiArray;
  };

  const handleCheckIn = () => {
    if (!canCheckIn) return;
    
    setShowCelebration(true);
    setConfettiElements(createConfetti());
    
    // Remover confetes após a animação
    setTimeout(() => {
      setShowCelebration(false);
      setConfettiElements([]);
    }, 4000); // Duração aumentada para fogos de artifício
    
    onCheckIn();
  };

  const handleCloseCelebration = () => {
    setShowCelebration(false);
    setConfettiElements([]);
    onOpenChange(false);
    onCelebrationComplete?.();
  };

  return (
    <>
      {/* Estilos CSS para animações */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fireworks-explosion {
            0% {
              transform: translate(-50%, -50%) rotate(0deg) scale(var(--scale-start));
              opacity: 1;
            }
            20% {
              opacity: 1;
              transform: translate(calc(-50% + var(--explosion-x) * 0.3), calc(-50% + var(--explosion-y) * 0.3)) rotate(calc(var(--rotation) * 0.3)) scale(calc(var(--scale-start) * 1.2));
            }
            60% {
              opacity: 0.8;
              transform: translate(calc(-50% + var(--explosion-x) * 0.8), calc(-50% + var(--explosion-y) * 0.8)) rotate(calc(var(--rotation) * 0.8)) scale(calc(var(--scale-start) * 0.8));
            }
            100% {
              transform: translate(calc(-50% + var(--explosion-x)), calc(-50% + var(--explosion-y))) rotate(var(--rotation)) scale(0.1);
              opacity: 0;
            }
          }
          
          @keyframes slide-up-from-bottom {
            0% {
              transform: translateY(100vh);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          @keyframes slide-down-to-bottom {
            0% {
              transform: translateY(0);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh);
              opacity: 0;
            }
          }
          
          .slide-up-from-bottom {
            animation: slide-up-from-bottom 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          .slide-down-to-bottom {
            animation: slide-down-to-bottom 0.3s cubic-bezier(0.55, 0.06, 0.68, 0.19);
          }
          
          .celebration-slide-up {
            animation: slide-up-from-bottom 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
        `
      }} />

      {/* Modal de Celebração */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          {/* Confetes - cobrindo toda a tela para efeito de fogos de artifício */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
            <div className="absolute inset-0 w-full h-full">
              {confettiElements}
            </div>
          </div>
          
          {/* Modal de Parabéns */}
          <div className="bg-white rounded-2xl p-8 mx-4 max-w-sm w-full text-center relative celebration-slide-up shadow-2xl z-20">
            <button
              onClick={handleCloseCelebration}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                🎉 Parabéns!
              </h2>
              
              <p className="text-gray-600 mb-4">
                Check-in realizado com sucesso!
              </p>
              
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
                <p className="text-lg font-semibold text-primary">
                  +{xpReward} XP ganhos!
                </p>
                {streak > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    🔥 {streak + 1} {streak + 1 === 1 ? 'dia seguido' : 'dias seguidos'}
                  </p>
                )}
              </div>
            </div>
            
            <Button 
              onClick={handleCloseCelebration}
              className="w-full h-11 font-medium"
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* Modal Original com animação de slide ascendente - por trás do footer */}
      {!showCelebration && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent 
            className="max-w-xs border-0 shadow-2xl slide-up-from-bottom"
            style={{
              position: 'fixed',
              bottom: '60px', // Posicionar atrás do menu visualmente
              left: '50%',
              top: 'auto',
              transform: 'translateX(-50%)',
              margin: '0',
              borderRadius: '16px 16px 0 0',
              zIndex: 60, // Maior que o footer para ser clicável
            }}
          >
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
      )}
    </>
  );
};

export default CheckinModal;
