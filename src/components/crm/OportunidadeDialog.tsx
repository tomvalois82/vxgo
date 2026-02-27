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
import { useCreateOportunidade } from '@/hooks/crm/useKanban';

interface OportunidadeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: number;
  columnName?: string;
}

const OportunidadeDialog: React.FC<OportunidadeDialogProps> = ({
  open,
  onOpenChange,
  columnId,
  columnName,
}) => {
  const [titulo, setTitulo] = useState('');
  const [resumo, setResumo] = useState('');
  const [valor, setValor] = useState('');
  const [obs, setObs] = useState('');
  const createOpp = useCreateOportunidade();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    createOpp.mutate(
      {
        titulo: titulo.trim(),
        resumo: resumo.trim() || undefined,
        valor: valor.trim() || undefined,
        obs: obs.trim() || undefined,
        id_kanban: columnId,
        status: 'aberta',
      },
      {
        onSuccess: () => {
          setTitulo('');
          setResumo('');
          setValor('');
          setObs('');
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Oportunidade</DialogTitle>
          {columnName && (
            <p className="text-sm text-muted-foreground">
              Etapa: <span className="font-medium text-foreground">{columnName}</span>
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="opp-titulo">Título *</Label>
            <Input
              id="opp-titulo"
              placeholder="Ex: Interesse no HB20 2023"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="opp-valor">Valor</Label>
            <Input
              id="opp-valor"
              placeholder="Ex: R$ 85.000"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="opp-resumo">Resumo</Label>
            <Textarea
              id="opp-resumo"
              placeholder="Breve descrição da oportunidade..."
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="opp-obs">Observações</Label>
            <Textarea
              id="opp-obs"
              placeholder="Observações adicionais..."
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={createOpp.isPending} disabled={!titulo.trim()}>
              Criar Oportunidade
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OportunidadeDialog;
