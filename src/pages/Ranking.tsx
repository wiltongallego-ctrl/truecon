import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BottomNavigation from "../components/ui/BottomNavigation";
import { usePhase1Checkin } from "@/hooks/usePhase1Checkin";
import { Avatar } from "@/components/ui/avatar";
import { getNavigationDirection, applyPageTransition } from "@/lib/pageTransitions";

interface RankingUser {
  name: string | null;
  email: string | null;
  total_xp: number;
  avatar_url: string | null;
}

const Ranking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasCompletedFirstCycle, canCheckinToday, hasUserRecord, hasAnyCheckin } = usePhase1Checkin();
  
  const [topThree, setTopThree] = useState<RankingUser[]>([]);
  const [otherUsers, setOtherUsers] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasCompletedPhase1, setHasCompletedPhase1] = useState<boolean>(false);
  const [isPhase1Active, setIsPhase1Active] = useState<boolean>(false);

  const navigateWithTransition = (targetRoute: string) => {
    const direction = getNavigationDirection(targetRoute, location.pathname);
    const pageElement = document.querySelector('.page-content') as HTMLElement | null;

    if (pageElement && direction !== 'none') {
      applyPageTransition(pageElement, direction, false);
      setTimeout(() => navigate(targetRoute), 50);
    } else {
      navigate(targetRoute);
    }
  };

  useEffect(() => {
    checkAuth();
    fetchRanking();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/");
      return;
    }
    setCurrentUserId(user.id);
    // Carregar conclusão da Fase 1 para garantir visibilidade do botão no Ranking
    await fetchPhase1Completion(user.id);
  };

  const fetchPhase1Completion = async (userId: string) => {
    try {
      const { data: phase1Data } = await supabase
        .from("phases")
        .select("id, is_active")
        .eq("phase_number", 1)
        .maybeSingle();

      if (phase1Data?.id) {
        setIsPhase1Active(phase1Data.is_active);
        const { data: progress } = await supabase
          .from("user_phase_progress")
          .select("completed")
          .eq("user_id", userId)
          .eq("phase_id", phase1Data.id)
          .maybeSingle();
        setHasCompletedPhase1(!!progress?.completed);
      } else {
        setHasCompletedPhase1(false);
        setIsPhase1Active(false);
      }
    } catch (err) {
      console.warn("Falha ao verificar conclusão da Fase 1:", err);
      setHasCompletedPhase1(false);
      setIsPhase1Active(false);
    }
  };

  const fetchRanking = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("name, email, total_xp, avatar_url")
      .order("total_xp", { ascending: false });

    if (error) {
      console.error("Erro ao buscar ranking:", error);
      setLoading(false);
      return;
    }

    if (data) {
      setTopThree(data.slice(0, 3));
      setOtherUsers(data.slice(3));
    }
    setLoading(false);
  };

  const getUserInitial = (user: RankingUser) => {
    return user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
  };

  const getPodiumHeight = (position: number) => {
    if (position === 1) return "h-32";
    if (position === 2) return "h-24";
    return "h-20";
  };

  const getPodiumOrder = () => {
    if (topThree.length < 3) return topThree;
    return [topThree[1], topThree[0], topThree[2]]; // 2º, 1º, 3º
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Carregando ranking...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background page-content">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto p-5">
          <h1 className="text-2xl font-bold text-center text-card-foreground">
            🏆 Ranking
          </h1>
          <p className="text-xs text-center text-muted-foreground mt-1">
            Conquiste XP e suba no ranking!
          </p>
        </div>
      </div>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto bg-background pb-20">
        <div className="max-w-md mx-auto p-5">
          {/* Pódio - Top 3 */}
          {topThree.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-center text-card-foreground mb-6">
                🏆 Top 3 Ranking
              </h2>
              
              {/* Pódio Visual */}
              <div className="relative mb-6">
                <div className="flex items-end justify-center gap-4 px-4">
                  {getPodiumOrder().map((user, index) => {
                    const actualPosition = topThree.indexOf(user) + 1;
                    const displayPosition = index === 0 ? 2 : index === 1 ? 1 : 3;
                    
                    return (
                      <div
                        key={index}
                        className={`flex flex-col items-center ${
                          displayPosition === 1 ? "order-2 z-10" : displayPosition === 2 ? "order-1" : "order-3"
                        }`}
                      >
                        {/* Avatar com coroa para 1º lugar */}
                        <div className="relative mb-3">
                          {actualPosition === 1 && (
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-2xl">
                              👑
                            </div>
                          )}
                          <div
                            className={`rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                              actualPosition === 1
                                ? "w-24 h-24 text-3xl bg-gradient-to-br from-yellow-400 to-yellow-600 border-4 border-yellow-300"
                                : actualPosition === 2
                                ? "w-20 h-20 text-2xl bg-gradient-to-br from-gray-300 to-gray-500 border-4 border-gray-200"
                                : "w-18 h-18 text-xl bg-gradient-to-br from-orange-400 to-orange-600 border-4 border-orange-300"
                            }`}
                          >
                            {getUserInitial(user)}
                          </div>
                          <div
                            className={`absolute -bottom-2 -right-2 rounded-full flex items-center justify-center text-white font-bold shadow-md ${
                              actualPosition === 1
                                ? "w-8 h-8 text-sm bg-yellow-500"
                                : actualPosition === 2
                                ? "w-7 h-7 text-xs bg-gray-400"
                                : "w-7 h-7 text-xs bg-orange-500"
                            }`}
                          >
                            {actualPosition}º
                          </div>
                        </div>

                        {/* Nome */}
                        <div className={`font-semibold text-center max-w-[90px] truncate mb-1 ${
                          actualPosition === 1 ? "text-base" : "text-sm"
                        }`}>
                          {user.name || user.email?.split("@")[0]}
                        </div>

                        {/* XP */}
                        <div className={`font-bold text-primary mb-2 ${
                          actualPosition === 1 ? "text-lg" : "text-sm"
                        }`}>
                          {user.total_xp} XP
                        </div>

                        {/* Base do pódio com altura diferenciada */}
                        <div
                          className={`w-24 rounded-t-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg ${
                            actualPosition === 1
                              ? "h-20 bg-gradient-to-t from-yellow-500 to-yellow-400"
                              : actualPosition === 2
                              ? "h-16 bg-gradient-to-t from-gray-400 to-gray-300"
                              : "h-12 bg-gradient-to-t from-orange-500 to-orange-400"
                          }`}
                        >
                          {actualPosition === 1 ? "🥇" : actualPosition === 2 ? "🥈" : "🥉"}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Base comum do pódio */}
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-b-lg mx-8 shadow-md"></div>
              </div>
            </div>
          )}

          {/* Lista dos demais usuários */}
          {otherUsers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px bg-border flex-1"></div>
                <h3 className="text-sm font-semibold text-muted-foreground px-3">
                  Demais Participantes
                </h3>
                <div className="h-px bg-border flex-1"></div>
              </div>
              
              <div className="space-y-2">
                {otherUsers.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Posição */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border-2 border-slate-300">
                      <span className="text-sm font-bold text-slate-600">
                        {index + 4}º
                      </span>
                    </div>
                    
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {getUserInitial(user)}
                    </div>
                    
                    {/* Informações do usuário */}
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-semibold text-card-foreground truncate">
                        {user.name || user.email?.split("@")[0]}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </div>
                    </div>
                    
                    {/* XP */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {user.total_xp}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        XP
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {topThree.length === 0 && otherUsers.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
              Nenhum usuário no ranking ainda.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        currentPage="ranking" 
        showPhase1Button={hasAnyCheckin && isPhase1Active} 
        canCheckinToday={canCheckinToday}
        hasCompletedPhase1={hasCompletedFirstCycle || hasCompletedPhase1}
      />
    </div>
  );
};

export default Ranking;
