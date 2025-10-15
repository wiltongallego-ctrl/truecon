import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const DebugUserData = () => {
  const [userData, setUserData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  const fetchUserData = async () => {
    try {
      // Buscar dados do usuário autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      setUserData(user);

      // Buscar dados do perfil na tabela profiles
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (profileError) {
          console.error('Erro ao buscar perfil:', profileError);
        } else {
          setProfileData(profile);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setShowDebug(true)}
          variant="outline"
          size="sm"
        >
          Debug User Data
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Debug - Dados do Usuário</h2>
          <Button 
            onClick={() => setShowDebug(false)}
            variant="outline"
            size="sm"
          >
            Fechar
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Dados de Autenticação (Supabase Auth)</h3>
            <div className="bg-gray-100 p-4 rounded text-sm">
              <pre>{JSON.stringify(userData, null, 2)}</pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Dados do Perfil (Tabela profiles)</h3>
            <div className="bg-gray-100 p-4 rounded text-sm">
              <pre>{JSON.stringify(profileData, null, 2)}</pre>
            </div>
          </div>

          {userData && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Análise dos Campos de Avatar</h3>
              <div className="bg-blue-50 p-4 rounded text-sm space-y-2">
                <p><strong>user_metadata.avatar_url:</strong> {userData.user_metadata?.avatar_url || 'null'}</p>
                <p><strong>user_metadata.picture:</strong> {userData.user_metadata?.picture || 'null'}</p>
                {userData.identities && userData.identities.length > 0 && (
                  <div>
                    <p><strong>Identities:</strong></p>
                    {userData.identities.map((identity: any, index: number) => (
                      <div key={index} className="ml-4 mt-2">
                        <p><strong>Identity {index} - Provider:</strong> {identity.provider}</p>
                        <p><strong>Identity {index} - identity_data.picture:</strong> {identity.identity_data?.picture || 'null'}</p>
                        <p><strong>Identity {index} - identity_data.avatar_url:</strong> {identity.identity_data?.avatar_url || 'null'}</p>
                      </div>
                    ))}
                  </div>
                )}
                <p><strong>Profile avatar_url (tabela):</strong> {profileData?.avatar_url || 'null'}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={fetchUserData} size="sm">
              Recarregar Dados
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugUserData;