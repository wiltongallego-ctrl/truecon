import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Phase1CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Phase1CompletionModal: React.FC<Phase1CompletionModalProps> = ({ isOpen, onClose }) => {
  const [user, setUser] = useState<any>(null);
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; color: string }>>([]);
  const [targetPosition, setTargetPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Obter usuário autenticado
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Gerar confetes
  useEffect(() => {
    if (isOpen) {
      const newConfetti = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 3,
        color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 6)]
      }));
      setConfetti(newConfetti);
    } else {
      setConfetti([]);
      setTargetPosition(null);
    }
  }, [isOpen]);

  // Localizar o botão no rodapé e destacar com um contorno pulsante
  useEffect(() => {
    if (!isOpen) return;

    const findAndHighlightButton = () => {
      // Procurar por botões que contenham "Fase 1" no texto ou atributos
      const buttons = document.querySelectorAll('button, [role="button"], .phase-button');
      let targetButton: Element | null = null;

      buttons.forEach(button => {
        const text = button.textContent?.toLowerCase() || '';
        const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
        const className = button.className?.toLowerCase() || '';
        
        if (text.includes('fase 1') || ariaLabel.includes('fase 1') || className.includes('phase1') || 
            text.includes('check-in') || className.includes('checkin')) {
          targetButton = button;
        }
      });

      if (targetButton) {
        const rect = targetButton.getBoundingClientRect();
        setTargetPosition({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        });

        // Adicionar classe de destaque
        targetButton.classList.add('phase1-highlight');
        
        // Remover destaque quando o modal fechar
        return () => {
          targetButton?.classList.remove('phase1-highlight');
        };
      }
    };

    const cleanup = findAndHighlightButton();
    
    // Tentar novamente após um pequeno delay caso o botão não seja encontrado imediatamente
    const retryTimeout = setTimeout(findAndHighlightButton, 500);

    return () => {
      cleanup?.();
      clearTimeout(retryTimeout);
    };
  }, [isOpen]);

  // Adicionar estilos CSS dinamicamente
  useEffect(() => {
    if (!isOpen) return;

    const styleId = 'phase1-modal-styles';
    let existingStyle = document.getElementById(styleId);
    
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .phase1-highlight {
          animation: phase1-pulse 2s infinite !important;
          position: relative !important;
          z-index: 1000 !important;
        }
        
        @keyframes phase1-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7) !important;
          }
          50% {
            box-shadow: 0 0 0 10px rgba(34, 197, 94, 0) !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      
      {/* Destaque do botão */}
      {targetPosition && (
        <div
          className="fixed pointer-events-none z-40"
          style={{
            left: `${targetPosition.x - 5}px`,
            top: `${targetPosition.y - 5}px`,
            width: `${targetPosition.width + 10}px`,
            height: `${targetPosition.height + 10}px`,
            borderRadius: '10px',
            border: '2px solid hsl(var(--primary))'
          }}
        />
      )}
      {/* Confetes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {confetti.map((piece) => (
          <div
            key={piece.id}
            className="absolute w-3 h-3 opacity-80 animate-bounce"
            style={{
              left: `${piece.left}%`,
              backgroundColor: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: '3s',
              top: '-10px',
              transform: 'rotate(45deg)',
            }}
          />
        ))}
      </div>

      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative overflow-hidden">
        {/* Gradiente de fundo */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 opacity-50"></div>
        
        <div className="relative z-10">
          {/* Celebração */}
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                🎉 Parabéns! 🎉
              </h2>
              <p className="text-lg text-gray-600">
                Você completou seu primeiro ciclo de 7 dias!
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-lg">
                <p className="text-sm text-gray-700 font-medium">
                  ✨ Conquista desbloqueada: <span className="text-green-600">Primeira Semana</span>
                </p>
              </div>
              
              <div className="flex justify-center space-x-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>

            {/* Botão OK Verde */}
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Phase1CompletionModal;