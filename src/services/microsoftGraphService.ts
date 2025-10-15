import { supabase } from '@/integrations/supabase/client';

interface GraphPhotoResponse {
  '@odata.mediaContentType'?: string;
  '@odata.mediaEtag'?: string;
}

export class MicrosoftGraphService {
  private static readonly GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';
  private static readonly edgeFunctionUrl = 'https://ucsxxyeitcylrwbucrly.supabase.co/functions/v1/microsoft-graph-proxy';
  private static readonly supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  /**
   * Obter access token via Edge Function
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      console.log('🔑 [MicrosoftGraphService] Solicitando token de acesso...');
      const response = await fetch(`${this.edgeFunctionUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
        body: JSON.stringify({ action: 'get_token' }),
      });

      console.log('🔑 [MicrosoftGraphService] Resposta do token - Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔑 [MicrosoftGraphService] Erro ao obter token:', response.status, errorText);
        return null;
      }

      const data = await response.json();
      console.log('🔑 [MicrosoftGraphService] Token obtido com sucesso');
      return data.access_token;
    } catch (error) {
      console.error('🔑 [MicrosoftGraphService] Erro na requisição do token:', error);
      return null;
    }
  }

  static async getUserPhotoByEmail(userEmail: string): Promise<string | null> {
    try {
      console.log('📸 [MicrosoftGraphService] Buscando foto para email:', userEmail);
      
      // Primeiro, obter o token de acesso
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        console.error('📸 [MicrosoftGraphService] Não foi possível obter token de acesso');
        return null;
      }

      console.log('📸 [MicrosoftGraphService] Token obtido, fazendo requisição da foto...');
      
      // Fazer requisição para obter a foto
      const response = await fetch(`${this.edgeFunctionUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
        body: JSON.stringify({
          action: 'get_photo',
          userEmail: userEmail,
          accessToken: accessToken,
        }),
      });

      console.log('📸 [MicrosoftGraphService] Resposta da foto - Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📸 [MicrosoftGraphService] Erro ao obter foto:', response.status, errorText);
        return null;
      }

      const data = await response.json();
      console.log('📸 [MicrosoftGraphService] Resposta da foto recebida:', data);
      console.log('📸 [MicrosoftGraphService] Foto presente:', !!data.photo);
      
      return data.photo || null;
    } catch (error) {
      console.error('📸 [MicrosoftGraphService] Erro na requisição da foto:', error);
      return null;
    }
  }

  /**
   * Buscar foto do usuário usando provider token diretamente
   */
  static async getUserPhotoWithProviderToken(providerToken: string): Promise<string | null> {
    console.log('🔍 [Microsoft Graph] Buscando foto do usuário com provider token');
    console.log('🔑 [Microsoft Graph] Provider token presente:', !!providerToken);
    
    try {
      const response = await fetch(`${this.GRAPH_API_BASE}/me/photo/$value`, {
        headers: {
          'Authorization': `Bearer ${providerToken}`,
          'Content-Type': 'image/jpeg'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('Foto do usuário não encontrada no Microsoft Graph');
          return null;
        }
        console.error('❌ [Microsoft Graph] Erro na requisição da foto:', response.status, response.statusText);
        return null;
      }

      const blob = await response.blob();
      const base64 = await this.blobToBase64(blob);
      console.log('✅ [Microsoft Graph] Foto obtida com sucesso via provider token');
      return base64;
      
    } catch (error) {
      console.error('❌ [Microsoft Graph] Erro ao obter foto com provider token:', error);
      return null;
    }
  }

  /**
   * Converter blob para base64
   */
  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Salvar foto no Supabase Storage e atualizar perfil
   */
  static async saveUserPhotoToSupabase(photoBase64: string, userId: string): Promise<string | null> {
    try {
      console.log('💾 Iniciando salvamento da foto no Supabase...');
      console.log('👤 User ID:', userId);
      console.log('📊 Tamanho do base64 recebido:', photoBase64.length, 'caracteres');
      
      // Converter base64 para blob
      console.log('🔄 Convertendo base64 para blob...');
      const response = await fetch(photoBase64);
      const blob = await response.blob();
      console.log('📊 Blob criado - Tamanho:', blob.size, 'bytes, Tipo:', blob.type);
      
      // Upload para Supabase Storage
      const fileName = `avatar-${userId}-${Date.now()}.jpg`;
      console.log('📤 Fazendo upload para Supabase Storage:', fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError.message, uploadError);
        return null;
      }

      console.log('✅ Upload realizado com sucesso:', uploadData);

      // Obter URL pública
      console.log('🔗 Obtendo URL pública...');
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log('🔗 URL pública gerada:', publicUrl);
      
      // Atualizar perfil do usuário
      console.log('👤 Atualizando perfil do usuário...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ Erro ao atualizar perfil:', updateError.message, updateError);
        return null;
      }

      console.log('✅ Perfil atualizado com sucesso!');
      console.log('🎉 Foto salva no Supabase com sucesso:', publicUrl);
      return publicUrl;
      
    } catch (error) {
      console.error('💥 Erro crítico ao salvar foto no Supabase:', error);
      console.error('💥 Stack trace:', (error as Error).stack);
      return null;
    }
  }

  /**
   * Processo completo: buscar foto usando provider token e salvar no Supabase
   */
  static async fetchAndSaveUserPhotoWithProviderToken(providerToken: string, userId: string): Promise<string | null> {
    console.log('🚀 Iniciando processo completo de busca e salvamento da foto com provider token...');
    console.log('👤 User ID:', userId);
    
    const photoBase64 = await this.getUserPhotoWithProviderToken(providerToken);
    
    if (!photoBase64) {
      console.log('❌ Não foi possível obter foto do Microsoft Graph');
      return null;
    }
    
    console.log('✅ Foto obtida do Microsoft Graph, iniciando salvamento no Supabase...');
    return await this.saveUserPhotoToSupabase(photoBase64, userId);
  }
}