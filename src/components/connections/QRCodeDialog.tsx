
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface QRCodeDialogProps {
  qrCodeData: string | null;
  showDialog: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionComplete?: () => void;
}

export function QRCodeDialog({ 
  qrCodeData, 
  showDialog, 
  onOpenChange,
  onConnectionComplete 
}: QRCodeDialogProps) {
  const [timeLeft, setTimeLeft] = useState(60); // 60 segundos para expirar o QR Code
  
  useEffect(() => {
    if (showDialog) {
      setTimeLeft(60);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showDialog]);
  
  useEffect(() => {
    if (timeLeft === 0 && showDialog) {
      onOpenChange(false);
    }
  }, [timeLeft, showDialog, onOpenChange]);

  return (
    <Dialog open={showDialog} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          {qrCodeData ? (
            <>
              <div className="bg-white p-4 rounded">
                <img 
                  src={qrCodeData} 
                  alt="QR Code para conexão do WhatsApp" 
                  className="w-64 h-64"
                />
              </div>
              <p className="text-center text-sm text-gray-500">
                Escaneie este QR Code com seu WhatsApp para conectar.
                <br />
                O código expira em {timeLeft} segundos.
              </p>
              <p className="text-xs text-center text-gray-400">
                Abra o WhatsApp no seu celular → Menu → WhatsApp Web → Escanear QR Code
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p>Carregando QR Code...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
