import { Trophy, Home, Calendar, Users, CheckCircle2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getNavigationDirection, applyBodyTransition } from "../../lib/pageTransitions";

interface BottomNavigationProps {
  currentPage: string;
  showPhase1Button?: boolean;
  showPhase2Button?: boolean;
  canCheckInToday?: boolean;
  hasCompletedPhase2?: boolean;
  hasCompletedPhase1?: boolean;
  onPhase1Click?: () => void;
  onPhase2Click?: () => void;
  onPhase1CompletedClick?: () => void;
}

const BottomNavigation = ({ 
  currentPage,
  showPhase1Button = false,
  showPhase2Button = false,
  canCheckInToday = false,
  hasCompletedPhase2 = false,
  hasCompletedPhase1 = false,
  onPhase1Click,
  onPhase2Click,
  onPhase1CompletedClick
}: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [phase1Active, setPhase1Active] = useState(true);
  const [phase2Active, setPhase2Active] = useState(true);

  useEffect(() => {
    const checkPhasesStatus = async () => {
      // Verificar status da fase 1
      const { data: phase1Data } = await supabase
        .from("phases")
        .select("is_active")
        .eq("phase_number", 1)
        .maybeSingle();

      // Verificar status da fase 2
      const { data: phase2Data } = await supabase
        .from("phases")
        .select("is_active")
        .eq("phase_number", 2)
        .maybeSingle();

      setPhase1Active(phase1Data?.is_active || false);
      setPhase2Active(phase2Data?.is_active || false);
    };

    checkPhasesStatus();
  }, []);

  const navigateWithTransition = (targetRoute: string) => {
    const direction = getNavigationDirection(targetRoute, location.pathname);
    applyBodyTransition(direction);
    
    setTimeout(() => {
      navigate(targetRoute);
    }, 100);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#040404] shadow-lg z-40">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex items-center justify-between relative">
          {/* Container esquerdo */}
          <div className="flex items-center gap-4">
            {/* Botão Ranking */}
            <button
              onClick={() => navigateWithTransition("/ranking")}
              className={`h-9 w-9 flex items-center justify-center rounded-[5px] transition-colors ${
                currentPage === 'ranking' ? 'bg-white/10' : 'hover:bg-white/10'
              }`}
            >
              <Trophy className="w-5 h-5 text-white" />
            </button>

            {/* Botão Fase 1 (se disponível, ativa e NÃO concluída) */}
            {showPhase1Button && phase1Active && !hasCompletedPhase1 && (
              <button 
                id="phase1-button"
                onClick={onPhase1Click || (() => navigateWithTransition("/phase/1"))}
                className={`h-9 w-9 flex items-center justify-center rounded-[5px] hover:bg-white/10 transition-colors ${
                  canCheckInToday ? 'pulse-green' : ''
                }`}
              >
                <Calendar className={`w-5 h-5 ${canCheckInToday ? 'text-green-400' : 'text-white'}`} />
              </button>
            )}

            {/* Botão Fase 1 Concluída (se concluída) */}
            {hasCompletedPhase1 && (
              <div className="relative">
                <button 
                  id="phase1-completed-button"
                  onClick={onPhase1CompletedClick}
                  className="h-9 w-9 flex items-center justify-center rounded-[5px] hover:bg-white/10 transition-colors bg-green-600/20"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </button>
              </div>
            )}
          </div>
          
          {/* Botão Home sempre centralizado */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => navigateWithTransition("/home")}
              className={`h-9 w-9 flex items-center justify-center rounded-[5px] transition-colors ${
                currentPage === 'home' ? 'bg-white/10' : 'hover:bg-white/10'
              }`}
            >
              <Home className="w-5 h-5 text-primary" />
            </button>
          </div>

          {/* Container direito */}
          <div className="flex items-center gap-4">
            {/* Botão Fase 2 (se disponível, ativa e completada) */}
            {showPhase2Button && phase2Active && (
              <button 
                id="phase2-button"
                onClick={onPhase2Click}
                className="h-9 w-9 flex items-center justify-center rounded-[5px] hover:bg-white/10 transition-colors"
              >
                <Users className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomNavigation;