import React, { useState, useEffect } from 'react';

interface FloatingButtonProps {
  onClick: () => void;
  completedDays: number;
  isVisible: boolean;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({ onClick, completedDays, isVisible }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Mostrar tooltip por 10 segundos quando o botão aparece pela primeira vez
  useEffect(() => {
    if (isVisible) {
      setShowTooltip(true);
      setIsAnimating(true);
      
      const tooltipTimer = setTimeout(() => {
        setShowTooltip(false);
      }, 10000); // 10 segundos
      
      const animationTimer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000); // 2 segundos de animação inicial
      
      return () => {
        clearTimeout(tooltipTimer);
        clearTimeout(animationTimer);
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const progressPercentage = (completedDays / 7) * 100;

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-16 right-0 mb-2 w-64 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg animate-fade-in">
          <div className="relative">
            <p className="font-medium mb-1">🎯 Acompanhe seu progresso!</p>
            <p className="text-gray-300">
              Clique aqui para ver seus badges e countdown para o próximo check-in.
            </p>
            {/* Seta do tooltip */}
            <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      )}

      {/* Botão Principal */}
      <button
        onClick={onClick}
        className={`
          relative w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 
          text-white rounded-full shadow-lg hover:shadow-xl 
          transition-all duration-300 transform hover:scale-110
          ${isAnimating ? 'animate-bounce' : ''}
        `}
      >
        {/* Anel de Progresso */}
        <svg className="absolute inset-0 w-14 h-14 transform -rotate-90" viewBox="0 0 56 56">
          <circle
            cx="28"
            cy="28"
            r="24"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
            fill="none"
          />
          <circle
            cx="28"
            cy="28"
            r="24"
            stroke="white"
            strokeWidth="2"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 24}`}
            strokeDashoffset={`${2 * Math.PI * 24 * (1 - progressPercentage / 100)}`}
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Ícone Central */}
        <div className="relative z-10 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>

        {/* Badge de Progresso */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
          <span className="text-xs font-bold text-white">
            {completedDays}
          </span>
        </div>

        {/* Efeito de Pulso */}
        {isAnimating && (
          <div className="absolute inset-0 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-ping opacity-75"></div>
        )}
      </button>

      {/* Indicador de Novidade */}
      {showTooltip && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      )}
    </div>
  );
};

export default FloatingButton;