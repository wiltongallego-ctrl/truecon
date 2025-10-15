import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Award, Star } from "lucide-react";
import { toast } from "sonner";

const Phase5Awards = () => {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<Record<string, string>>({});

  const categories = [
    {
      id: "innovation",
      title: "Projeto Mais Inovador",
      nominees: ["Projeto A", "Projeto B", "Projeto C"],
    },
    {
      id: "impact",
      title: "Maior Impacto Social",
      nominees: ["Projeto D", "Projeto E", "Projeto F"],
    },
    {
      id: "technical",
      title: "Excelência Técnica",
      nominees: ["Projeto G", "Projeto H", "Projeto I"],
    },
  ];

  const handleVote = (categoryId: string, nominee: string) => {
    setSelectedCategories({ ...selectedCategories, [categoryId]: nominee });
  };

  const handleSubmitVotes = () => {
    if (Object.keys(selectedCategories).length < categories.length) {
      toast.error("Vote em todas as categorias antes de enviar");
      return;
    }
    toast.success("Votos registrados com sucesso!");
  };

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
            <h1 className="text-2xl font-bold">Fase 5: TrueAwards</h1>
            <p className="text-sm text-muted-foreground">Votação oficial</p>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="p-6 bg-gradient-to-r from-warning/10 to-primary/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-warning flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Votação Aberta</h3>
                <p className="text-sm text-muted-foreground">
                  Vote nos melhores projetos
                </p>
              </div>
            </div>
          </Card>

          {categories.map((category) => (
            <Card key={category.id} className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-warning" />
                {category.title}
              </h3>
              <div className="space-y-2">
                {category.nominees.map((nominee) => (
                  <button
                    key={nominee}
                    onClick={() => handleVote(category.id, nominee)}
                    className={`w-full p-3 text-left border rounded-lg transition-colors ${
                      selectedCategories[category.id] === nominee
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          selectedCategories[category.id] === nominee
                            ? "border-primary bg-primary"
                            : "border-border"
                        }`}
                      />
                      <span className="text-sm font-medium">{nominee}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          ))}

          <Button
            onClick={handleSubmitVotes}
            className="w-full"
            size="lg"
            disabled={Object.keys(selectedCategories).length < categories.length}
          >
            Enviar Votos
          </Button>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Regras da votação</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>• Vote em todas as categorias</li>
              <li>• Cada participante tem um voto por categoria</li>
              <li>• A votação encerra em 03/12</li>
              <li>• Os vencedores serão anunciados no evento</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Phase5Awards;
