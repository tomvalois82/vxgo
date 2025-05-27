
import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppConnectionProps {
  instanceName: string;
  apiKey: string;
  userId: string;
}

export function useWhatsAppConnection({ instanceName, apiKey, userId }: WhatsAppConnectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionState, setConnectionState] = useState<'open' | 'close' | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isCredentialsValid, setIsCredentialsValid] = useState<boolean | null>(null);

  const validateCredentials = useCallback(async () => {
    if (!instanceName || !apiKey) {
      setIsCredentialsValid(null);
      return false;
    }

    try {
      const response = await fetch(
        `https://evolution-evolution.ppmwkh.easypanel.host/instance/connectionState/${instanceName}`,
        {
          headers: {
            'apikey': apiKey
          }
        }
      );

      if (response.ok) {
        setIsCredentialsValid(true);
        return true;
      } else {
        setIsCredentialsValid(false);
        return false;
      }
    } catch (error) {
      console.error('Erro ao validar credenciais:', error);
      setIsCredentialsValid(false);
      return false;
    }
  }, [instanceName, apiKey]);

  const checkConnectionStatus = useCallback(async () => {
    if (!instanceName || !apiKey) {
      setConnectionState(null);
      setIsCheckingStatus(false);
      return false;
    }

    try {
      setIsCheckingStatus(true);
      const response = await fetch(
        `https://evolution-evolution.ppmwkh.easypanel.host/instance/connectionState/${instanceName}`,
        {
          headers: {
            'apikey': apiKey
          }
        }
      );

      if (!response.ok) {
        setIsCredentialsValid(false);
        throw new Error('Falha ao verificar status da conexão');
      }

      setIsCredentialsValid(true);
      const data = await response.json();
      setConnectionState(data.instance.state);
      
      if (data.instance.state === 'open') {
        await fetchInstances();
      }
      
      return data.instance.state === 'open';
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setConnectionState(null);
      return false;
    } finally {
      setIsCheckingStatus(false);
    }
  }, [instanceName, apiKey]);

  const fetchInstances = useCallback(async () => {
    if (!apiKey) return;
    
    try {
      const response = await fetch(
        `https://evolution-evolution.ppmwkh.easypanel.host/instance/fetchInstances`,
        {
          headers: {
            'apikey': apiKey
          }
        }
      );

      if (!response.ok) throw new Error('Falha ao buscar instâncias');

      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Encontrar a instância atual
        const currentInstance = data.find(item => 
          item?.instance?.instanceName === instanceName
        );
        
        if (currentInstance?.instance) {
          setPhoneNumber(currentInstance.instance.owner || null);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error);
    }
  }, [apiKey, instanceName]);

  const saveCredentials = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('usuario')
        .update({
          evo_instancia: instanceName,
          evo_key: apiKey,
        })
        .eq('uid', userId);

      if (error) throw error;

      toast({
        title: 'Configurações salvas',
        description: 'Suas configurações foram atualizadas com sucesso.',
      });
      
      return true;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar suas configurações.',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, instanceName, apiKey]);

  const connectWhatsApp = useCallback(async () => {
    if (!instanceName || !apiKey) {
      toast({
        variant: 'destructive',
        title: 'Dados incompletos',
        description: 'Por favor, preencha todos os campos antes de conectar.',
      });
      return false;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://evolution-evolution.ppmwkh.easypanel.host/instance/connect/${instanceName}`,
        {
          headers: {
            'apikey': apiKey
          }
        }
      );

      if (!response.ok) throw new Error('Falha na conexão com Evolution API');

      const data = await response.json();
      
      if (data && data.base64) {
        setQrCodeData(data.base64);
        return true;
      } else {
        throw new Error('Dados de resposta inválidos');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro na conexão',
        description: 'Não foi possível conectar ao WhatsApp.',
      });
      console.error('Erro ao conectar:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [instanceName, apiKey]);

  const disconnectWhatsApp = useCallback(async () => {
    if (!instanceName || !apiKey) return false;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://evolution-evolution.ppmwkh.easypanel.host/instance/logout/${instanceName}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': apiKey
          }
        }
      );

      if (!response.ok) throw new Error('Falha ao desconectar WhatsApp');

      toast({
        title: 'WhatsApp desconectado',
        description: 'Sua conta foi desconectada com sucesso.',
      });
      
      setConnectionState('close');
      setPhoneNumber(null);
      return true;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao desconectar',
        description: 'Não foi possível desconectar o WhatsApp.',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [instanceName, apiKey]);

  const restartWhatsApp = useCallback(async () => {
    if (!instanceName || !apiKey) return false;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://evolution-evolution.ppmwkh.easypanel.host/instance/restart/${instanceName}`,
        {
          method: 'PUT',
          headers: {
            'apikey': apiKey
          }
        }
      );

      if (!response.ok) throw new Error('Falha ao reiniciar a instância');

      toast({
        title: 'WhatsApp reiniciado',
        description: 'Sua instância foi reiniciada com sucesso.',
      });
      
      setTimeout(() => checkConnectionStatus(), 3000);
      return true;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao reiniciar',
        description: 'Não foi possível reiniciar a instância do WhatsApp.',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [instanceName, apiKey, checkConnectionStatus]);

  // Verificar status quando os valores mudam
  useEffect(() => {
    if (instanceName && apiKey) {
      checkConnectionStatus();
    } else {
      setIsCheckingStatus(false);
    }
  }, [instanceName, apiKey, checkConnectionStatus]);

  return {
    isLoading,
    connectionState,
    isCheckingStatus,
    qrCodeData,
    phoneNumber,
    isCredentialsValid,
    validateCredentials,
    checkConnectionStatus,
    saveCredentials,
    connectWhatsApp,
    disconnectWhatsApp,
    restartWhatsApp,
  };
}
