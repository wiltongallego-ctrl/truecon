import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Image as ImageIcon, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GroupPhotoUploadProps {
  groupId: string;
  groupName: string;
  currentPhotoUrl: string | null;
  managerId: string | null;
  currentUserId: string;
  onPhotoUpdate: (newUrl: string) => void;
}

const GroupPhotoUpload = ({ 
  groupId, 
  groupName, 
  currentPhotoUrl, 
  managerId, 
  currentUserId,
  onPhotoUpdate 
}: GroupPhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const isManager = managerId === currentUserId;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setUploading(true);

    try {
      // Upload para o storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${groupId}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('group-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('group-photos')
        .getPublicUrl(filePath);

      // Atualizar grupo com a nova foto
      const { error: updateError } = await supabase
        .from('groups')
        .update({ photo_url: publicUrl })
        .eq('id', groupId);

      if (updateError) throw updateError;

      toast.success("Foto do grupo atualizada!");
      onPhotoUpdate(publicUrl);
    } catch (error: any) {
      toast.error("Erro ao fazer upload da foto");
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-32 h-32 rounded-full bg-secondary/10 flex items-center justify-center overflow-hidden border-2 border-border">
          {currentPhotoUrl ? (
            <Avatar className="w-full h-full rounded-full">
              <AvatarImage src={currentPhotoUrl} alt={groupName} />
              <AvatarFallback className="w-full h-full text-4xl">
                {groupName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <ImageIcon className="w-16 h-16 text-muted-foreground" />
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-2">{groupName}</h3>
          <p className="text-sm text-muted-foreground">
            {isManager 
              ? (currentPhotoUrl ? "Alterar foto do grupo" : "Adicionar foto do grupo")
              : "Apenas o gestor pode alterar a foto"
            }
          </p>
        </div>

        {isManager && (
          <div className="w-full">
            <input
              type="file"
              id="group-photo-upload"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
            <label htmlFor="group-photo-upload">
              <Button
                variant="outline"
                className="w-full"
                disabled={uploading}
                asChild
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Enviando..." : "Escolher Foto"}
                </span>
              </Button>
            </label>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
        </p>
      </div>
    </Card>
  );
};

export default GroupPhotoUpload;
