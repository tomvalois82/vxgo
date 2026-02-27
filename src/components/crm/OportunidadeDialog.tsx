import React, { useState, useMemo } from 'react';
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
import { useCreateOportunidade } from '@/hooks/crm/useKanban';
import { useUserStockVehicles } from '@/hooks/crm/useUserStockVehicles';
import { formatCurrency, extractNumericValue } from '@/lib/formUtils';
import { Car } from 'lucide-react';
import LeadSearchField, { type LeadOption } from './LeadSearchField';
import CreateLeadDialog from './CreateLeadDialog';

interface OportunidadeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: number;
  columnName?: string;
}

const EXCLUDED_STATUS = ['vendido', 'fora de estoque'];

const OportunidadeDialog: React.FC<OportunidadeDialogProps> = ({
  open,
  onOpenChange,
  columnId,
  columnName,
}) => {
  const [titulo, setTitulo] = useState('');
  const [resumo, setResumo] = useState('');
  const [valorDisplay, setValorDisplay] = useState('');
  const [obs, setObs] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<LeadOption | null>(null);
  const [showCreateLead, setShowCreateLead] = useState(false);
  const createOpp = useCreateOportunidade();
  const { data: vehicles = [] } = useUserStockVehicles();

  const availableVehicles = useMemo(
    () =>
      vehicles.filter(
        (v) => !EXCLUDED_STATUS.includes((v.status ?? '').toLowerCase())
      ),
    [vehicles]
  );

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setValorDisplay('');
      return;
    }
    setValorDisplay(formatCurrency(raw));
  };

  const resetForm = () => {
    setTitulo('');
    setResumo('');
    setValorDisplay('');
    setObs('');
    setSelectedVehicleId('');
    setSelectedLead(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    const numericValor = valorDisplay ? extractNumericValue(valorDisplay) : null;

    createOpp.mutate(
      {
        titulo: titulo.trim(),
        resumo: resumo.trim() || undefined,
        valor: numericValor && numericValor > 0 ? numericValor : undefined,
        obs: obs.trim() || undefined,
        id_kanban: columnId,
        status: 'aberta',
        idEstoque: selectedVehicleId ? Number(selectedVehicleId) : undefined,
        id_lead: selectedLead?.id ?? undefined,
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <>
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

          <LeadSearchField
            selectedLead={selectedLead}
            onSelectLead={setSelectedLead}
            onCreateNew={() => setShowCreateLead(true)}
          />

          <div className="space-y-2">
            <Label htmlFor="opp-valor">Valor</Label>
            <Input
              id="opp-valor"
              placeholder="R$ 0,00"
              value={valorDisplay}
              onChange={handleValorChange}
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="opp-veiculo">Veículo</Label>
            <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
              <SelectTrigger id="opp-veiculo">
                <SelectValue placeholder="Selecione um veículo (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {availableVehicles.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    <span className="flex items-center gap-2">
                      <Car className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">
                        {[v.fabricante, v.modelo, v.ano].filter(Boolean).join(' ') || `Veículo #${v.id}`}
                        {v.valor != null ? ` — R$ ${v.valor}` : ''}
                      </span>
                    </span>
                  </SelectItem>
                ))}
                {availableVehicles.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Nenhum veículo disponível
                  </div>
                )}
              </SelectContent>
            </Select>
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
            <Button type="submit" disabled={!titulo.trim() || createOpp.isPending}>
              {createOpp.isPending ? 'Criando...' : 'Criar Oportunidade'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <CreateLeadDialog
      open={showCreateLead}
      onOpenChange={setShowCreateLead}
      onCreated={(lead) => setSelectedLead(lead)}
    />
    </>
  );
};


export default OportunidadeDialog;
