import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface PhaseTooltipModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetButtonId: string;
  phaseNumber: number;
}

export const PhaseTooltipModal: React.FC<PhaseTooltipModalProps> = ({
  isOpen,
  onClose,
  targetButtonId,
  phaseNumber
}) => {
  const [targetPosition, setTargetPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!isOpen || !targetButtonId) return;

    // Tentar localizar o botão continuamente até existir na DOM
    const tryLocate = () => {
      const targetElement = document.getElementById(targetButtonId);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        // Guardar somente se possuir dimensões válidas para evitar render inicial em (0,0)
        if (rect.width > 0 && rect.height > 0) {
          setTargetPosition({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
        }
        return true;
      }
      return false;
    };

    // Primeira tentativa imediata
    if (tryLocate()) return;

    const interval = setInterval(() => {
      if (tryLocate()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, targetButtonId]);

  // Recalcular posição em resize/scroll para manter alinhado ao viewport
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => {
      const el = targetButtonId ? document.getElementById(targetButtonId) : null;
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setTargetPosition({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
        }
      }
    };
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, { passive: true });
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler);
    };
  }, [isOpen, targetButtonId]);

  useEffect(() => {
    if (isOpen) {
      // Bloquear scroll do body quando modal estiver aberto
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = 'unset';
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay com fundo esmaecido */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Destacar o botão alvo com contorno pulsante na cor do sistema */}
      {targetPosition && (
        <div
          className="fixed bg-transparent border-2 z-[80] pulse-green pointer-events-none"
          style={{
            left: `${targetPosition.x - 4}px`,
            top: `${targetPosition.y - 4}px`,
            width: `${targetPosition.width + 8}px`,
            height: `${targetPosition.height + 8}px`,
            borderRadius: '8px',
            borderColor: 'hsl(var(--primary))'
          }}
        />
      )}
      
      {/* Cópia do botão original para ficar visível */}
      {targetPosition && (
        <div
          className="fixed z-[60] pointer-events-none"
          style={{
            left: `${targetPosition.x}px`,
            top: `${targetPosition.y}px`,
            width: `${targetPosition.width}px`,
            height: `${targetPosition.height}px`,
          }}
        >
          <div className="h-full w-full bg-[#040404] rounded-[5px] flex items-center justify-center border-2"
               style={{ borderColor: 'hsl(var(--primary))' }}>
            {phaseNumber === 1 ? (
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            )}
          </div>
        </div>
      )}
      
      {/* Modal de conteúdo */}
      <div className="relative bg-white rounded-xl shadow-2xl p-6 mx-4 max-w-sm w-full animate-in fade-in-0 zoom-in-95">
        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
        
        {/* Conteúdo do modal */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <div className="text-2xl font-bold text-blue-600">
              {phaseNumber}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Fase {phaseNumber} Concluída!
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Esta fase é <strong>consultiva</strong> e pode ser visualizada a qualquer momento através do botão destacado no rodapé.
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>Clique no botão destacado para acessar</span>
          </div>
          
      <button
        onClick={onClose}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Entendi
      </button>
      </div>
      </div>
      
      {/* Seta apontando para o botão */}
      {targetPosition && (
        <div
          className="fixed pointer-events-none"
          style={{
            left: `${targetPosition.x + targetPosition.width / 2}px`,
            top: `${targetPosition.y - 20}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-blue-400 animate-bounce" />
        </div>
      )}
    </div>
  );
};

export default PhaseTooltipModal;