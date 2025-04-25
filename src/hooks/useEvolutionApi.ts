
import { useState } from 'react';
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
  };
}

export interface EvolutionApiFormData {
  evo_instancia: string;
  evo_key: string;
  telefone: string;
}

export function useEvolutionApi(initialFormData: EvolutionApiFormData) {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [connectionState, setConnectionState] = useState<'open' | 'close' | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [formData, setFormData] = useState<EvolutionApiFormData>(initialFormData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const checkConnectionStatus = async () => {
    if (!formData.evo_instancia || !formData.evo_key) {
      setConnectionState(null);
      setIsCheckingStatus(false);
      return;
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

      if (!response.ok) throw new Error('Falha ao verificar status da conexão');

      const data: ConnectionState = await response.json();
      setConnectionState(data.instance.state);
      
      if (data.instance.state === 'open') {
        await fetchInstances();
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao verificar status',
        description: 'Não foi possível verificar o status da conexão.',
      });
      setConnectionState(null);
    } finally {
      setIsCheckingStatus(false);
    }
  };

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
          
          if (currentInstance?.instance?.owner) {
            const ownerPhone = currentInstance.instance.owner.split('@')[0];
            setFormData(prev => ({ ...prev, telefone: ownerPhone }));
            
            if (user && ownerPhone !== profile?.telefone) {
              await supabase
                .from('usuario')
                .update({ telefone: ownerPhone })
                .eq('uid', user.id);
            }
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
      const { error } = await supabase
        .from('usuario')
        .update({
          evo_instancia: formData.evo_instancia,
          evo_key: formData.evo_key,
          telefone: formData.telefone,
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

      const data = await response.json();
      
      if (data && data.code) {
        setQrCodeData(data.code);
        setShowQRDialog(true);

        toast({
          title: 'Iniciando conexão',
          description: 'Escaneie o QR Code para conectar ao WhatsApp.',
        });
        
        setTimeout(() => checkConnectionStatus(), 5000);
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

  return {
    isLoading,
    connectionState,
    isCheckingStatus,
    qrCodeData,
    showQRDialog,
    formData,
    setShowQRDialog,
    handleInputChange,
    handleSave,
    handleConnect,
    handleDisconnect,
    handleRestart,
    checkConnectionStatus
  };
}
