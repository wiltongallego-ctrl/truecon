import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { AuthError } from '@supabase/supabase-js';
import TrueLogo from '@/components/TrueLogo';
import AnimatedCharacter from '@/components/AnimatedCharacter';
import { toast } from 'sonner';

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
      const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\\d{1,5})?$/.test(origin);
      const redirectBase = isLocal ? origin : (siteUrlEnv || origin);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${redirectBase}/`
        }
      });

      if (error) throw error;
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message || 'Erro ao fazer login com Azure');
    }
  };


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


      </div>
    </div>
  );
};

export default Auth;
