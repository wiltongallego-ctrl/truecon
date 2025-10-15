import React, { useState, useRef, useEffect } from 'react';

interface PhaseTooltipProps {
  children: React.ReactNode;
  show: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const PhaseTooltip: React.FC<PhaseTooltipProps> = ({ 
  children, 
  show,
  position = 'top',
  className = ''
}) => {
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let x = 0;
      let y = 0;

      switch (position) {
        case 'top':
          x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          y = triggerRect.top - tooltipRect.height - 12;
          break;
        case 'bottom':
          x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          y = triggerRect.bottom + 12;
          break;
        case 'left':
          x = triggerRect.left - tooltipRect.width - 12;
          y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          break;
        case 'right':
          x = triggerRect.right + 12;
          y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          break;
      }

      // Ajustar para não sair da tela
      const padding = 8;
      x = Math.max(padding, Math.min(x, window.innerWidth - tooltipRect.width - padding));
      y = Math.max(padding, Math.min(y, window.innerHeight - tooltipRect.height - padding));

      setTooltipPosition({ x, y });
    }
  }, [show, position]);

  const getArrowClasses = () => {
    const baseClasses = "absolute";
    
    switch (position) {
      case 'top':
        return `${baseClasses} top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-blue-600`;
      case 'bottom':
        return `${baseClasses} bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-blue-600`;
      case 'left':
        return `${baseClasses} left-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-b-[8px] border-l-[8px] border-t-transparent border-b-transparent border-l-blue-600`;
      case 'right':
        return `${baseClasses} right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-b-[8px] border-r-[8px] border-t-transparent border-b-transparent border-r-blue-600`;
      default:
        return '';
    }
  };

  return (
    <div className="relative inline-block">
      <div ref={triggerRef}>
        {children}
      </div>
      
      {show && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in-0 zoom-in-95 ${className}`}
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
          }}
        >
          Esta fase é consultiva e pode ser visualizada aqui
          <div className={getArrowClasses()} />
        </div>
      )}
    </div>
  );
};

export default PhaseTooltip;