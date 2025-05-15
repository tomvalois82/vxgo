
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, Check, ArrowRight, LoaderCircle } from 'lucide-react'; // Added LoaderCircle

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
  const combinedLoading = isLoading || isCheckingStatus;
  return (
    <div className="flex flex-wrap gap-2 pt-4">
      <Button 
        onClick={onSave} 
        loading={isLoading} // Specifically isLoading for save
        disabled={combinedLoading || !hasRequiredFields}
      >
        Salvar
      </Button>
      
      {connectionState === 'open' ? (
        <>
          <Button 
            onClick={onDisconnect}
            loading={isLoading} // Specifically isLoading for disconnect
            disabled={combinedLoading || isValidCredentials === false}
            variant="destructive"
          >
            Desconectar WhatsApp
          </Button>
          <Button 
            onClick={onRestart}
            loading={isLoading} // Specifically isLoading for restart
            disabled={combinedLoading || isValidCredentials === false}
            variant="outline"
          >
            <RefreshCw className="mr-1" size={16} />
            Reiniciar WhatsApp
          </Button>
        </>
      ) : (
        <Button 
          onClick={onConnect}
          loading={isLoading} // Specifically isLoading for connect
          disabled={combinedLoading || !hasRequiredFields || isValidCredentials !== true}
          variant="secondary"
        >
          <ArrowRight size={16} />
          Conectar WhatsApp
        </Button>
      )}
    </div>
  );
}

