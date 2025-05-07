
import { useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { QRCodeDialog } from './QRCodeDialog';
import { EvolutionApiForm } from './EvolutionApiForm';
import { EvolutionApiActions } from './EvolutionApiActions';
import { useEvolutionApi } from '@/hooks/useEvolutionApi';
import { InstanceInfoCard } from './InstanceInfoCard';
import { Separator } from '@/components/ui/separator';

export function EvolutionApiSettings() {
  const { profile } = useAuth();
  
  const {
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
    checkConnectionStatus
  } = useEvolutionApi({
    evo_instancia: profile?.evo_instancia || '',
    evo_key: profile?.evo_key || '',
  });

  useEffect(() => {
    if (profile?.evo_instancia && profile?.evo_key) {
      checkConnectionStatus();
    }
  }, [profile?.evo_instancia, profile?.evo_key, checkConnectionStatus]);

  const hasRequiredFields = Boolean(formData.evo_instancia && formData.evo_key);

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
          <EvolutionApiForm 
            formData={formData}
            onInputChange={handleInputChange}
            isConnected={connectionState === 'open'}
            isValidCredentials={isValidCredentials}
          />
          
          <EvolutionApiActions 
            isLoading={isLoading}
            isCheckingStatus={isCheckingStatus}
            connectionState={connectionState}
            onSave={handleSave}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onRestart={handleRestart}
            hasRequiredFields={hasRequiredFields}
            isValidCredentials={isValidCredentials}
          />

          {connectionState === 'open' && (
            <>
              <Separator className="my-4" />
              <InstanceInfoCard 
                profileName={instanceInfo.profileName}
                owner={instanceInfo.owner}
                profilePictureUrl={instanceInfo.profilePictureUrl}
              />
            </>
          )}
        </CardContent>
      </Card>

      <QRCodeDialog 
        qrCodeData={qrCodeData} 
        showDialog={showQRDialog} 
        onOpenChange={setShowQRDialog}
        onTimeExpired={handleConnect}
        onCheckStatus={checkConnectionStatus}
        connectionState={connectionState} 
      />
    </>
  );
}
