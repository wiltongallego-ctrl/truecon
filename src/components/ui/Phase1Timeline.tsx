import React from 'react';
import { CheckinDay } from '../../hooks/usePhase1Checkin';

interface Phase1TimelineProps {
  checkinDays: CheckinDay[];
  completedDays: number;
}

const Phase1Timeline: React.FC<Phase1TimelineProps> = ({ checkinDays, completedDays }) => {
  const totalDays = checkinDays.length;
  const progressPercentage = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  const getDayIcon = (day: CheckinDay) => {
    if (day.isCompleted) {
      return (
        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    
    if (day.isMissed) {
      return (
        <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg border-2 border-red-300">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }
    
    if (day.isAvailable) {
      return (
        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
      );
    }
    
    if (day.isToday) {
      return (
        <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
      );
    }
    
    return (
      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
      </div>
    );
  };

  const getDayStatus = (day: CheckinDay) => {
    if (day.isCompleted) return 'Concluído';
    if (day.isMissed) return 'Perdido';
    if (day.isAvailable) return 'Disponível';
    if (day.isToday) return 'Hoje';
    return 'Bloqueado';
  };

  const getDayStatusColor = (day: CheckinDay) => {
    if (day.isCompleted) return 'text-green-600';
    if (day.isMissed) return 'text-red-600';
    if (day.isAvailable) return 'text-blue-600';
    if (day.isToday) return 'text-orange-600';
    return 'text-gray-500';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const getDayName = (date: Date) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[date.getDay()];
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Barra de Progresso */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progresso do Ciclo</span>
          <span className="text-sm font-bold text-blue-600">{completedDays}/{totalDays} dias</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="text-center mt-2">
          <span className="text-xs text-gray-600">
            {progressPercentage.toFixed(0)}% completo
          </span>
        </div>
      </div>

      {/* Timeline dos Dias */}
      <div className="space-y-4">
        {checkinDays.map((day, index) => (
          <div key={day.day} className="flex items-center space-x-4">
            {/* Ícone do Dia */}
            <div className="flex-shrink-0 relative">
              {getDayIcon(day)}
              {/* Linha conectora (exceto no último item) */}
              {index < checkinDays.length - 1 && (
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-gray-300"></div>
              )}
            </div>

            {/* Informações do Dia */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Dia {day.day}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getDayName(day.date)} - {formatDate(day.date)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium ${getDayStatusColor(day)}`}>
                    {getDayStatus(day)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Legenda:</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-gray-600">Concluído</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-700 rounded-full flex items-center justify-center border border-red-300">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="text-gray-600 font-medium">Perdido</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
            <span className="text-gray-600">Disponível</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span className="text-gray-600">Hoje</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
            </div>
            <span className="text-gray-600">Bloqueado</span>
          </div>
        </div>
      </div>

      {/* Informação sobre Reset */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-xs font-medium text-blue-800">Check-ins disponíveis às 8h</p>
            <p className="text-xs text-blue-600 mt-1">
              Novos check-ins ficam disponíveis todos os dias às 8h da manhã.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Phase1Timeline;