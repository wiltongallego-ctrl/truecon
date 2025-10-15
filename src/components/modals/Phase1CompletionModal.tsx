import React, { useEffect, useState } from 'react';

interface Phase1CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Phase1CompletionModal: React.FC<Phase1CompletionModalProps> = ({ isOpen, onClose }) => {
  const [showSecondStep, setShowSecondStep] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; color: string }>>([]);

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
      
      // Mostrar segunda etapa após 3 segundos
      const timer = setTimeout(() => {
        setShowSecondStep(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setShowSecondStep(false);
      setConfetti([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
          {!showSecondStep ? (
            // Primeira etapa - Celebração
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

              <div className="space-y-4">
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
            </div>
          ) : (
            // Segunda etapa - Informações
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Nova Funcionalidade!
                </h2>
                <p className="text-gray-600">
                  Agora você tem acesso ao acompanhamento contínuo
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-left">
                  <h3 className="font-semibold text-blue-800 mb-2">🔄 Reset Automático</h3>
                  <p className="text-sm text-blue-700">
                    Seu ciclo será resetado automaticamente às <strong>8h da manhã</strong> para começar uma nova semana.
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-left">
                  <h3 className="font-semibold text-purple-800 mb-2">📊 Botão de Acompanhamento</h3>
                  <p className="text-sm text-purple-700">
                    Um novo botão aparecerá no rodapé para você acompanhar seu progresso a qualquer momento.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-left">
                  <h3 className="font-semibold text-green-800 mb-2">🏆 Continue a Jornada</h3>
                  <p className="text-sm text-green-700">
                    Mantenha a consistência e complete mais ciclos para desbloquear novas conquistas!
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                Continuar Jornada
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Phase1CompletionModal;