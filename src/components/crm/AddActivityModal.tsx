import React, { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCrm } from '@/hooks/crm/useCrm';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { LoaderCircle } from 'lucide-react';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId: number;
  leadId?: number;
  onActivityAdded: () => Promise<void>;
}

const activityTypes = [
  { label: 'Ligação', value: 'Ligação' },
  { label: 'Enviar Mensagem', value: 'Mensagem' },
  { label: 'Reunião', value: 'Reunião' },
  { label: 'Visita', value: 'Visita' },
  { label: 'Outra', value: 'Outra' },
];

const AddActivityModal: React.FC<AddActivityModalProps> = ({ 
  isOpen, 
  onClose, 
  opportunityId,
  leadId,
  onActivityAdded 
}) => {
  const { profile } = useAuth();
  const { addActivity } = useCrm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [activityData, setActivityData] = useState({
    tipo: 'Ligação',
    descricao: '',
    obs: '',
    data_hora: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    concluida: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setActivityData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setActivityData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.id) return;
    
    setIsSubmitting(true);
    
    try {
      const newActivity = {
        id_oportunidade: opportunityId,
        id_usuario: profile.id,
        id_lead: leadId,
        data_hora: activityData.data_hora,
        descricao: activityData.descricao,
        tipo: activityData.tipo,
        obs: activityData.obs || null,
        concluida: activityData.concluida,
      };
      
      const result = await addActivity(newActivity);
      
      if (result) {
        await onActivityAdded();
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Atividade</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tipo" className="text-right">
                Tipo
              </Label>
              <div className="col-span-3">
                <Select
                  value={activityData.tipo}
                  onValueChange={(value) => handleSelectChange('tipo', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="data_hora" className="text-right">
                Data/Hora
              </Label>
              <Input
                id="data_hora"
                name="data_hora"
                type="datetime-local"
                value={activityData.data_hora}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="descricao" className="text-right">
                Descrição
              </Label>
              <Input
                id="descricao"
                name="descricao"
                value={activityData.descricao}
                onChange={handleChange}
                placeholder="Descrição breve da atividade"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="obs" className="text-right pt-2">
                Observações
              </Label>
              <Textarea
                id="obs"
                name="obs"
                value={activityData.obs}
                onChange={handleChange}
                placeholder="Detalhes adicionais sobre a atividade"
                className="col-span-3"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="concluida" className="text-right">
                Concluída
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="concluida"
                  checked={activityData.concluida}
                  onCheckedChange={(checked) => 
                    setActivityData(prevData => ({ ...prevData, concluida: checked }))
                  }
                />
                <Label htmlFor="concluida">
                  {activityData.concluida ? 'Sim' : 'Não'}
                </Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddActivityModal;
