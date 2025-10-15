import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/sweetAlert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Trophy, ArrowLeft, Clock } from "lucide-react";
import { User } from "@supabase/supabase-js";
import CheckinModal from "@/components/modals/CheckinModal";
import CheckinSuccessModal from "@/components/modals/CheckinSuccessModal";
import BottomNavigation from "../ui/BottomNavigation";

const Phase1Onboarding = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [nextCheckInTime, setNextCheckInTime] = useState<Date | null>(null);
  const [streak, setStreak] = useState(0);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [phaseXP, setPhaseXP] = useState(10); // XP configurado para a fase

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchProfile(user.id);
        fetchPhaseXP(); // Buscar XP configurado da fase
      }
    });
  }, []);

  const fetchPhaseXP = async () => {
    try {
      const { data: phase1 } = await supabase
        .from("phases")
        .select("xp_reward")
        .eq("phase_number", 1)
        .maybeSingle();

      setPhaseXP(phase1?.xp_reward || 10);
    } catch (error) {
      console.error("Erro ao buscar XP da fase:", error);
      setPhaseXP(10); // Fallback
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    
    if (data) {
      setProfile(data);
      checkCanCheckIn(data.last_checkin_at);
      
      // Calcular streak baseado nos check-ins consecutivos
      const calculatedStreak = await calculateStreak(userId, data.last_checkin_at);
      setStreak(calculatedStreak);
    }
  };

  // Função para calcular o streak baseado nos check-ins consecutivos
  const calculateStreak = async (userId: string, lastCheckinAt: string | null): Promise<number> => {
    if (!lastCheckinAt) return 0;

    const lastCheckin = new Date(lastCheckinAt);
    const now = new Date();
    const hoursSinceLastCheckin = (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60);

    // Se passou mais de 48 horas desde o último check-in, o streak foi quebrado
    if (hoursSinceLastCheckin > 48) {
      return 0;
    }

    // Para simplificar, vamos calcular o streak baseado na diferença de dias
    // desde o primeiro check-in até hoje, assumindo check-ins diários
    const firstCheckin = new Date(lastCheckinAt);
    const daysDifference = Math.floor((now.getTime() - firstCheckin.getTime()) / (1000 * 60 * 60 * 24));
    
    // Se o usuário fez check-in recentemente (últimas 24-48h), conta como streak ativo
    if (hoursSinceLastCheckin <= 48) {
      return Math.max(1, daysDifference + 1);
    }

    return 0;
  };

  const checkCanCheckIn = (lastCheckinAt: string | null) => {
    if (!lastCheckinAt) {
      // Nunca fez check-in
      setCanCheckIn(true);
      setShowCheckinModal(true);
      return;
    }

    const lastCheckin = new Date(lastCheckinAt);
    const now = new Date();
    const hoursSinceLastCheckin = (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastCheckin >= 24) {
      // Pode fazer check-in
      setCanCheckIn(true);
      setShowCheckinModal(true);
      setNextCheckInTime(null);
    } else {
      // Ainda não pode fazer check-in
      setCanCheckIn(false);
      const nextTime = new Date(lastCheckin.getTime() + (24 * 60 * 60 * 1000));
      setNextCheckInTime(nextTime);
    }
  };

  const handleCheckIn = async () => {
    if (!user || !canCheckIn) return;

    try {
      // Buscar o XP configurado para a Fase 1
      const { data: phase1 } = await supabase
        .from("phases")
        .select("xp_reward")
        .eq("phase_number", 1)
        .maybeSingle();

      const xpToAward = phase1?.xp_reward || 10; // Fallback para 10 XP se não configurado
      const now = new Date();
      const newXP = (profile?.total_xp || 0) + xpToAward;
      
      const { error } = await supabase
        .from("profiles")
        .update({ 
          total_xp: newXP,
          last_checkin_at: now.toISOString()
        })
        .eq("user_id", user.id);

      if (error) {
        toast.error("Erro ao fazer check-in");
        return;
      }

      setCanCheckIn(false);
      
      // Calcular novo streak após o check-in
      const newStreak = await calculateStreak(user.id, now.toISOString());
      setStreak(newStreak);
      
      setXpGained(xpToAward);
      setShowCheckinModal(false);
      setShowSuccessModal(true);
      fetchProfile(user.id);
    } catch (error) {
      console.error("Erro ao fazer check-in:", error);
      toast.error("Erro ao fazer check-in");
    }
  };

  const getTimeRemaining = () => {
    if (!nextCheckInTime) return "";
    
    const now = new Date();
    const diff = nextCheckInTime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-background page-content pb-20">
      <div className="max-w-md mx-auto p-5">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/home")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Fase 1: Onboarding</h1>
            <p className="text-sm text-muted-foreground">Check-in diário</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Card de Check-in */}
          <Card className="p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Check-in Diário</h2>
                <p className="text-sm text-muted-foreground">
                  Faça seu check-in diário e ganhe {phaseXP} XP!
                </p>
              </div>

              {canCheckIn ? (
                <Button 
                  className="w-full" 
                  onClick={handleCheckIn}
                  size="lg"
                >
                  Fazer Check-in (+10 XP)
                </Button>
              ) : (
                <div className="w-full p-4 bg-muted border rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium">Próximo check-in disponível em:</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">{getTimeRemaining()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Você pode fazer check-in a cada 24 horas
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Card de Streak */}
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Sequência de Check-ins</h3>
                <p className="text-2xl font-bold text-primary">{streak} dias</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Continue fazendo check-in para manter sua sequência!
                </p>
              </div>
            </div>
          </Card>

          {/* Objetivos da Fase */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Objetivos desta fase</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                <span className="text-sm">Completar seu perfil</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                <span className="text-sm text-muted-foreground">Fazer check-in por 7 dias consecutivos</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                <span className="text-sm text-muted-foreground">Ganhar seus primeiros 100 XP</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      <CheckinModal
        open={showCheckinModal}
        onOpenChange={setShowCheckinModal}
        onCheckIn={handleCheckIn}
        streak={streak}
        canCheckIn={canCheckIn}
        lastCheckinAt={profile?.last_checkin_at}
        xpReward={phaseXP}
      />

      <CheckinSuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        xpGained={xpGained}
        streak={streak}
      />

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Phase1Onboarding;
