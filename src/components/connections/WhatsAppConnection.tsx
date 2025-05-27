
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Wifi, WifiOff, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeDialog } from '@/components/connections/QRCodeDialog';

export const WhatsAppConnection = () => {
  const { profile, user } = useAuth();
  const [formData, setFormData] = useState({
    evo_instancia: profile?.evo_instancia || '',
    evo_key: profile?.evo_key || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'open' | 'close' | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [isCredentialsValid, setIsCredentialsValid] = useState<boolean | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  // Verifica se as credenciais são válidas sem alterar o estado da conexão
  const validateCredentials = async () => {
    if (!formData.evo_instancia || !formData.evo_key) {
      setIsCredentialsValid(null);
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
  };

  // Effect para validar credenciais quando elas mudam
  useEffect(() => {
    const debounceValidation = setTimeout(() => {
      if (formData.evo_instancia && formData.evo_key) {
        validateCredentials();
      }
    }, 800); // Debounce para evitar muitas requisições

    return () => clearTimeout(debounceValidation);
  }, [formData.evo_instancia, formData.evo_key]);

  const checkConnectionStatus = async () => {
    if (!formData.evo_instancia || !formData.evo_key) {
      setConnectionStatus(null);
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

      if (!response.ok) {
        setIsCredentialsValid(false);
        throw new Error('Falha ao verificar status da conexão');
      }

      setIsCredentialsValid(true);
      const data = await response.json();
      setConnectionStatus(data.instance.state);
      
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
      setConnectionStatus(null);
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
        // Encontrar a instância atual
        const currentInstance = data.find(item => 
          item?.instance?.instanceName === formData.evo_instancia
        );
        
        if (currentInstance?.instance) {
          setPhoneNumber(currentInstance.instance.owner || null);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Resetar validação quando as credenciais mudam
    if (name === 'evo_instancia' || name === 'evo_key') {
      setIsCredentialsValid(null);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      // Validar credenciais antes de salvar
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

    // Validar credenciais antes de conectar
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

      const data = await response.json();
      
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
    
    // Validar credenciais antes de desconectar
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
      
      setConnectionStatus('close');
      setPhoneNumber(null);
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
    
    // Validar credenciais antes de reiniciar
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

  // Verificar status inicial
  useEffect(() => {
    if (formData.evo_instancia && formData.evo_key) {
      checkConnectionStatus();
    } else {
      setIsCheckingStatus(false);
    }
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>WhatsApp</CardTitle>
        {connectionStatus && (
          <div className="flex items-center gap-2">
            {connectionStatus === 'open' ? (
              <div className="flex items-center text-green-500">
                <Wifi className="mr-1" size={16} />
                <span className="text-sm">Conectado</span>
              </div>
            ) : (
              <div className="flex items-center text-red-500">
                <WifiOff className="mr-1" size={16} />
                <span className="text-sm">Desconectado</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="evo_instancia">Nome da Instância</Label>
          <Input
            id="evo_instancia"
            name="evo_instancia"
            value={formData.evo_instancia}
            onChange={handleInputChange}
            placeholder="Digite o nome da instância"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="evo_key">Token API</Label>
          <div className="relative">
            <Input
              id="evo_key"
              name="evo_key"
              type="password"
              value={formData.evo_key}
              onChange={handleInputChange}
              placeholder="Digite o token da API"
            />
            {isCredentialsValid !== null && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isCredentialsValid ? (
                  <Check className="text-green-500 w-5 h-5" />
                ) : (
                  <X className="text-red-500 w-5 h-5" />
                )}
              </div>
            )}
          </div>
        </div>
        
        {phoneNumber && (
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={phoneNumber}
              readOnly
              className="bg-gray-50"
            />
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
          
          {connectionStatus === 'close' && (
            <Button 
              variant="outline" 
              onClick={handleConnect} 
              disabled={isLoading || !isCredentialsValid}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Conectar WhatsApp
            </Button>
          )}
          
          {connectionStatus === 'open' && (
            <>
              <Button 
                variant="outline" 
                onClick={handleDisconnect} 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Desconectar WhatsApp
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleRestart} 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reiniciar WhatsApp
              </Button>
            </>
          )}
        </div>
        
        {isCheckingStatus && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
            <span>Verificando status da conexão...</span>
          </div>
        )}
      </CardContent>
      
      <QRCodeDialog
        qrCodeData={qrCodeData}
        showDialog={showQRDialog}
        onOpenChange={setShowQRDialog}
        onConnectionComplete={() => {
          setShowQRDialog(false);
          checkConnectionStatus();
        }}
      />
    </Card>
  );
};
