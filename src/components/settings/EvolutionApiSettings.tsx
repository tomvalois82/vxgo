
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Wifi, WifiOff, RefreshCw, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ConnectionState {
  instance: {
    instanceName: string;
    state: 'open' | 'close';
  };
}

interface PairingResponse {
  pairingCode: string;
  code: string;
  count: number;
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

export function EvolutionApiSettings() {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [connectionState, setConnectionState] = useState<'open' | 'close' | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [instances, setInstances] = useState<Instance[]>([]);
  
  const [formData, setFormData] = useState({
    evo_instancia: profile?.evo_instancia || '',
    evo_key: profile?.evo_key || '',
    telefone: profile?.telefone || '',
  });

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

      const data: Instance[] = await response.json();
      setInstances(data);
      
      // Find the current instance and update phone if available
      const currentInstance = data.find(item => 
        item.instance.instanceName === formData.evo_instancia
      );
      
      if (currentInstance?.instance.owner) {
        const ownerPhone = currentInstance.instance.owner.split('@')[0];
        
        setFormData(prev => ({
          ...prev,
          telefone: ownerPhone
        }));
        
        // Update the phone in the database
        if (user && ownerPhone !== profile?.telefone) {
          await supabase
            .from('usuario')
            .update({ telefone: ownerPhone })
            .eq('uid', user.id);
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
      
      // Check connection status after saving
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

      const data: PairingResponse = await response.json();
      setQrCodeData(data.code);
      setShowQRDialog(true);

      toast({
        title: 'Iniciando conexão',
        description: 'Utilize o QR Code para conectar ao WhatsApp.',
      });
      
      // Check connection status after attempting to connect
      setTimeout(() => checkConnectionStatus(), 5000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro na conexão',
        description: 'Não foi possível conectar ao WhatsApp.',
      });
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
      
      // Check connection status after restart
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

  // Check connection status on component mount and when evo_instancia or evo_key changes
  useEffect(() => {
    if (profile?.evo_instancia && profile?.evo_key) {
      checkConnectionStatus();
    } else {
      setIsCheckingStatus(false);
    }
  }, [profile?.evo_instancia, profile?.evo_key]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Configurações do Evolution API</CardTitle>
          {connectionState && (
            <div className="flex items-center gap-2">
              {connectionState === 'open' ? (
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
            <Input
              id="evo_key"
              name="evo_key"
              type="password"
              value={formData.evo_key}
              onChange={handleInputChange}
              placeholder="Digite o token da API"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="telefone">Número de Telefone</Label>
            <Input
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleInputChange}
              placeholder="Digite seu número de telefone"
              readOnly={connectionState === 'open'}
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={isLoading || isCheckingStatus}
            >
              Salvar
            </Button>
            
            {/* Conditional button based on connection status */}
            {connectionState === 'open' ? (
              <Button 
                onClick={handleDisconnect}
                disabled={isLoading || isCheckingStatus}
                variant="destructive"
              >
                Desconectar WhatsApp
              </Button>
            ) : (
              <Button 
                onClick={handleConnect}
                disabled={isLoading || isCheckingStatus || !formData.evo_instancia || !formData.evo_key}
                variant="secondary"
              >
                Conectar WhatsApp
              </Button>
            )}
            
            {/* Restart button only shown when connected */}
            {connectionState === 'open' && (
              <Button 
                onClick={handleRestart}
                disabled={isLoading || isCheckingStatus}
                variant="outline"
              >
                <RefreshCw className="mr-1" size={16} />
                Reiniciar WhatsApp
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conecte seu WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            {qrCodeData && (
              <div className="flex flex-col items-center space-y-4">
                <QrCode size={24} />
                <div className="border-2 border-gray-300 p-4 rounded-lg">
                  <pre className="text-xs overflow-hidden max-w-full break-all whitespace-pre-wrap">
                    {qrCodeData}
                  </pre>
                </div>
                <p className="text-sm text-gray-600">
                  Utilize este código para conectar seu WhatsApp
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
