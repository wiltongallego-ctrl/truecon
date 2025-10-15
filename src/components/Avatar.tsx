import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AvatarProps {
  size?: number;
  className?: string;
  fallbackText?: string;
  showEditButton?: boolean;
  onPhotoUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingPhoto?: boolean;
}

export default function Avatar({ 
  size = 50, 
  className = "", 
  fallbackText = "U",
  showEditButton = false,
  onPhotoUpload,
  uploadingPhoto = false
}: AvatarProps) {
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      // DEBUG: Log completo dos dados do usuário
      console.log("🔍 [Avatar Debug] Dados completos do usuário:", {
        user: user,
        user_metadata: user?.user_metadata,
        identities: user?.identities,
        app_metadata: user?.app_metadata
      });

      // Prioridade para carregar a foto:
      // 1. avatar_url do user_metadata (salvo pelo Microsoft Graph)
      // 2. picture do user_metadata (salvo pelo Microsoft Graph)
      // 3. picture do identity_data (dados diretos do Azure)
      let avatarUrl = user?.user_metadata?.avatar_url;
      let pictureUrl = user?.user_metadata?.picture;
      let identityPicture = user?.identities?.[0]?.identity_data?.picture;

      console.log("🖼️ [Avatar Debug] URLs encontradas:", {
        avatar_url: avatarUrl,
        picture: pictureUrl,
        identity_picture: identityPicture
      });

      // Usar apenas URLs reais do Microsoft - SEM PALIATIVOS
      const url = avatarUrl || pictureUrl || identityPicture;

      console.log("✅ [Avatar Debug] URL final selecionada:", url);

      setAvatar(url);
    };

    loadUser();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className={`relative group cursor-pointer transform hover:scale-105 transition-all duration-300 ${className}`}>
      {avatar ? (
        <img 
          src={avatar} 
          alt="Foto de Perfil" 
          width={size} 
          height={size}
          className={`w-${size/4} h-${size/4} rounded-full object-cover shadow-xl border-4 border-white ring-2 ring-primary/20`}
          style={{ width: size, height: size }}
          onError={(e) => {
            // Fallback para inicial se a imagem não carregar
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : null}
      
      {/* Fallback com inicial */}
      <div 
        className={`rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center text-white font-bold shadow-xl border-4 border-white ring-2 ring-primary/20 ${avatar ? 'hidden' : 'flex'}`}
        style={{ 
          width: size, 
          height: size,
          fontSize: size * 0.4
        }}
      >
        {fallbackText}
      </div>

      {/* Botão de edição (opcional) */}
      {showEditButton && onPhotoUpload && (
        <>
          <input
            type="file"
            id="profile-photo-upload"
            accept="image/*"
            onChange={onPhotoUpload}
            className="hidden"
            disabled={uploadingPhoto}
          />
          <label htmlFor="profile-photo-upload">
            <button 
              className={`absolute -bottom-1 -right-1 w-8 h-8 bg-white border-2 border-primary/20 rounded-full flex items-center justify-center shadow-lg hover:bg-primary hover:text-white transition-all duration-200 hover:scale-110 ${uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={uploadingPhoto}
              type="button"
            >
              <svg className="w-4 h-4 text-gray-600 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </label>
        </>
      )}

      {/* Overlay de hover */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
}