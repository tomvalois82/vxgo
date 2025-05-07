
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, Check, ArrowRight } from 'lucide-react';

interface EvolutionApiActionsProps {
  isLoading: boolean;
  isCheckingStatus: boolean;
  connectionState: 'open' | 'close' | null;
  onSave: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onRestart: () => void;
  hasRequiredFields: boolean;
  isValidCredentials: boolean | null;
}

export function EvolutionApiActions({
  isLoading,
  isCheckingStatus,
  connectionState,
  onSave,
  onConnect,
  onDisconnect,
  onRestart,
  hasRequiredFields,
  isValidCredentials
}: EvolutionApiActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 pt-4">
      <Button 
        onClick={onSave} 
        disabled={isLoading || isCheckingStatus || !hasRequiredFields}
      >
        Salvar
      </Button>
      
      {connectionState === 'open' ? (
        <>
          <Button 
            onClick={onDisconnect}
            disabled={isLoading || isCheckingStatus || isValidCredentials === false}
            variant="destructive"
          >
            Desconectar WhatsApp
          </Button>
          <Button 
            onClick={onRestart}
            disabled={isLoading || isCheckingStatus || isValidCredentials === false}
            variant="outline"
          >
            <RefreshCw className="mr-1" size={16} />
            Reiniciar WhatsApp
          </Button>
        </>
      ) : (
        <Button 
          onClick={onConnect}
          disabled={isLoading || !hasRequiredFields || isValidCredentials !== true}
          variant="secondary"
        >
          <ArrowRight size={16} />
          Conectar WhatsApp
        </Button>
      )}
    </div>
  );
}
