import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Star, Video, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const Phase7Feedback = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const handleSubmitFeedback = () => {
    if (rating === 0) {
      toast.error("Por favor, dê uma nota para o evento");
      return;
    }
    if (!feedback.trim()) {
      toast.error("Por favor, deixe seu feedback");
      return;
    }
    toast.success("Obrigado pelo seu feedback!");
  };

  const replays = [
    { id: 1, title: "Palestra: Inovação e Tecnologia", duration: "45 min" },
    { id: 2, title: "Workshop: Transformação Digital", duration: "30 min" },
    { id: 3, title: "Painel: O Futuro do Trabalho", duration: "60 min" },
  ];

  return (
    <div className="min-h-screen bg-background">
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
            <h1 className="text-2xl font-bold">Fase 7: Encerramento</h1>
            <p className="text-sm text-muted-foreground">Feedback & Replay</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Pesquisa de Satisfação */}
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <MessageSquare className="w-6 h-6 text-primary" />
              <h3 className="font-semibold">Pesquisa de Satisfação</h3>
            </div>
            
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">
                Como você avalia o evento?
              </label>
              <div className="flex gap-2 justify-center py-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= rating
                          ? "fill-warning text-warning"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">
                Deixe seu feedback
              </label>
              <Textarea
                placeholder="O que você achou do evento? O que podemos melhorar?"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
              />
            </div>

            <Button onClick={handleSubmitFeedback} className="w-full">
              Enviar Feedback
            </Button>
          </Card>

          {/* Replay de Conteúdos */}
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Video className="w-6 h-6 text-primary" />
              <h3 className="font-semibold">Replay de Conteúdos</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Assista novamente às palestras e workshops do evento
            </p>
            
            <div className="space-y-3">
              {replays.map((replay) => (
                <div
                  key={replay.id}
                  className="p-4 border border-border rounded-lg hover:border-primary transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{replay.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {replay.duration}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      Assistir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="text-center">
              <h3 className="font-semibold mb-2">🎉 Obrigado por participar!</h3>
              <p className="text-sm text-muted-foreground">
                Foi incrível ter você no TrueCon 2025. Até a próxima edição!
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Phase7Feedback;
