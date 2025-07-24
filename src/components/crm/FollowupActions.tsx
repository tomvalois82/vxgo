
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, Plus } from 'lucide-react';
import { useUpdateProximoFollowup } from '@/hooks/crm/useUpdateProximoFollowup';

interface FollowupActionsProps {
  leadId: number;
  currentDate: string | null;
}

const FollowupActions: React.FC<FollowupActionsProps> = ({ leadId, currentDate }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [additionalTime, setAdditionalTime] = useState('01:00:00');
  const { setToNow, addTime, isLoading } = useUpdateProximoFollowup();

  const handleSetToNow = async () => {
    await setToNow(leadId);
  };

  const handleAddTime = async () => {
    if (currentDate) {
      const success = await addTime(leadId, currentDate, additionalTime);
      if (success) {
        setIsDialogOpen(false);
        setAdditionalTime('01:00:00');
      }
    }
  };

  const validateTimeFormat = (value: string) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    return timeRegex.test(value);
  };

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAdditionalTime(value);
  };

  return (
    <div className="flex items-center gap-1 ml-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSetToNow}
        disabled={isLoading}
        className="h-6 w-6 p-0 hover:bg-blue-50"
        title="Definir para agora"
      >
        <Clock className="h-3 w-3 text-blue-600" />
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={!currentDate || isLoading}
            className="h-6 w-6 p-0 hover:bg-green-50"
            title="Adicionar tempo"
          >
            <Plus className="h-3 w-3 text-green-600" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Tempo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="additional-time" className="block text-sm font-medium mb-2">
                Tempo adicional (HH:MM:SS):
              </label>
              <Input
                id="additional-time"
                type="text"
                value={additionalTime}
                onChange={handleTimeInputChange}
                placeholder="01:00:00"
                pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formato: HH:MM:SS (ex: 01:30:00 para 1 hora e 30 minutos)
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddTime}
                disabled={!validateTimeFormat(additionalTime) || isLoading}
              >
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FollowupActions;
