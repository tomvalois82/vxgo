
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
}

export function EvolutionApiActions({
  isLoading,
  isCheckingStatus,
  connectionState,
  onSave,
  onConnect,
  onDisconnect,
  onRestart,
  hasRequiredFields
}: EvolutionApiActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 pt-4">
      <Button 
        onClick={onSave} 
        disabled={isLoading || isCheckingStatus}
      >
        Salvar
      </Button>
      
      {connectionState === 'open' ? (
        <>
          <Button 
            onClick={onDisconnect}
            disabled={isLoading || isCheckingStatus}
            variant="destructive"
          >
            Desconectar WhatsApp
          </Button>
          <Button 
            onClick={onRestart}
            disabled={isLoading || isCheckingStatus}
            variant="outline"
          >
            <RefreshCw className="mr-1" size={16} />
            Reiniciar WhatsApp
          </Button>
        </>
      ) : (
        <Button 
          onClick={onConnect}
          disabled={isLoading || !hasRequiredFields} // Removed isCheckingStatus to keep button enabled during status check
          variant="secondary"
        >
          <ArrowRight size={16} />
          Conectar WhatsApp
        </Button>
      )}
    </div>
  );
}
