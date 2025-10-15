import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { AuthError } from '@supabase/supabase-js';
import TrueLogo from '@/components/TrueLogo';
import AnimatedCharacter from '@/components/AnimatedCharacter';
import { toast } from 'sonner';
import { MicrosoftGraphService } from '@/services/microsoftGraphService';

const Auth = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session check:', session);
        if (session) {
          setSession(session);
          setUser(session.user);
          console.log('Redirecting to home from initial check');
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);
        
        // DEBUG: Log completo dos dados do usuário após login OAuth
        if (session && event === 'SIGNED_IN') {
          console.log('=== DEBUG OAUTH LOGIN ===');
          console.log('Evento:', event);
          console.log('Session completa:', JSON.stringify(session, null, 2));
          console.log('User completo:', JSON.stringify(session.user, null, 2));
          console.log('User metadata:', JSON.stringify(session.user.user_metadata, null, 2));
          console.log('App metadata:', JSON.stringify(session.user.app_metadata, null, 2));
          console.log('Identities:', JSON.stringify(session.user.identities, null, 2));
          
          // Verificar especificamente os campos de avatar
          console.log('=== CAMPOS DE AVATAR ===');
          console.log('user_metadata.avatar_url:', session.user.user_metadata?.avatar_url);
          console.log('user_metadata.picture:', session.user.user_metadata?.picture);
          
          if (session.user.identities && session.user.identities.length > 0) {
            session.user.identities.forEach((identity, index) => {
              console.log(`Identity ${index}:`, JSON.stringify(identity, null, 2));
              console.log(`Identity ${index} - identity_data.picture:`, identity.identity_data?.picture);
              console.log(`Identity ${index} - identity_data.avatar_url:`, identity.identity_data?.avatar_url);
            });
          }
          console.log('========================');
          
          // Verificar dados da sessão para Microsoft Graph API
          console.log('=== VERIFICAÇÃO DE DADOS DA SESSÃO ===');
          console.log('Provider Token presente:', !!session.provider_token);
          console.log('Provider Token (primeiros 20 chars):', session.provider_token?.substring(0, 20) + '...');
          console.log('Provider:', session.user.app_metadata?.provider);
          console.log('Provider refresh token presente:', !!session.provider_refresh_token);
          
          // Debug: Verificar se o provider_token está sendo salvo no Supabase
          if (session.provider_token) {
            console.log('💾 [Auth Debug] Verificando se provider_token está salvo no Supabase...');
            console.log('🔑 [Auth Debug] Provider token presente:', !!session.provider_token);
            console.log('🔑 [Auth Debug] Provider token length:', session.provider_token?.length || 0);
            console.log('🔑 [Auth Debug] Provider token (primeiros 50 chars):', session.provider_token?.substring(0, 50) + '...');
          }
          
          // Tentar buscar foto via Microsoft Graph API se for login Azure
          if (session.user.app_metadata?.provider === 'azure' && session.user.email) {
            console.log('✅ Condições atendidas para buscar foto');
            console.log('📧 Email do usuário:', session.user.email);
            
            try {
              // Tentar buscar foto do Microsoft Graph usando Edge Function
              console.log('🔍 Tentando buscar foto via Edge Function...');
              const userEmail = session.user.email;
              if (userEmail) {
                console.log('📞 Chamando MicrosoftGraphService.getUserPhotoByEmail com email:', userEmail);
                const photoUrl = await MicrosoftGraphService.getUserPhotoByEmail(userEmail);
                console.log('📸 Resultado da Edge Function - photoUrl:', photoUrl);
                
                if (photoUrl) {
                  console.log('✅ Foto obtida via Edge Function, salvando no Supabase...');
                  const saveResult = await MicrosoftGraphService.saveUserPhotoToSupabase(photoUrl, session.user.id);
                  console.log('💾 Resultado do salvamento:', saveResult);
                } else {
                  console.log('⚠️ Foto não encontrada via Edge Function, tentando com provider token...');
                  console.log('🔑 Provider token disponível:', !!session.provider_token);
                  
                  // Fallback: tentar com provider token se disponível
                  if (session.provider_token) {
                    console.log('🔄 Tentando buscar foto com provider token...');
                    const photoUrlFallback = await MicrosoftGraphService.fetchAndSaveUserPhotoWithProviderToken(session.provider_token, session.user.id);
                    console.log('📸 Resultado do provider token - photoUrl:', photoUrlFallback);
                    
                    if (photoUrlFallback) {
                      console.log('✅ Foto obtida via provider token');
                    } else {
                      console.log('❌ Não foi possível obter foto via provider token');
                    }
                  } else {
                    console.log('❌ Provider token não disponível para fallback');
                  }
                }
              }
              
              toast.success('Foto do perfil carregada do Microsoft!');
            } catch (error) {
              console.error('💥 Erro ao buscar foto via Graph API:', error);
              console.error('💥 Stack trace:', error.stack);
              toast.error('Erro ao carregar foto do perfil');
            }
          } else {
            console.log('❌ Condições não atendidas para buscar foto:');
            console.log('- Provider é Azure:', session.user.app_metadata?.provider === 'azure');
            console.log('- Email presente:', !!session.user.email);
          }
          
          console.log('Redirecting to home from auth state change');
          // Use replace instead of navigate to avoid history issues
          window.location.href = '/';
        }
        
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAzureSignIn = async () => {
    try {
      // Define redirect base considerando produção e desenvolvimento
      const origin = window.location.origin;
      const siteUrlEnv = import.meta.env.VITE_SITE_URL as string | undefined;
      const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(origin);
      const redirectBase = isLocal ? origin : (siteUrlEnv || origin);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${redirectBase}/`,
          scopes: 'openid profile email User.Read ProfilePhoto.Read.All'
        }
      });

      if (error) throw error;
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message || 'Erro ao fazer login com Azure');
    }
  };

  const handleDemoLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'demouser@truechange.com',
        password: 'demo123456'
      });

      if (error) throw error;
      
      toast.success('Login demo realizado com sucesso!');
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message || 'Erro ao fazer login demo');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-[400px] bg-white rounded-[2px] shadow-card p-6 flex flex-col items-center justify-between gap-6">
        <div className="flex flex-col items-center gap-4">
          <div className="text-primary">
            <TrueLogo />
          </div>
          <h1 className="text-4xl font-bold text-primary text-center">TrueCon.</h1>
          <div className="w-[300px] h-[250px] flex items-center justify-center">
            <AnimatedCharacter />
          </div>
        </div>

        <div className="text-sm text-muted-foreground text-center">
          Boas-vindas TrueChanger :)<br />
          Faça seu login com Microsoft e aproveite.
        </div>

        <Button
          onClick={handleAzureSignIn}
          variant="outline"
          className="w-full gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0h7.5v7.5H0V0zm8.5 0H16v7.5H8.5V0zM0 8.5h7.5V16H0V8.5zm8.5 0H16V16H8.5V8.5z" fill="#00BCF2"/>
          </svg>
          Entrar com Azure
        </Button>

        <Button
          onClick={handleDemoLogin}
          variant="secondary"
          className="w-full gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="currentColor"/>
            <path d="M8 4c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="currentColor"/>
          </svg>
          Login Demo (demouser@truechange.com)
        </Button>
      </div>
    </div>
  );
};

export default Auth;
