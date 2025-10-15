import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { toast } from "@/lib/sweetAlert";
import TrueLogo from "@/components/TrueLogo";
import { Home as HomeIcon, Trophy, Users, LogOut, Pencil, Settings, Calendar, UserPlus, Palette, Target, Zap, Presentation } from "lucide-react";
import BottomNavigation from "../components/ui/BottomNavigation";
import { Button } from "@/components/ui/button";
import Phase1Modal from "@/components/modals/Phase1Modal";
import Phase2Modal from "@/components/modals/Phase2Modal";
import Phase3Modal from "@/components/modals/Phase3Modal";
import Phase4Modal from "@/components/modals/Phase4Modal";
import PhaseTooltipModal from "@/components/ui/PhaseTooltipModal";
import { getNavigationDirection, applyPageTransition } from "@/lib/pageTransitions";

interface Phase {
  id: string;
  phase_number: number;
  title: string;
  description: string;
  is_active: boolean;
}

interface Profile {
  total_xp: number;
  name: string | null;
  email: string | null;
}

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [phase1ModalOpen, setPhase1ModalOpen] = useState(false);
  const [phase2ModalOpen, setPhase2ModalOpen] = useState(false);
  const [phase3ModalOpen, setPhase3ModalOpen] = useState(false);
  const [phase4ModalOpen, setPhase4ModalOpen] = useState(false);
  const [hasCompletedPhase2, setHasCompletedPhase2] = useState(false);
  const [hasCompletedPhase1, setHasCompletedPhase1] = useState(false);
  const [hasEverCheckedIn, setHasEverCheckedIn] = useState(false);
  const [canCheckInToday, setCanCheckInToday] = useState(true);
  const [userRanking, setUserRanking] = useState<number | null>(null);
  const [showPhase1Tooltip, setShowPhase1Tooltip] = useState(false);
  const [showPhase2Tooltip, setShowPhase2Tooltip] = useState(false);
  const [hasShownPhase1Tooltip, setHasShownPhase1Tooltip] = useState(false);
  const [hasShownPhase2Tooltip, setHasShownPhase2Tooltip] = useState(false);
  // Função para navegar com transição
  const navigateWithTransition = (targetRoute: string) => {
    const direction = getNavigationDirection(targetRoute, location.pathname);
    const pageElement = document.querySelector('.page-content') as HTMLElement;
    
    if (pageElement && direction !== 'none') {
      // Adiciona classe de transição de saída
      applyPageTransition(pageElement, direction, false);
      
      // Navega após um pequeno delay para permitir o início da animação
      setTimeout(() => {
        navigate(targetRoute);
      }, 50);
    } else {
      navigate(targetRoute);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
        } else {
          navigate("/auth");
        }
      } catch (error) {
        console.error('Error checking session:', error);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (!session) {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch user profile and phases
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Verificar se os tooltips já foram mostrados para este usuário
      const hasShownPhase1 = localStorage.getItem(`hasShownPhase1Tooltip_${user.id}`) === 'true';
      const hasShownPhase2 = localStorage.getItem(`hasShownPhase2Tooltip_${user.id}`) === 'true';
      
      setHasShownPhase1Tooltip(hasShownPhase1);
      setHasShownPhase2Tooltip(hasShownPhase2);

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("total_xp, name, email, last_checkin_at")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        
        // Verificar se já fez check-in hoje
        if (profileData.last_checkin_at) {
          setHasEverCheckedIn(true);
          const lastCheckin = new Date(profileData.last_checkin_at);
          const now = new Date();
          const hoursSinceLastCheckin = (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60);
          
          // Se fez check-in nas últimas 24 horas, não pode fazer novamente
          setCanCheckInToday(hoursSinceLastCheckin >= 24);
        } else {
          // Nunca fez check-in, pode fazer
          setHasEverCheckedIn(false);
          setCanCheckInToday(true);
        }

        // Buscar ranking do usuário
        const { data: rankingData } = await supabase
          .from("profiles")
          .select("user_id, total_xp")
          .order("total_xp", { ascending: false });

        if (rankingData) {
          const userPosition = rankingData.findIndex(p => p.user_id === user.id) + 1;
          setUserRanking(userPosition > 0 ? userPosition : null);
        }
      }

      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      setIsAdmin(!!roleData);

      // Verificar se o usuário completou a fase 1
      const phase1Data = await supabase
        .from("phases")
        .select("id, is_active")
        .eq("phase_number", 1)
        .maybeSingle();

      if (phase1Data.data) {
        const { data: phase1Progress } = await supabase
          .from("user_phase_progress")
          .select("completed")
          .eq("user_id", user.id)
          .eq("phase_id", phase1Data.data.id)
          .maybeSingle();

        setHasCompletedPhase1(phase1Progress?.completed || false);
      }

      // Verificar se o usuário completou a fase 2
      const phase2Data = await supabase
        .from("phases")
        .select("id, is_active")
        .eq("phase_number", 2)
        .maybeSingle();

      if (phase2Data.data) {
        const { data: phase2Progress } = await supabase
          .from("user_phase_progress")
          .select("completed")
          .eq("user_id", user.id)
          .eq("phase_id", phase2Data.data.id)
          .maybeSingle();

        setHasCompletedPhase2(phase2Progress?.completed || false);
      }

      // Buscar todas as fases ativas (independente de estarem completadas)
      const { data: phasesData } = await supabase
        .from("phases")
        .select("id, phase_number, title, description, is_active")
        .eq("is_active", true)
        .order("display_order");

      if (phasesData) {
        setPhases(phasesData);
      }
    };

    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Logout realizado com sucesso!');
      navigate('/auth');
    } catch (error: any) {
      toast.error('Erro ao fazer logout');
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white page-content">
      {/* Header com logo e perfil do usuário */}
      <div className="bg-white shadow-lg border-b border-gray-100/50 backdrop-blur-sm">
        <div className="max-w-md mx-auto px-6 py-8">
          {/* Logo Truechange - Posição destacada no topo */}
          <div className="flex justify-center mb-8">
            <div className="transform hover:scale-105 transition-all duration-300 ease-out">
              <div className="text-primary scale-150">
                <TrueLogo />
              </div>
            </div>
          </div>
          
          {/* User Info */}
          <div className="flex flex-col gap-6">
            {/* Header com informações do usuário */}
            <div className="flex flex-col gap-4">
              {/* Linha superior com foto de perfil e informações */}
              <div className="flex items-center gap-4">
                {/* Foto de perfil */}
                <div className="relative group cursor-pointer transform hover:scale-105 transition-all duration-300">
                  {user?.user_metadata?.picture || user?.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.picture || user.user_metadata.avatar_url} 
                      alt="Foto de perfil"
                      className="w-20 h-20 rounded-full object-cover shadow-xl border-4 border-white ring-2 ring-primary/20"
                      onError={(e) => {
                        // Fallback para inicial se a imagem não carregar
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-20 h-20 rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center text-white text-2xl font-bold shadow-xl border-4 border-white ring-2 ring-primary/20 ${user?.user_metadata?.picture || user?.user_metadata?.avatar_url ? 'hidden' : 'flex'}`}
                  >
                    {profile?.name?.[0]?.toUpperCase() || user?.user_metadata?.name?.[0]?.toUpperCase() || user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white border-2 border-primary/20 rounded-full flex items-center justify-center shadow-lg hover:bg-primary hover:text-white transition-all duration-200 hover:scale-110">
                    <Pencil className="w-4 h-4 text-gray-600 hover:text-white" />
                  </button>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                {/* Informações do usuário - expandido para ocupar mais espaço */}
                <div className="flex-1 flex flex-col gap-1">
                  <div className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                    {profile?.name || user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    {profile?.email || user?.email}
                  </div>
                </div>
              </div>
              
              {/* Linha separada para os botões - melhor posicionamento */}
              <div className="flex justify-end gap-3 mt-2">
                <button 
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:shadow-md"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => navigate("/admin")}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    <Settings className="w-4 h-4" />
                    Admin
                  </button>
                )}
              </div>
            </div>

            {/* Cards de XP e Ranking - minimizados */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center justify-between p-3 bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100/60 rounded-xl border border-blue-200/30 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">{profile?.total_xp || 0}</div>
                      <div className="text-xs font-medium text-blue-600/70">XP Total</div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-between p-3 bg-gradient-to-br from-purple-50 via-purple-50/80 to-purple-100/60 rounded-xl border border-purple-200/30 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600">{userRanking ? `#${userRanking}` : '--'}</div>
                      <div className="text-xs font-medium text-purple-600/70">Posição</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo scrollável do meio - Fases */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/30 to-background pb-20">
        <div className="max-w-md mx-auto p-6">
          <div className="flex flex-col gap-6">
            <div className="text-xl font-bold text-gray-900 text-center tracking-tight">
              🎯 Fases Liberadas
            </div>
            {phases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4 animate-pulse">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-sm text-gray-600 text-center font-medium mb-2">
                  Nenhuma fase liberada!
                </div>
                <div className="text-xs text-gray-500 text-center">
                  Quando uma fase for liberada, aparecerá aqui.
                </div>
              </div>
            ) : (
              <div className={`${
                phases.filter(phase => !(phase.phase_number === 1 && hasEverCheckedIn)).length === 1 
                  ? 'flex justify-center' 
                  : 'grid grid-cols-2 gap-4'
              }`}>
                {phases.map((phase, index) => {
                  // Não mostrar o card da Fase 1 se o usuário já fez pelo menos um check-in
                  if (phase.phase_number === 1 && hasEverCheckedIn) {
                    return null;
                  }

                  // Função para obter o ícone da fase
                  const getPhaseIcon = (phaseNumber: number) => {
                    switch (phaseNumber) {
                      case 1:
                        return <Calendar className="w-10 h-10" />;
                      case 2:
                        return <UserPlus className="w-10 h-10" />;
                      case 3:
                        return <Palette className="w-10 h-10" />;
                      case 4:
                        return <Target className="w-10 h-10" />;
                      case 5:
                        return <Zap className="w-10 h-10" />;
                      case 6:
                        return <Presentation className="w-10 h-10" />;
                      default:
                        return <Target className="w-10 h-10" />;
                    }
                  };

                  const isDisabled = phase.phase_number === 1 && !canCheckInToday;

                  return (
                    <div
                      key={phase.id}
                      className={`relative aspect-square flex flex-col items-center justify-center p-6 bg-white border-2 rounded-2xl shadow-sm transition-all duration-300 cursor-pointer transform hover:scale-105 animate-fade-in-up ${
                        isDisabled 
                          ? 'border-gray-200 opacity-60' 
                          : 'border-gray-200 hover:border-primary/40 hover:shadow-lg hover:bg-gradient-to-br hover:from-white hover:to-primary/5'
                      }`}
                      style={{
                        animationDelay: `${index * 100}ms`
                      }}
                      onClick={() => {
                        if (isDisabled) return;
                        
                        if (phase.phase_number === 2) {
                          setPhase2ModalOpen(true);
                        } else if (phase.phase_number === 3) {
                          setPhase3ModalOpen(true);
                        } else if (phase.phase_number === 4) {
                          setPhase4ModalOpen(true);
                        } else {
                          navigate(`/phase/${phase.phase_number}`);
                        }
                      }}
                    >
                      {/* Número da fase - canto superior direito */}
                      <div className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md transition-all duration-300 ${
                        isDisabled 
                          ? 'bg-gray-400' 
                          : 'bg-gradient-to-br from-primary to-primary/80 group-hover:scale-110'
                      }`}>
                        {phase.phase_number}
                      </div>
                      
                      {/* Ícone da fase - centro */}
                      <div className={`mb-4 transition-all duration-300 ${
                        isDisabled 
                          ? 'text-gray-400' 
                          : 'text-primary group-hover:scale-110'
                      }`}>
                        {getPhaseIcon(phase.phase_number)}
                      </div>
                      
                      {/* Título da fase */}
                      <div className="text-center">
                        <div className={`text-base font-bold mb-1 transition-colors duration-300 ${
                          isDisabled 
                            ? 'text-gray-400' 
                            : 'text-gray-900'
                        }`}>
                          Fase {phase.phase_number}
                        </div>
                        <div className={`text-xs font-medium px-3 py-1 rounded-full transition-all duration-300 ${
                          isDisabled 
                            ? 'text-gray-400 bg-gray-100' 
                            : 'text-primary bg-primary/10'
                        }`}>
                          {isDisabled ? 'Concluída' : 'Disponível'}
                        </div>
                      </div>

                      {/* Efeito de brilho no hover */}
                      {!isDisabled && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        currentPage="home"
        showPhase1Button={hasCompletedPhase1}
        showPhase2Button={hasCompletedPhase2}
        canCheckInToday={canCheckInToday}
        hasCompletedPhase2={hasCompletedPhase2}
        onPhase1Click={() => setPhase1ModalOpen(true)}
        onPhase2Click={() => setPhase2ModalOpen(true)}
      />

      {/* Phase Tooltip Modals */}
      <PhaseTooltipModal
        isOpen={showPhase1Tooltip}
        onClose={() => setShowPhase1Tooltip(false)}
        targetButtonId="phase1-button"
        phaseNumber={1}
      />
      <PhaseTooltipModal
        isOpen={showPhase2Tooltip}
        onClose={() => setShowPhase2Tooltip(false)}
        targetButtonId="phase2-button"
        phaseNumber={2}
      />

      {/* Phase Modals */}
      <Phase1Modal 
        open={phase1ModalOpen} 
        onOpenChange={(open) => {
          setPhase1ModalOpen(open);
          if (!open && user) {
            // Recarregar dados quando fechar o modal
            const refreshData = async () => {
              // Atualizar perfil
              const { data: profileData } = await supabase
                .from("profiles")
                .select("total_xp, name, email, last_checkin_at")
                .eq("user_id", user.id)
                .single();

              if (profileData) {
                setProfile(profileData);
                
                // Verificar se já fez check-in hoje
                if (profileData.last_checkin_at) {
                  setHasEverCheckedIn(true);
                  const lastCheckin = new Date(profileData.last_checkin_at);
                  const now = new Date();
                  const hoursSinceLastCheckin = (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60);
                  
                  // Se fez check-in nas últimas 24 horas, não pode fazer novamente
                  setCanCheckInToday(hoursSinceLastCheckin >= 24);
                } else {
                  // Nunca fez check-in, pode fazer
                  setHasEverCheckedIn(false);
                  setCanCheckInToday(true);
                }
              }

              // Atualizar fases
              const { data: phasesData } = await supabase
                .from("phases")
                .select("id, phase_number, title, description, is_active")
                .eq("is_active", true)
                .order("display_order");
              setPhases(phasesData || []);
            };
            refreshData();
          }
        }}
        onPhaseCompleted={() => {
          // Verificar se o tooltip já foi mostrado
          if (user && !hasShownPhase1Tooltip) {
            setTimeout(() => setShowPhase1Tooltip(true), 1000);
            setHasShownPhase1Tooltip(true);
            localStorage.setItem(`hasShownPhase1Tooltip_${user.id}`, 'true');
          }
        }}
      />
      <Phase2Modal 
        open={phase2ModalOpen} 
        onOpenChange={(open) => {
          setPhase2ModalOpen(open);
          if (!open && user) {
            // Recarregar dados quando fechar o modal
            const refreshData = async () => {
              const phase2Data = await supabase
                .from("phases")
                .select("id")
                .eq("phase_number", 2)
                .maybeSingle();

              if (phase2Data.data) {
                const { data: phase2Progress } = await supabase
                  .from("user_phase_progress")
                  .select("completed")
                  .eq("user_id", user.id)
                  .eq("phase_id", phase2Data.data.id)
                  .maybeSingle();
                setHasCompletedPhase2(phase2Progress?.completed || false);
              }

              // Atualizar fases
              const { data: progressData } = await supabase
                .from("user_phase_progress")
                .select("phase_id, completed")
                .eq("user_id", user.id)
                .eq("completed", true);

              const completedPhaseIds = progressData?.map(p => p.phase_id) || [];

              let phasesQuery = supabase
                .from("phases")
                .select("id, phase_number, title, description, is_active")
                .eq("is_active", true);

              if (completedPhaseIds.length > 0) {
                phasesQuery = phasesQuery.not("id", "in", `(${completedPhaseIds.join(",")})`);
              }
              const { data: phasesData } = await phasesQuery.order("display_order");
              setPhases(phasesData || []);
            };
            refreshData();
          }
        }}
        onPhaseCompleted={() => {
          // Verificar se o tooltip já foi mostrado
          if (user && !hasShownPhase2Tooltip) {
            setTimeout(() => setShowPhase2Tooltip(true), 1000);
            setHasShownPhase2Tooltip(true);
            localStorage.setItem(`hasShownPhase2Tooltip_${user.id}`, 'true');
          }
        }}
      />
      <Phase3Modal 
        open={phase3ModalOpen} 
        onOpenChange={(open) => {
          setPhase3ModalOpen(open);
          if (!open && user) {
            // Recarregar dados quando fechar o modal
            const refreshData = async () => {
              // Atualizar perfil
              const { data: profileData } = await supabase
                .from("profiles")
                .select("total_xp, name, email, last_checkin_at")
                .eq("user_id", user.id)
                .single();

              if (profileData) {
                setProfile(profileData);
                
                // Verificar se já fez check-in hoje
                if (profileData.last_checkin_at) {
                  setHasEverCheckedIn(true);
                  const lastCheckin = new Date(profileData.last_checkin_at);
                  const now = new Date();
                  const hoursSinceLastCheckin = (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60);
                  
                  // Se fez check-in nas últimas 24 horas, não pode fazer novamente
                  setCanCheckInToday(hoursSinceLastCheckin >= 24);
                } else {
                  // Nunca fez check-in, pode fazer
                  setHasEverCheckedIn(false);
                  setCanCheckInToday(true);
                }
              }

              // Atualizar fases
              const { data: progressData } = await supabase
                .from("user_phase_progress")
                .select("phase_id, completed")
                .eq("user_id", user.id)
                .eq("completed", true);

              const completedPhaseIds = progressData?.map(p => p.phase_id) || [];

              let phasesQuery = supabase
                .from("phases")
                .select("id, phase_number, title, description, is_active")
                .eq("is_active", true);

              if (completedPhaseIds.length > 0) {
                phasesQuery = phasesQuery.not("id", "in", `(${completedPhaseIds.join(",")})`);
              }
              const { data: phasesData } = await phasesQuery.order("display_order");
              setPhases(phasesData || []);
            };
            refreshData();
          }
        }}
      />
      <Phase4Modal 
        open={phase4ModalOpen}
        onOpenChange={(open) => {
          setPhase4ModalOpen(open);
          if (!open && user) {
            // Recarregar dados quando fechar o modal
            const refreshData = async () => {
              // Atualizar perfil
              const { data: profileData } = await supabase
                .from("profiles")
                .select("total_xp, name, email")
                .eq("user_id", user.id)
                .single();

              if (profileData) {
                setProfile(profileData);
              }

              // Atualizar fases
              const { data: progressData } = await supabase
                .from("user_phase_progress")
                .select("phase_id, completed")
                .eq("user_id", user.id)
                .eq("completed", true);

              const completedPhaseIds = progressData?.map(p => p.phase_id) || [];

              let phasesQuery = supabase
                .from("phases")
                .select("id, phase_number, title, description, is_active")
                .eq("is_active", true);

              if (completedPhaseIds.length > 0) {
                phasesQuery = phasesQuery.not("id", "in", `(${completedPhaseIds.join(",")})`);
              }
              const { data: phasesData } = await phasesQuery.order("display_order");
              setPhases(phasesData || []);
            };
            refreshData();
          }
        }}
      />
    </div>
  );
};

export default Home;
