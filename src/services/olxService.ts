
import { supabase } from "@/integrations/supabase/client";

interface OlxTokenResponse {
  access_token: string;
  token_type: string;
}

export const olxService = {
  async exchangeCodeForToken(code: string, userId: string): Promise<boolean> {
    try {
      const formData = new URLSearchParams();
      formData.append('code', code);
      formData.append('client_id', '148c0e2bf8bfd9bbc88f934fe385532643583815');
      formData.append('client_secret', 'd24a4511b5d6e55414ec2addb7fcb485');
      formData.append('grant_type', 'authorization_code');
      formData.append('redirect_uri', 'https://app.vxmotors.com.br/connections');
      
      const response = await fetch('https://auth.olx.com.br/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${await response.text()}`);
      }
      
      const data: OlxTokenResponse = await response.json();
      
      // First, get the user's config ID
      const { data: userData, error: userError } = await supabase
        .from('usuario')
        .select('config')
        .eq('uid', userId)
        .single();
        
      if (userError || !userData?.config) {
        throw new Error('User config not found');
      }
      
      // Save token to config table
      const { error } = await supabase
        .from('config')
        .update({ access_token_olx: data.access_token })
        .eq('id', userData.config);
        
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      return false;
    }
  },
  
  async activateWebhook(accessToken: string, webhookUrl: string): Promise<number> {
    try {
      const response = await fetch('https://apps.olx.com.br/autoservice/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ 
          webhook: webhookUrl 
        }),
      });
      
      return response.status;
    } catch (error) {
      console.error('Error activating webhook:', error);
      return 500;
    }
  }
};
