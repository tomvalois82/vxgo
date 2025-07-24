
import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface CopyButtonProps {
  text: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copiado!',
        description: 'Session ID copiado para a área de transferência.',
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao copiar para a área de transferência.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-6 w-6 p-0"
    >
      <Copy size={12} />
    </Button>
  );
};

export default CopyButton;
