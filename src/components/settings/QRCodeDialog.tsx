
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { QrCode } from 'lucide-react';

interface QRCodeDialogProps {
  qrCodeData: string | null;
  showDialog: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRCodeDialog({ qrCodeData, showDialog, onOpenChange }: QRCodeDialogProps) {
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
          {qrCodeData ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg w-full">
                <img 
                  src={`data:image/png;base64,${qrCodeData}`} 
                  alt="QR Code" 
                  className="w-full"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Abra seu WhatsApp e escaneie o código acima para conectar
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <QrCode size={180} />
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
