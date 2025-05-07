
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { QrCode, Loader, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface QRCodeDialogProps {
  qrCodeData: string | null;
  showDialog: boolean;
  onOpenChange: (open: boolean) => void;
  onTimeExpired: () => void;
  onCheckStatus: () => Promise<boolean>;
  connectionState: 'open' | 'close' | null;
}

export function QRCodeDialog({ 
  qrCodeData, 
  showDialog, 
  onOpenChange, 
  onTimeExpired,
  onCheckStatus,
  connectionState
}: QRCodeDialogProps) {
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [isChecking, setIsChecking] = useState(false);

  // Set QR code source when data changes
  useEffect(() => {
    if (qrCodeData) {
      setQrSrc(qrCodeData);
      // Reset countdown when QR code changes
      setCountdown(30);
    } else {
      setQrSrc(null);
    }
  }, [qrCodeData]);

  // Countdown timer
  useEffect(() => {
    let timer: number;
    
    if (showDialog && countdown > 0) {
      timer = window.setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }

    if (showDialog && countdown === 0 && !isChecking) {
      handleTimeExpired();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showDialog, countdown, isChecking]);

  // Check if connection is successful when dialog opens
  useEffect(() => {
    if (showDialog) {
      setCountdown(30);
    }
  }, [showDialog]);

  const handleTimeExpired = async () => {
    setIsChecking(true);
    
    try {
      // Check connection status
      const isConnected = await onCheckStatus();
      
      if (isConnected) {
        // If connected, close dialog
        onOpenChange(false);
      } else {
        // If not connected, refresh QR code
        onTimeExpired();
        // Reset countdown for new QR code
        setCountdown(30);
      }
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conecte seu WhatsApp</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code abaixo usando seu WhatsApp
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          {qrSrc ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg w-full h-[240px] flex items-center justify-center">
                <img 
                  src={qrSrc} 
                  alt="QR Code" 
                  className="w-auto h-auto max-w-full max-h-full"
                />
              </div>
              <div className="flex flex-col items-center">
                <p className="text-sm text-muted-foreground text-center">
                  Abra seu WhatsApp e escaneie o código acima para conectar
                </p>
                <div className="mt-2 flex items-center">
                  {isChecking ? (
                    <div className="flex items-center text-amber-500">
                      <RefreshCw className="mr-2 animate-spin" size={16} />
                      <span>Verificando conexão...</span>
                    </div>
                  ) : (
                    <p className="text-sm font-medium">
                      Tempo restante: <span className="text-primary">{countdown}s</span>
                    </p>
                  )}
                </div>
                {connectionState === 'open' && (
                  <div className="mt-2 text-green-500 font-medium">
                    Conectado com sucesso!
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-lg w-full h-[240px] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                  <QrCode size={180} className="text-muted-foreground" />
                  <Loader className="mt-4 animate-spin" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Carregando QR Code...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
