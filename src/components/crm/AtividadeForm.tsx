import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  PhoneCall,
  MessageSquare,
  MapPin,
  CheckCircle2,
  Info,
  StickyNote,
  Plus,
} from 'lucide-react';
import type { AtividadeInsert } from '@/hooks/crm/useAtividades';

const TIPOS = [
  { value: 'Ligação', icon: PhoneCall, label: 'Ligação' },
  { value: 'Mensagem', icon: MessageSquare, label: 'Mensagem' },
  { value: 'Visita', icon: MapPin, label: 'Visita' },
  { value: 'Confirmar', icon: CheckCircle2, label: 'Confirmar' },
  { value: 'Informação', icon: Info, label: 'Informação' },
  { value: 'Observação', icon: StickyNote, label: 'Observação' },
] as const;

interface Props {
  oppId: number;
  leadId: number | null;
  userId: number | null;
  onSubmit: (data: AtividadeInsert) => Promise<any>;
  isCreating: boolean;
}

function toLocalISOString(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

const AtividadeForm: React.FC<Props> = ({ oppId, leadId, userId, onSubmit, isCreating }) => {
  const [tipo, setTipo] = useState<string>('Ligação');
  const [descricao, setDescricao] = useState('');
  const [obs, setObs] = useState('');
  const [dataHora, setDataHora] = useState(toLocalISOString());
  const [concluida, setConcluida] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return;

    await onSubmit({
      id_oportunidade: oppId,
      id_lead: leadId,
      id_usuario: userId,
      tipo,
      descricao: descricao.trim(),
      obs: obs.trim() || null,
      data_hora: dataHora || null,
      concluida,
    });

    // Reset form
    setDescricao('');
    setObs('');
    setDataHora(toLocalISOString());
    setConcluida(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-lg p-3 shadow-sm space-y-3"
    >
      {/* Tipo buttons */}
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-1 flex-wrap">
          {TIPOS.map(({ value, icon: Icon, label }) => (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setTipo(value)}
                  className={`p-2 rounded-md transition-colors ${
                    tipo === value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      {/* Descrição */}
      <Input
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Descrição da atividade..."
        className="font-medium text-sm h-9"
      />

      {/* Observação */}
      <Textarea
        value={obs}
        onChange={(e) => setObs(e.target.value)}
        placeholder="Observação (opcional)..."
        className="text-sm min-h-[50px] resize-none"
        rows={2}
      />

      {/* Data/hora + Concluída + Submit */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          type="datetime-local"
          value={dataHora}
          onChange={(e) => setDataHora(e.target.value)}
          className="text-sm h-8 w-auto"
        />
        <div className="flex items-center gap-1.5">
          <Checkbox
            id="ativ-concluida"
            checked={concluida}
            onCheckedChange={(v) => setConcluida(v === true)}
          />
          <Label htmlFor="ativ-concluida" className="text-xs text-muted-foreground cursor-pointer">
            Concluída
          </Label>
        </div>
        <div className="ml-auto">
          <Button type="submit" size="sm" disabled={isCreating || !descricao.trim()}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Adicionar
          </Button>
        </div>
      </div>
    </form>
  );
};

export default AtividadeForm;
