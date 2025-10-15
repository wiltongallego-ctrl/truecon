import { Trophy, Home, Calendar, Users, CheckCircle2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
 
import { getNavigationDirection, applyBodyTransition } from "../../lib/pageTransitions";

interface BottomNavigationProps {
  currentPage: string;
  showPhase1Button?: boolean;
  showPhase2Button?: boolean;
  canCheckinToday?: boolean; // alinhar nome com páginas que usam o hook
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
  canCheckinToday = false,
  hasCompletedPhase2 = false,
  hasCompletedPhase1 = false,
  onPhase1Click,
  onPhase2Click,
  onPhase1CompletedClick
}: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Removido gate por status de fase para evitar ocultar botões indevidamente

  const navigateWithTransition = (targetRoute: string) => {
    const direction = getNavigationDirection(targetRoute, location.pathname);
    applyBodyTransition(direction);
    
    setTimeout(() => {
      navigate(targetRoute);
    }, 100);
  };

  // Classe de rótulos inline (movida para CSS dedicado do footer)
  const labelClass = "bottom-nav-label";

  // Determina página ativa usando prop ou pathname
  const activePage = (currentPage || (() => {
    const path = location.pathname;
    if (path.startsWith("/home")) return "home";
    if (path.startsWith("/ranking")) return "ranking";
    if (path.startsWith("/phase/1")) return "checkin";
    return "";
  })());

  return (
    <div className="bottom-nav">
      {/* Aumenta a altura do footer para descer o fundo preto e permitir a sobreposição do botão central */}
      <div className="bottom-nav-inner">
        {/* Grid com 3 colunas para espaçamento igual */}
        <div className="bottom-nav-grid">
          {/* Coluna esquerda */}
          <div className="bottom-nav-cell-left">
            {/* Ranking sempre à esquerda */}
            <button
              onClick={() => navigateWithTransition("/ranking")}
              className={`bottom-nav-btn ${activePage === 'ranking' ? 'bottom-nav-btn-active' : ''}`}
            >
              <Trophy className="w-5 h-5 text-white" />
              <span className={labelClass}>RANKING</span>
            </button>
          </div>

          {/* Coluna central com container quadrado arredondado para Home */}
          <div className="bottom-nav-cell-center">
            <div className="bottom-nav-home-shell">
              <button
                onClick={() => navigateWithTransition("/home")}
                className={`bottom-nav-home-btn ${activePage === 'home' ? 'bottom-nav-home-btn-active' : ''}`}
                aria-label="Home"
              >
                <Home className="w-7 h-7 text-primary" />
              </button>
            </div>
          </div>

          {/* Coluna direita */}
          <div className="bottom-nav-cell-right">
            {/* Check-in à direita – só aparece após cumprir Fase 1 */}
            {showPhase1Button && (
              <button
                id="phase1-button"
                onClick={onPhase1Click || (() => navigateWithTransition("/phase/1"))}
                className={`bottom-nav-btn ${activePage === 'checkin' ? 'bottom-nav-btn-active' : ''}`}
              >
                <Calendar className={`w-6 h-6 ${(canCheckinToday || hasCompletedPhase1) ? 'text-primary' : 'text-white'}`} />
                <span className={labelClass}>CHECK-IN</span>
              </button>
            )}
          </div>
        </div>

        {/* Rótulo central HOME */}
        {/* Rótulo HOME removido conforme solicitado */}
      </div>
    </div>
  );
};

export default BottomNavigation;