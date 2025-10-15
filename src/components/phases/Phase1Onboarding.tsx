import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import BottomNavigation from "../ui/BottomNavigation";
import { usePhase1Checkin } from "@/hooks/usePhase1Checkin";
import Phase1Timeline from "@/components/ui/Phase1Timeline";
import Phase1CompletionModal from "@/components/modals/Phase1CompletionModal";
import Phase1TrackingModal from "@/components/modals/Phase1TrackingModal";
import FloatingButton from "@/components/ui/FloatingButton";

const Phase1Onboarding = () => {
  const navigate = useNavigate();
  
  const {
    checkinDays,
    currentDay,
    completedDays,
    isLoading,
    error,
    canCheckinToday,
    hasCompletedFirstCycle,
    showCompletionModal,
    showTrackingModal,
    nextCheckinTime,
    timeUntilNextCheckin,
    currentCycleStartDate,
    performCheckin,
    setShowCompletionModal,
    setShowTrackingModal
  } = usePhase1Checkin();

  const handleCheckin = async () => {
    if (!canCheckinToday) return;
    
    const success = await performCheckin();
    if (success) {
      // Sucesso será tratado pelo hook
    }
  };

  const getCheckinButtonText = () => {
    if (completedDays === 7) return "Ciclo Completo! 🎉";
    if (canCheckinToday) return `Fazer Check-in - Dia ${currentDay}`;
    if (nextCheckinTime) return `Próximo check-in: ${timeUntilNextCheckin}`;
    return "Check-in não disponível";
  };

  const getCheckinButtonStyle = () => {
    if (completedDays === 7) {
      return "w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-4 px-6 rounded-lg shadow-lg";
    }
    if (canCheckinToday) {
      return "w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg";
    }
    return "w-full bg-gray-300 text-gray-500 font-semibold py-4 px-6 rounded-lg cursor-not-allowed";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background page-content pb-20">
        <div className="max-w-md mx-auto p-5">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background page-content pb-20">
        <div className="max-w-md mx-auto p-5">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="icon" onClick={() => navigate("/home")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Fase 1: Onboarding</h1>
              <p className="text-sm text-muted-foreground">Check-in diário - 7 dias</p>
            </div>
          </div>
          
          <div className="text-center p-8">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Erro ao carregar dados</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-blue-500 hover:bg-blue-600">
              Tentar Novamente
            </Button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background page-content pb-20">
      <div className="max-w-md mx-auto p-5">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate("/home")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Fase 1: Onboarding</h1>
            <p className="text-sm text-muted-foreground">Check-in diário - 7 dias</p>
          </div>
        </div>

        {/* Introdução */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            🎯 Bem-vindo à sua jornada!
          </h2>
          <p className="text-gray-700 mb-4">
            Complete 7 check-ins diários para estabelecer o hábito e desbloquear novas funcionalidades.
          </p>
          <div className="flex items-center space-x-2 text-sm text-blue-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Check-ins ficam disponíveis às 8h da manhã</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-8">
          <Phase1Timeline 
            checkinDays={checkinDays} 
            completedDays={completedDays} 
          />
        </div>

        {/* Botão de Check-in */}
        <div className="mb-8">
          <button
            onClick={handleCheckin}
            disabled={!canCheckinToday}
            className={getCheckinButtonStyle()}
          >
            {getCheckinButtonText()}
          </button>
          
          {/* Informação adicional */}
          {!canCheckinToday && nextCheckinTime && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Próximo check-in disponível em: <span className="font-mono">{timeUntilNextCheckin}</span>
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Os check-ins ficam disponíveis às 8h da manhã
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{completedDays}</div>
              <div className="text-sm text-gray-600">Check-ins Feitos</div>
            </div>
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{7 - completedDays}</div>
              <div className="text-sm text-gray-600">Dias Restantes</div>
            </div>
          </div>
        </div>

        {/* Motivação */}
        {completedDays > 0 && completedDays < 7 && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">
                  Ótimo progresso! Continue assim! 🚀
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Você está construindo um hábito sólido. Faltam apenas {7 - completedDays} dias!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ciclo Completo */}
        {completedDays === 7 && (
          <div className="mb-8 p-6 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-xl font-bold text-green-800 mb-2">
                Parabéns! Ciclo Completo!
              </h3>
              <p className="text-green-700 mb-4">
                Você completou seus 7 dias de check-in. Seu próximo ciclo começará automaticamente às 8h da manhã.
              </p>
              <div className="text-sm text-green-600">
                ✨ Nova funcionalidade desbloqueada: Acompanhamento contínuo
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botão Flutuante (aparece após primeira conclusão) */}
      {hasCompletedFirstCycle && (
        <FloatingButton
          onClick={() => setShowTrackingModal(true)}
          completedDays={completedDays}
          isVisible={hasCompletedFirstCycle}
        />
      )}

      {/* Modais */}
      <Phase1CompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
      />

      <Phase1TrackingModal
        isOpen={showTrackingModal}
        onClose={() => setShowTrackingModal(false)}
        checkinDays={checkinDays}
        completedDays={completedDays}
        timeUntilNextCheckin={timeUntilNextCheckin}
        nextCheckinTime={nextCheckinTime}
        currentCycleStartDate={currentCycleStartDate}
      />

      <BottomNavigation />
    </div>
  );
};

export default Phase1Onboarding;
