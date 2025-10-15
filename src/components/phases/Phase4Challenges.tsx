import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Zap, Trophy, Clock } from "lucide-react";
import { getNavigationDirection, applyPageTransition } from "@/lib/pageTransitions";

const Phase4Challenges = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateWithTransition = (targetRoute: string) => {
    const direction = getNavigationDirection(location.pathname, targetRoute);
    applyPageTransition(direction);
    
    setTimeout(() => {
      navigate(targetRoute);
    }, 100);
  };

  const challenges = [
    {
      id: 1,
      title: "Desafio Relâmpago #1",
      description: "Complete uma tarefa surpresa em 24 horas",
      points: 50,
      timeLeft: "12h restantes",
      difficulty: "Médio",
    },
    {
      id: 2,
      title: "Missão Surpresa #2",
      description: "Participe de uma atividade especial",
      points: 30,
      timeLeft: "6h restantes",
      difficulty: "Fácil",
    },
  ];

  return (
    <div className="min-h-screen bg-background page-content">
      <div className="max-w-md mx-auto p-5">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWithTransition("/home")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Fase 4: Desafios Surpresa</h1>
            <p className="text-sm text-muted-foreground">Missões relâmpago</p>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="p-6 bg-gradient-to-r from-warning/10 to-primary/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-warning flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Desafios Ativos</h3>
                <p className="text-sm text-muted-foreground">
                  {challenges.length} missões disponíveis
                </p>
              </div>
            </div>
          </Card>

          {challenges.map((challenge) => (
            <Card key={challenge.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">{challenge.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {challenge.description}
                  </p>
                </div>
                <Badge variant="outline">{challenge.difficulty}</Badge>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="w-4 h-4 text-warning" />
                  <span className="font-medium">{challenge.points} XP</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{challenge.timeLeft}</span>
                </div>
              </div>

              <Button className="w-full">Aceitar Desafio</Button>
            </Card>
          ))}

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Como funcionam os desafios</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>• Novos desafios são liberados via notificação push</li>
              <li>• Complete as missões dentro do prazo para ganhar pontos</li>
              <li>• Alguns desafios são individuais, outros coletivos</li>
              <li>• Quanto mais rápido completar, mais pontos você ganha</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Phase4Challenges;
