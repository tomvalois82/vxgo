
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
              <div className="bg-white p-4 rounded-lg w-full h-[300px] flex items-center justify-center">
                {qrCodeData && (
                  <img 
                    src={`https://quickchart.io/qr?text=${qrCodeData}&A2&size=300`}
                    alt="QR Code" 
                    className="w-auto h-auto max-w-full max-h-full"
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Abra seu WhatsApp e escaneie o código acima para conectar
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-lg w-full h-[300px] flex items-center justify-center">
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
