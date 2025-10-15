import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Type, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import GroupPhotoUpload from "@/components/GroupPhotoUpload";

interface Group {
  id: string;
  name: string;
  photo_url: string | null;
  manager_id: string | null;
}

const Phase3Personalization = () => {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [userGroup, setUserGroup] = useState<Group | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        await fetchUserGroup(user.id);
      }
    };
    init();
  }, []);

  const fetchUserGroup = async (userId: string) => {
    const { data: memberData, error: memberError } = await supabase
      .from("group_members")
      .select("group_id, groups(id, name, photo_url, manager_id)")
      .eq("user_id", userId)
      .single();

    if (memberError || !memberData) {
      setLoading(false);
      return;
    }

    const group = memberData.groups as unknown as Group;
    setUserGroup(group);
    setGroupName(group.name || "");
    setLoading(false);
  };

  const handleSaveGroupName = async () => {
    if (!groupName.trim()) {
      toast.error("Digite um nome para o grupo");
      return;
    }

    if (!userGroup) {
      toast.error("Grupo não encontrado");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("groups")
      .update({ name: groupName.trim() })
      .eq("id", userGroup.id);

    setSaving(false);

    if (error) {
      console.error("Erro ao salvar nome do grupo:", error);
      toast.error("Erro ao salvar nome do grupo");
      return;
    }

    toast.success("Nome do grupo salvo com sucesso!");
    setUserGroup({ ...userGroup, name: groupName.trim() });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold">Fase 3: Personalização</h1>
            <p className="text-sm text-muted-foreground">Nome + foto do grupo</p>
          </div>
        </div>

        <div className="space-y-4">
          {!userGroup ? (
            <Card className="p-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Aguardando Grupo</h2>
                  <p className="text-sm text-muted-foreground">
                    Você ainda não foi adicionado a um grupo. Aguarde a organização dos grupos pelos administradores.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <>
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Type className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold">Nome do Grupo</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Escolha um nome criativo para o seu grupo!
                </p>
                <Input
                  placeholder="Ex: Inovadores TrueCon"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="mb-4"
                />
                <Button 
                  onClick={handleSaveGroupName} 
                  className="w-full"
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Salvar Nome"}
                </Button>
              </Card>

              {/* Foto do Grupo */}
              <GroupPhotoUpload
                groupId={userGroup.id}
                groupName={userGroup.name || "Seu Grupo"}
                currentPhotoUrl={userGroup.photo_url}
                managerId={userGroup.manager_id}
                currentUserId={currentUserId}
                onPhotoUpdate={(newUrl) => {
                  setUserGroup({ ...userGroup, photo_url: newUrl });
                }}
              />
            </>
          )}

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Objetivos desta fase</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>• Escolher um nome criativo para o grupo</li>
              <li>• Enviar uma foto que represente o grupo</li>
              <li>• Ganhar pontos coletivos pela personalização</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Phase3Personalization;
