import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Gamepad2, MessageCircle, Sparkles } from "lucide-react";
import { getNavigationDirection, applyPageTransition } from "@/lib/pageTransitions";

const Phase6Live = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateWithTransition = (targetRoute: string) => {
    const direction = getNavigationDirection(location.pathname, targetRoute);
    applyPageTransition(direction);
    
    setTimeout(() => {
      navigate(targetRoute);
    }, 100);
  };

  const activities = [
    {
      id: 1,
      type: "quiz",
      title: "Quiz ao Vivo",
      description: "Responda perguntas sobre as palestras",
      icon: Gamepad2,
      status: "Ao vivo",
      points: 20,
    },
    {
      id: 2,
      type: "questions",
      title: "Perguntas aos Palestrantes",
      description: "Envie suas perguntas para os palestrantes",
      icon: MessageCircle,
      status: "Aberto",
      points: 15,
    },
    {
      id: 3,
      type: "challenge",
      title: "Desafio Relâmpago",
      description: "Complete o desafio antes do tempo acabar",
      icon: Sparkles,
      status: "Em breve",
      points: 30,
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
            <h1 className="text-2xl font-bold">Fase 6: Dinâmicas ao Vivo</h1>
            <p className="text-sm text-muted-foreground">Interaja durante o evento</p>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="text-center">
              <h3 className="font-semibold mb-2">🎉 Evento ao Vivo</h3>
              <p className="text-sm text-muted-foreground">
                Participe das atividades interativas durante as palestras
              </p>
            </div>
          </Card>

          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <Card key={activity.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{activity.title}</h3>
                      <Badge
                        variant={
                          activity.status === "Ao vivo"
                            ? "default"
                            : activity.status === "Aberto"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {activity.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-warning">
                        +{activity.points} XP
                      </span>
                      <Button
                        size="sm"
                        disabled={activity.status === "Em breve"}
                      >
                        {activity.status === "Ao vivo" ? "Participar Agora" : "Ver Detalhes"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Dicas para aproveitar</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>• Ative as notificações para não perder nenhuma atividade</li>
              <li>• Participe dos quizzes para ganhar pontos extras</li>
              <li>• Envie perguntas relevantes aos palestrantes</li>
              <li>• Complete os desafios relâmpago durante o evento</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Phase6Live;
