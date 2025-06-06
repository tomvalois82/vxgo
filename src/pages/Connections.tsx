
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { WhatsAppConnection } from '@/components/connections/WhatsAppConnection';
import { OlxConnectionPlaceholder } from '@/components/connections/OlxConnectionPlaceholder';
import { useAuth } from '@/contexts/AuthContext';
import { olxService } from '@/services/olxService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { LoaderCircle } from 'lucide-react';

const Connections = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isProcessingOlx, setIsProcessingOlx] = useState(false);

  useEffect(() => {
    const handleOlxCallback = async () => {
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');
      
      if (code && user && profile?.config) {
        setIsProcessingOlx(true);
        
        try {
          // Exchange code for token
          const success = await olxService.exchangeCodeForToken(code, user.id);
          
          if (!success) {
            throw new Error('Failed to exchange code for token');
          }

          // Get updated config to check webhook URL and access token
          const { data: updatedConfig, error: configError } = await supabase
            .from('config')
            .select('access_token_olx, webhook_olx')
            .eq('id', profile.config)
            .single();

          if (configError || !updatedConfig) {
            throw configError || new Error('Failed to get updated config');
          }

          if (!updatedConfig.webhook_olx) {
            toast({
              title: "Aviso",
              description: "URL do webhook não configurada. Entre em contato com o administrador.",
              variant: "default"
            });
            // Clear the code from URL
            navigate('/connections', { replace: true });
            return;
          }

          // Activate webhook
          const status = await olxService.activateWebhook(
            updatedConfig.access_token_olx as string, 
            updatedConfig.webhook_olx
          );

          if (status === 201 || status === 200) {
            toast({
              title: "Sucesso",
              description: "OLX integrada com sucesso!",
              variant: "default"
            });
          } else if (status === 401) {
            toast({
              title: "Erro",
              description: "Token inválido. Tente reconectar sua conta OLX.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Erro ao ativar webhook",
              description: `Status: ${status}. Tente novamente ou contate o suporte.`,
              variant: "destructive"
            });
          }

          // Clear the code from URL
          navigate('/connections', { replace: true });

        } catch (error) {
          console.error('OLX integration error:', error);
          toast({
            title: "Erro ao integrar OLX",
            description: error instanceof Error ? error.message : "Falha na integração. Tente novamente.",
            variant: "destructive"
          });
          
          // Clear the code from URL
          navigate('/connections', { replace: true });
        } finally {
          setIsProcessingOlx(false);
        }
      }
    };

    if (location.search.includes('code=')) {
      handleOlxCallback();
    }
  }, [location.search, user, profile, navigate]);

  if (isProcessingOlx) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Conexões</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <LoaderCircle className="h-16 w-16 animate-spin text-primary" />
            <p className="text-center text-muted-foreground">
              Integrando OLX...
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Por favor, aguarde enquanto processamos sua integração.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Conexões</h1>
      <WhatsAppConnection />
      <OlxConnectionPlaceholder />
    </div>
  );
};

export default Connections;
