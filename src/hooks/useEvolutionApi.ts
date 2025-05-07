
import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ConnectionState {
  instance: {
    instanceName: string;
    state: 'open' | 'close';
  };
}

interface Instance {
  instance: {
    instanceName: string;
    instanceId: string;
    owner?: string;
    profileName?: string;
    status: 'open' | 'close';
    serverUrl: string;
    apikey: string;
    profilePictureUrl?: string;
  };
}

interface QRCodeResponse {
  code?: string;
  base64?: string;
}

export interface EvolutionApiFormData {
  evo_instancia: string;
  evo_key: string;
}

export interface InstanceInfo {
  profileName: string | null;
  owner: string | null;
  profilePictureUrl: string | null;
}

export function useEvolutionApi(initialFormData: EvolutionApiFormData) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [connectionState, setConnectionState] = useState<'open' | 'close' | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [formData, setFormData] = useState<EvolutionApiFormData>(initialFormData);
  const [isValidCredentials, setIsValidCredentials] = useState<boolean | null>(null);
  const [instanceInfo, setInstanceInfo] = useState<InstanceInfo>({
    profileName: null,
    owner: null,
    profilePictureUrl: null
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset validation when credentials change
    if (name === 'evo_instancia' || name === 'evo_key') {
      setIsValidCredentials(null);
    }
  };

  // Validate credentials without changing connection state
  const validateCredentials = useCallback(async () => {
    if (!formData.evo_instancia || !formData.evo_key) {
      setIsValidCredentials(null);
      return false;
    }

    try {
      const response = await fetch(
        `https://evolution-evolution.ppmwkh.easypanel.host/instance/connectionState/${formData.evo_instancia}`,
        {
          headers: {
            'apikey': formData.evo_key
          }
        }
      );

      if (response.ok) {
        setIsValidCredentials(true);
        return true;
      } else {
        setIsValidCredentials(false);
        return false;
      }
    } catch (error) {
      console.error('Erro ao validar credenciais:', error);
      setIsValidCredentials(false);
      return false;
    }
  }, [formData.evo_instancia, formData.evo_key]);

  // Effect to validate credentials when they change
  useEffect(() => {
    const debounceValidation = setTimeout(() => {
      if (formData.evo_instancia && formData.evo_key) {
        validateCredentials();
      }
    }, 800); // Debounce to avoid too many requests

    return () => clearTimeout(debounceValidation);
  }, [formData.evo_instancia, formData.evo_key, validateCredentials]);

  const checkConnectionStatus = useCallback(async () => {
    if (!formData.evo_instancia || !formData.evo_key) {
      setConnectionState(null);
      setIsCheckingStatus(false);
      return false;
    }

    try {
      setIsCheckingStatus(true);
      const response = await fetch(
        `https://evolution-evolution.ppmwkh.easypanel.host/instance/connectionState/${formData.evo_instancia}`,
        {
          headers: {
            'apikey': formData.evo_key
          }
        }
      );

      if (!response.ok) {
        setIsValidCredentials(false);
        throw new Error('Falha ao verificar status da conexão');
      }

      setIsValidCredentials(true);
      const data: ConnectionState = await response.json();
      setConnectionState(data.instance.state);
      
      if (data.instance.state === 'open') {
        await fetchInstances();
      }
      
      return data.instance.state === 'open';
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao verificar status',
        description: 'Não foi possível verificar o status da conexão.',
      });
      setConnectionState(null);
      return false;
    } finally {
      setIsCheckingStatus(false);
    }
  }, [formData.evo_instancia, formData.evo_key]);

  const fetchInstances = async () => {
    if (!formData.evo_key) return;
    
    try {
      const response = await fetch(
        `https://evolution-evolution.ppmwkh.easypanel.host/instance/fetchInstances`,
        {
          headers: {
            'apikey': formData.evo_key
          }
        }
      );

      if (!response.ok) throw new Error('Falha ao buscar instâncias');

      const data = await response.json();
      
      if (Array.isArray(data)) {
        setInstances(data);
        
        if (formData.evo_instancia) {
          const currentInstance = data.find(item => 
            item?.instance?.instanceName === formData.evo_instancia
          );
          
          if (currentInstance?.instance) {
            setInstanceInfo({
              profileName: currentInstance.instance.profileName || null,
              owner: currentInstance.instance.owner || null,
              profilePictureUrl: currentInstance.instance.profilePictureUrl || null
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      // Validate credentials before saving
      await validateCredentials();
      
      const { error } = await supabase
        .from('usuario')
        .update({
          evo_instancia: formData.evo_instancia,
          evo_key: formData.evo_key,
        })
        .eq('uid', user.id);

      if (error) throw error;

      toast({
        title: 'Configurações salvas',
        description: 'Suas configurações foram atualizadas com sucesso.',
      });
      
      await checkConnectionStatus();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar suas configurações.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!formData.evo_instancia || !formData.evo_key) {
      toast({
        variant: 'destructive',
        title: 'Dados incompletos',
        description: 'Por favor, preencha todos os campos antes de conectar.',
      });
      return;
    }

    // Validate credentials before connecting
    const isValid = await validateCredentials();
    if (!isValid) {
      toast({
        variant: 'destructive',
        title: 'Credenciais inválidas',
        description: 'A instância ou o token API são inválidos.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://evolution-evolution.ppmwkh.easypanel.host/instance/connect/${formData.evo_instancia}`,
        {
          headers: {
            'apikey': formData.evo_key
          }
        }
      );

      if (!response.ok) throw new Error('Falha na conexão com Evolution API');

      const data: QRCodeResponse = await response.json();
      
      if (data && data.base64) {
        setQrCodeData(data.base64);
        setShowQRDialog(true);

        toast({
          title: 'Iniciando conexão',
          description: 'Escaneie o QR Code para conectar ao WhatsApp.',
        });
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!formData.evo_instancia || !formData.evo_key) return;
    
    // Validate credentials before disconnecting
    const isValid = await validateCredentials();
    if (!isValid) {
      toast({
        variant: 'destructive',
        title: 'Credenciais inválidas',
        description: 'A instância ou o token API são inválidos.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://evolution-evolution.ppmwkh.easypanel.host/instance/logout/${formData.evo_instancia}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': formData.evo_key
          }
        }
      );

      if (!response.ok) throw new Error('Falha ao desconectar WhatsApp');

      toast({
        title: 'WhatsApp desconectado',
        description: 'Sua conta foi desconectada com sucesso.',
      });
      
      setConnectionState('close');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao desconectar',
        description: 'Não foi possível desconectar o WhatsApp.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = async () => {
    if (!formData.evo_instancia || !formData.evo_key) return;
    
    // Validate credentials before restarting
    const isValid = await validateCredentials();
    if (!isValid) {
      toast({
        variant: 'destructive',
        title: 'Credenciais inválidas',
        description: 'A instância ou o token API são inválidos.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://evolution-evolution.ppmwkh.easypanel.host/instance/restart/${formData.evo_instancia}`,
        {
          method: 'PUT',
          headers: {
            'apikey': formData.evo_key
          }
        }
      );

      if (!response.ok) throw new Error('Falha ao reiniciar a instância');

      toast({
        title: 'WhatsApp reiniciado',
        description: 'Sua instância foi reiniciada com sucesso.',
      });
      
      setTimeout(() => checkConnectionStatus(), 3000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao reiniciar',
        description: 'Não foi possível reiniciar a instância do WhatsApp.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to check connection status on mount
  useEffect(() => {
    if (formData.evo_instancia && formData.evo_key) {
      checkConnectionStatus();
    } else {
      setIsCheckingStatus(false);
    }
  }, [formData.evo_instancia, formData.evo_key, checkConnectionStatus]);

  return {
    isLoading,
    connectionState,
    isCheckingStatus,
    qrCodeData,
    showQRDialog,
    formData,
    isValidCredentials,
    instanceInfo,
    setShowQRDialog,
    handleInputChange,
    handleSave,
    handleConnect,
    handleDisconnect,
    handleRestart,
    checkConnectionStatus,
    validateCredentials
  };
}
