
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { QrCode, Loader } from 'lucide-react';

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
              <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                <img 
                  src={`data:image/png;base64,${qrCodeData}`} 
                  alt="QR Code" 
                  className="w-[240px] h-[240px]"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Abra seu WhatsApp e escaneie o código acima para conectar
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="p-8 rounded-lg flex items-center justify-center">
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
