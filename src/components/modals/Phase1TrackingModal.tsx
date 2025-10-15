import React from 'react';
import { CheckinDay } from '../../hooks/usePhase1Checkin';

interface Phase1TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkinDays: CheckinDay[];
  completedDays: number;
  timeUntilNextCheckin: string;
  nextCheckinTime: Date | null;
  currentCycleStartDate: Date | null;
}

const Phase1TrackingModal: React.FC<Phase1TrackingModalProps> = ({
  isOpen,
  onClose,
  checkinDays,
  completedDays,
  timeUntilNextCheckin,
  nextCheckinTime,
  currentCycleStartDate
}) => {
  if (!isOpen) return null;

  const progressPercentage = (completedDays / 7) * 100;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getDayName = (date: Date) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[date.getDay()];
  };

  const getBadgeColor = (day: CheckinDay) => {
    if (day.isCompleted) return 'from-green-400 to-green-600';
    if (day.isAvailable) return 'from-blue-400 to-blue-600';
    if (day.isToday) return 'from-yellow-400 to-orange-500';
    return 'from-gray-300 to-gray-400';
  };

  const getBadgeIcon = (day: CheckinDay) => {
    if (day.isCompleted) {
      return (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    
    if (day.isAvailable) {
      return <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>;
    }
    
    if (day.isToday) {
      return (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    }
    
    return <div className="w-2 h-2 bg-gray-600 rounded-full"></div>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            📊 Acompanhamento
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progresso Geral */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">Progresso do Ciclo Atual</span>
            <span className="text-lg font-bold text-blue-600">{completedDays}/7</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-center mt-2">
            <span className="text-sm text-gray-600">
              {progressPercentage.toFixed(0)}% completo
            </span>
          </div>
        </div>

        {/* Badges dos Dias */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Badges do Ciclo</h3>
          <div className="grid grid-cols-7 gap-2">
            {checkinDays.map((day) => (
              <div key={day.day} className="text-center">
                <div className={`w-12 h-12 bg-gradient-to-r ${getBadgeColor(day)} rounded-full flex items-center justify-center mb-2 shadow-lg ${day.isAvailable ? 'animate-pulse' : ''}`}>
                  {getBadgeIcon(day)}
                </div>
                <span className="text-xs font-medium text-gray-600">
                  Dia {day.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Countdown para Próximo Check-in */}
        {nextCheckinTime && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Próximo Check-in
            </h3>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2 font-mono">
                {timeUntilNextCheckin}
              </div>
              <p className="text-sm text-gray-600">
                {getDayName(nextCheckinTime)} - {formatDate(nextCheckinTime)} às {formatTime(nextCheckinTime)}
              </p>
            </div>
          </div>
        )}

        {/* Informações do Ciclo */}
        <div className="mb-6 space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Informações do Ciclo</h3>
          
          {currentCycleStartDate && (
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Início do Ciclo:</span>
              <span className="text-sm font-medium text-gray-800">
                {formatDate(currentCycleStartDate)}
              </span>
            </div>
          )}
          
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Dias Restantes:</span>
            <span className="text-sm font-medium text-gray-800">
              {7 - completedDays} dias
            </span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Status:</span>
            <span className={`text-sm font-medium ${completedDays === 7 ? 'text-green-600' : 'text-blue-600'}`}>
              {completedDays === 7 ? 'Ciclo Completo!' : 'Em Progresso'}
            </span>
          </div>
        </div>

        {/* Dicas */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
            <svg className="w-4 h-4 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Dica
          </h4>
          <p className="text-sm text-yellow-700">
            {completedDays === 7 
              ? "Parabéns! Seu ciclo será resetado automaticamente às 8h da manhã para começar uma nova semana."
              : "Mantenha a consistência! Faça seu check-in diário após às 8h da manhã."
            }
          </p>
        </div>

        {/* Botão de Fechar */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Phase1TrackingModal;