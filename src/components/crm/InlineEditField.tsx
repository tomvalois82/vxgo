
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pencil } from 'lucide-react';
import { useUpdateLead } from '@/hooks/crm/useUpdateLead';

interface InlineEditFieldProps {
  leadId: number;
  currentValue: string | null;
  fieldName: string;
  displayName: string;
  placeholder?: string;
}

const InlineEditField: React.FC<InlineEditFieldProps> = ({
  leadId,
  currentValue,
  fieldName,
  displayName,
  placeholder
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editValue, setEditValue] = useState(currentValue || '');
  const { updateLead, isLoading } = useUpdateLead();

  const handleSave = async () => {
    const success = await updateLead(leadId, fieldName, editValue);
    if (success) {
      setIsDialogOpen(false);
    }
  };

  const handleCancel = () => {
    setEditValue(currentValue || '');
    setIsDialogOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="truncate" title={currentValue || '-'}>
        {currentValue || '-'}
      </span>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-blue-50"
            title={`Editar ${displayName}`}
          >
            <Pencil className="h-3 w-3 text-blue-600" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar {displayName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-field" className="block text-sm font-medium mb-2">
                {displayName}:
              </label>
              <Input
                id="edit-field"
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder || `Digite o ${displayName.toLowerCase()}`}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InlineEditField;
