import { useState, useEffect } from "react";

interface UserAvatarProps {
  user?: {
    avatar_url?: string | null;
    name?: string | null;
    email?: string | null;
  };
  size?: number;
  className?: string;
  fallbackText?: string;
}

export default function UserAvatar({ 
  user,
  size = 50, 
  className = "", 
  fallbackText
}: UserAvatarProps) {
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    // Para outros usuários, usar apenas o avatar_url do profile
    setAvatar(user?.avatar_url || null);
  }, [user]);

  // Gerar fallback text baseado no nome ou email
  const getFallbackText = () => {
    if (fallbackText) return fallbackText;
    if (user?.name) return user.name[0]?.toUpperCase();
    if (user?.email) return user.email[0]?.toUpperCase();
    return 'U';
  };

  return (
    <div className={`relative ${className}`}>
      {avatar ? (
        <img 
          src={avatar} 
          alt="Foto de Perfil" 
          width={size} 
          height={size}
          className="rounded-full object-cover shadow-md"
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
        className={`rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md ${avatar ? 'hidden' : 'flex'}`}
        style={{ 
          width: size, 
          height: size,
          fontSize: size * 0.4
        }}
      >
        {getFallbackText()}
      </div>
    </div>
  );
}