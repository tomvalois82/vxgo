
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          {qrCodeData && (
            <div className="flex flex-col items-center space-y-4">
              <QrCode size={180} />
              <div className="bg-secondary p-4 rounded-lg w-full">
                <img 
                  src={`data:image/png;base64,${qrCodeData}`} 
                  alt="QR Code" 
                  className="w-full"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Escaneie o QR Code acima usando seu WhatsApp
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
