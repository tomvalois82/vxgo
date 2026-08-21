import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Pencil, User, Phone, Mail, Car, CalendarClock, Check, Search, X, Trash2, ChevronDown, ChevronUp, Trophy, ThumbsDown, RotateCcw } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import AnexoGallery from './AnexoGallery';
import { useOportunidadeDetail } from '@/hooks/crm/useOportunidadeDetail';
import { useUpdateOportunidade } from '@/hooks/crm/useUpdateOportunidade';
import { useKanbanColumns, useDeleteOportunidade } from '@/hooks/crm/useKanban';
import { useActiveFunis } from '@/hooks/crm/useFunis';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUserStockVehicles, type Vehicle } from '@/hooks/crm/useUserStockVehicles';
import { useConfigUsers } from '@/hooks/crm/useConfigUsers';
import { useLeads, type Lead } from '@/hooks/crm/useLeads';
import { useAtividades } from '@/hooks/crm/useAtividades';
import { formatCurrency } from '@/lib/utils';
import AtividadeForm from './AtividadeForm';
import AtividadeTimeline from './AtividadeTimeline';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Props {
  oppId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ─── Inline editable field ─── */
interface EditableFieldProps {
  value: string;
  onSave: (val: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  inputClassName?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({
  value,
  onSave,
  placeholder = 'Clique para editar',
  multiline = false,
  className = '',
  inputClassName = '',
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft.trim());
  }, [draft, value, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setDraft(value); setEditing(false); }
  };

  if (editing) {
    const sharedClass = `w-full bg-background border border-input rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring ${inputClassName}`;
    return multiline ? (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        className={`${sharedClass} min-h-[60px] resize-y`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
      />
    ) : (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        className={sharedClass}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <span
      className={`group inline-flex items-start gap-1.5 cursor-pointer ${className}`}
      onClick={() => setEditing(true)}
      title="Clique para editar"
    >
      <span className={`${value ? 'whitespace-pre-wrap' : 'text-muted-foreground italic'}`}>
        {value || placeholder}
      </span>
      <Pencil className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0 mt-0.5" />
    </span>
  );
};

/* ─── Editable Value (currency) ─── */
const EditableValue: React.FC<{
  value: number | null;
  onSave: (val: number | null) => void;
}> = ({ value, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value != null ? String(value) : '');
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const parsed = parseFloat(draft.replace(/[^\d.,]/g, '').replace(',', '.'));
    const newVal = isNaN(parsed) ? null : parsed;
    if (newVal !== value) onSave(newVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setDraft(value != null ? String(value) : ''); setEditing(false); }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="bg-background border border-input rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring w-40"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder="0.00"
      />
    );
  }

  return (
    <span
      className="group inline-flex items-center gap-1.5 cursor-pointer"
      onClick={() => setEditing(true)}
      title="Clique para editar"
    >
      <span className={value != null ? 'text-sm text-muted-foreground' : 'text-sm text-muted-foreground italic'}>
        {value != null ? formatCurrency(value) : 'Sem valor'}
      </span>
      <Pencil className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
    </span>
  );
};

/* ─── Vehicle Autocomplete ─── */
const VehicleAutocomplete: React.FC<{
  vehicles: Vehicle[];
  currentId: number | null;
  onSelect: (id: number | null) => void;
}> = ({ vehicles, currentId, onSelect }) => {
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentVehicle = useMemo(() => vehicles.find(v => v.id === currentId), [vehicles, currentId]);
  const vehicleLabel = (v: Vehicle) => [v.fabricante, v.modelo, v.ano].filter(Boolean).join(' ');

  const filtered = useMemo(() => {
    if (!search.trim()) return vehicles.slice(0, 15);
    const term = search.toLowerCase();
    return vehicles.filter(v =>
      vehicleLabel(v).toLowerCase().includes(term) ||
      (v.placa && v.placa.toLowerCase().includes(term))
    ).slice(0, 15);
  }, [vehicles, search]);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setEditing(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [editing]);

  if (editing) {
    return (
      <div ref={containerRef} className="relative">
        <div className="flex items-center gap-1">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            className="w-full bg-background border border-input rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar veículo..."
          />
          {currentId && (
            <button
              className="text-muted-foreground hover:text-destructive"
              onClick={() => { onSelect(null); setEditing(false); setSearch(''); }}
              title="Remover veículo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {filtered.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
            {filtered.map(v => (
              <button
                key={v.id}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${v.id === currentId ? 'bg-accent/50 font-medium' : ''}`}
                onClick={() => { onSelect(v.id); setEditing(false); setSearch(''); }}
              >
                <span>{vehicleLabel(v)}</span>
                {v.placa && <span className="ml-2 text-muted-foreground text-xs">({v.placa})</span>}
              </button>
            ))}
          </div>
        )}
        {filtered.length === 0 && search.trim() && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md p-3">
            <p className="text-sm text-muted-foreground">Nenhum veículo encontrado</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="group flex items-center gap-2 text-sm cursor-pointer"
      onClick={() => setEditing(true)}
      title="Clique para editar"
    >
      <Car className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className={currentVehicle ? '' : 'text-muted-foreground italic'}>
        {currentVehicle ? vehicleLabel(currentVehicle) : 'Nenhum veículo'}
      </span>
      <Pencil className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
    </div>
  );
};

/* ─── Lead Autocomplete ─── */
const LeadAutocomplete: React.FC<{
  leads: Lead[];
  currentId: number | null;
  onSelect: (id: number | null) => void;
}> = ({ leads, currentId, onSelect }) => {
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLead = useMemo(() => leads.find(l => l.id === currentId), [leads, currentId]);
  const leadLabel = (l: Lead) => [l.nome, l.telefone].filter(Boolean).join(' — ');

  const filtered = useMemo(() => {
    if (!search.trim()) return leads.slice(0, 15);
    const term = search.toLowerCase();
    return leads.filter(l =>
      (l.nome && l.nome.toLowerCase().includes(term)) ||
      (l.telefone && l.telefone.toLowerCase().includes(term))
    ).slice(0, 15);
  }, [leads, search]);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setEditing(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [editing]);

  if (editing) {
    return (
      <div ref={containerRef} className="relative">
        <div className="flex items-center gap-1">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            className="w-full bg-background border border-input rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar lead por nome ou telefone..."
          />
          {currentId && (
            <button
              className="text-muted-foreground hover:text-destructive"
              onClick={() => { onSelect(null); setEditing(false); setSearch(''); }}
              title="Remover lead"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {filtered.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
            {filtered.map(l => (
              <button
                key={l.id}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${l.id === currentId ? 'bg-accent/50 font-medium' : ''}`}
                onClick={() => { onSelect(l.id); setEditing(false); setSearch(''); }}
              >
                <span>{l.nome || 'Sem nome'}</span>
                {l.telefone && <span className="ml-2 text-muted-foreground text-xs">({l.telefone})</span>}
              </button>
            ))}
          </div>
        )}
        {filtered.length === 0 && search.trim() && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md p-3">
            <p className="text-sm text-muted-foreground">Nenhum lead encontrado</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="group flex items-center gap-2 text-sm cursor-pointer"
      onClick={() => setEditing(true)}
      title="Clique para vincular um lead"
    >
      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className={currentLead ? '' : 'text-muted-foreground italic'}>
        {currentLead ? leadLabel(currentLead) : 'Nenhum lead vinculado'}
      </span>
      <Pencil className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
    </div>
  );
};

/* ─── Kanban Stage Selector ─── */
const KanbanStageSelector: React.FC<{
  columns: { id: number; descricao: string | null; cor: string | null; visivel: boolean | null }[];
  currentId: number | null;
  onChange: (id: number) => void;
}> = ({ columns, currentId, onChange }) => {
  const visibleColumns = useMemo(() => columns.filter(c => c.visivel !== false), [columns]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto">
        {visibleColumns.map((col, idx) => {
          const isActive = col.id === currentId;
          const color = col.cor || 'hsl(var(--primary))';
          return (
            <React.Fragment key={col.id}>
              {idx > 0 && (
                <div className="w-3 h-px bg-border shrink-0" />
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => { if (!isActive) onChange(col.id); }}
                    className={`shrink-0 rounded-full transition-all flex items-center justify-center ${
                      isActive ? 'w-6 h-6 ring-2 ring-offset-1 ring-offset-background' : 'w-4 h-4 opacity-50 hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: color,
                      ...(isActive ? { ringColor: color } : {}),
                    }}
                  >
                    {isActive && <Check className="h-3 w-3 text-white" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {col.descricao || 'Sem nome'}
                </TooltipContent>
              </Tooltip>
            </React.Fragment>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

/* ─── Origem options ─── */
const ORIGENS = [
  { value: 'Whatsapp', label: 'Whatsapp', cor: '#22c55e' },
  { value: 'Olx', label: 'Olx', cor: '#7c3aed' },
  { value: 'Webmotors', label: 'Webmotors', cor: '#dc2626' },
  { value: 'Instagram', label: 'Instagram', cor: '#ec4899' },
  { value: 'Facebook', label: 'Facebook', cor: '#2563eb' },
  { value: 'Indicação', label: 'Indicação', cor: '#eab308' },
  { value: 'Carteira', label: 'Carteira', cor: '#9ca3af' },
  { value: 'Outros', label: 'Outros', cor: '#92400e' },
] as const;

/* ─── Main Dialog ─── */
const OportunidadeDetailDialog: React.FC<Props> = ({ oppId, open, onOpenChange }) => {
  const { data: opp, isLoading } = useOportunidadeDetail(oppId);
  const updateOpp = useUpdateOportunidade();
  const { data: funis = [] } = useActiveFunis();
  const [selectedFunilId, setSelectedFunilId] = useState<number | null>(null);
  const { data: columns = [] } = useKanbanColumns(selectedFunilId);
  const { data: vehicles = [] } = useUserStockVehicles();
  const { data: leads = [] } = useLeads();
  const { data: configUsers = [] } = useConfigUsers();
  const { atividades, create: ativCreate, update: ativUpdate, remove: ativRemove, isCreating: ativIsCreating } = useAtividades(oppId);
  const queryClient = useQueryClient();
  const deleteOpp = useDeleteOportunidade();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLossDialog, setShowLossDialog] = useState(false);
  const [motivoPerda, setMotivoPerda] = useState('');
  const [formOpen, setFormOpen] = useState(true);

  // Auto-detect funnel from opp's current kanban column
  useEffect(() => {
    if (!opp?.id_kanban || selectedFunilId) return;
    // Find which funnel contains this kanban column by querying all funnels' columns
    const detectFunil = async () => {
      const { data } = await supabase
        .from('kanban')
        .select('crm_funil')
        .eq('id', opp.id_kanban!)
        .single();
      if (data?.crm_funil) {
        setSelectedFunilId(data.crm_funil);
      }
    };
    detectFunil();
  }, [opp?.id_kanban]);

  // Reset funnel selection when dialog closes
  useEffect(() => {
    if (!open) setSelectedFunilId(null);
  }, [open]);

  const currentVehicle = useMemo(
    () => vehicles.find((v) => v.id === opp?.idEstoque),
    [vehicles, opp?.idEstoque]
  );

  const vehicleLabel = useMemo(() => {
    if (!currentVehicle) return null;
    return [currentVehicle.fabricante, currentVehicle.modelo, currentVehicle.ano]
      .filter(Boolean)
      .join(' ');
  }, [currentVehicle]);

  const save = useCallback(
    (field: string, value: any) => {
      if (!opp) return;
      updateOpp.mutate(
        { id: opp.id, [field]: value },
        {
          onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['oportunidade-detail', opp.id] }),
        }
      );
    },
    [opp, updateOpp, queryClient]
  );

  const saveLead = useCallback(
    async (field: string, value: string) => {
      if (!opp?.id_lead) return;
      await supabase.from('lead').update({ [field]: value }).eq('id', opp.id_lead);
      queryClient.invalidateQueries({ queryKey: ['oportunidade-detail', opp.id] });
    },
    [opp, queryClient]
  );

  const subtitleParts: string[] = [];
  if (opp?.valor) subtitleParts.push(formatCurrency(opp.valor));
  if (vehicleLabel) subtitleParts.push(vehicleLabel);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[90vw] md:max-w-[85vw] md:w-[85vw] h-[85vh] max-h-[85vh] p-0 gap-0 flex flex-col overflow-hidden">
        {isLoading || !opp ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <>
            {/* ─── Header ─── */}
            <div className="px-6 py-4 border-b shrink-0 pr-40">
              {/* Timestamps */}
              {(opp.data_criacao || opp.ultima_interacao) && (
                <div className="text-xs text-muted-foreground/60 italic mb-1.5">
                  {opp.data_criacao && (
                    <span>
                      Criado em {new Date(opp.data_criacao).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  {opp.data_criacao && opp.ultima_interacao && <span> • </span>}
                  {opp.ultima_interacao && (
                    <span>
                      Última interação em {new Date(opp.ultima_interacao).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              )}
              <EditableField
                value={opp.titulo || ''}
                onSave={(v) => save('titulo', v)}
                placeholder="Título da oportunidade"
                className="text-xl font-bold text-foreground"
                inputClassName="text-xl font-bold"
              />
              <div className="flex items-center gap-2 mt-0.5">
                <EditableValue
                  value={opp.valor}
                  onSave={(v) => save('valor', v)}
                />
                {vehicleLabel && (
                  <>
                    <span className="text-sm text-muted-foreground">—</span>
                    <span className="text-sm text-muted-foreground">{vehicleLabel}</span>
                  </>
                )}
              </div>
            </div>

            {/* Quick-action stage buttons + Delete button (top-right) */}
            <div className="absolute right-12 top-4 flex items-center gap-1.5">
              {/* Status buttons: Ganhou / Perdeu / Reabrir */}
              {opp.status === 'ganhou' || opp.status === 'perdeu' ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => save('status', 'aberta')}
                >
                  <RotateCcw className="h-3 w-3" />
                  Reabrir
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                    onClick={() => save('status', 'ganhou')}
                  >
                    <Trophy className="h-3 w-3" />
                    Ganhou
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                    onClick={() => { setMotivoPerda(opp.motivo_perda || ''); setShowLossDialog(true); }}
                  >
                    <ThumbsDown className="h-3 w-3" />
                    Perdeu
                  </Button>
                </>
              )}
              <button
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                title="Excluir oportunidade"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir oportunidade?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação é irreversível. Todas as atividades atreladas a esta oportunidade também serão excluídas permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => {
                      if (!opp) return;
                      deleteOpp.mutate(opp.id, {
                        onSuccess: () => {
                          onOpenChange(false);
                        },
                      });
                    }}
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Loss reason dialog */}
            <AlertDialog open={showLossDialog} onOpenChange={setShowLossDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Motivo da perda</AlertDialogTitle>
                  <AlertDialogDescription>
                    Descreva o motivo pelo qual esta oportunidade foi perdida.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                  value={motivoPerda}
                  onChange={(e) => setMotivoPerda(e.target.value)}
                  placeholder="Ex: Cliente optou pela concorrência..."
                  rows={3}
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (!opp) return;
                      updateOpp.mutate(
                        { id: opp.id, status: 'perdeu', motivo_perda: motivoPerda.trim() || null },
                        {
                          onSuccess: () => {
                            queryClient.invalidateQueries({ queryKey: ['oportunidade-detail', opp.id] });
                            setShowLossDialog(false);
                          },
                        }
                      );
                    }}
                  >
                    Ok
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* ─── Body ─── */}
            <div className="flex flex-1 min-h-0">
              {/* ─── Left sidebar ─── */}
              <ScrollArea className="w-full max-w-xs border-r shrink-0">
                <div className="p-4 space-y-5">
                  {/* Etapa */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Etapa
                      </p>
                      <Select
                        value={selectedFunilId ? String(selectedFunilId) : ''}
                        onValueChange={(v) => setSelectedFunilId(Number(v))}
                      >
                        <SelectTrigger className="h-6 text-xs w-auto min-w-[100px] max-w-[160px] px-2 py-0">
                          <SelectValue placeholder="Funil" />
                        </SelectTrigger>
                        <SelectContent>
                          {funis.map(f => (
                            <SelectItem key={f.id} value={String(f.id)}>
                              {f.titulo || `Funil #${f.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <KanbanStageSelector
                      columns={columns}
                      currentId={opp.id_kanban}
                      onChange={(id) => save('id_kanban', id)}
                    />
                  </div>

                  {/* Lead */}
                  <SidebarSection title="Lead / Interessado">
                    {opp.lead ? (
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <EditableField
                            value={opp.lead.nome || ''}
                            onSave={(v) => saveLead('nome', v)}
                            placeholder="Nome"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <EditableField
                            value={opp.lead.telefone || ''}
                            onSave={(v) => saveLead('telefone', v)}
                            placeholder="Telefone"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <EditableField
                            value={opp.lead.email || ''}
                            onSave={(v) => saveLead('email', v)}
                            placeholder="E-mail"
                          />
                        </div>
                      </div>
                    ) : (
                      <LeadAutocomplete
                        leads={leads}
                        currentId={opp.id_lead}
                        onSelect={(id) => save('id_lead', id)}
                      />
                    )}
                  </SidebarSection>

                  <Separator />

                  {/* Responsável */}
                  <SidebarSection title="Responsável">
                    <Select
                      value={opp.id_usuario ? String(opp.id_usuario) : '__none__'}
                      onValueChange={(v) => save('id_usuario', v === '__none__' ? null : Number(v))}
                    >
                      <SelectTrigger className="w-full h-8 text-sm">
                        <SelectValue placeholder="Selecionar responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
                        {configUsers.map(u => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.nome || `Usuário #${u.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </SidebarSection>

                  {/* Veículo */}
                  <SidebarSection title="Veículo de Interesse">
                    <VehicleAutocomplete
                      vehicles={vehicles}
                      currentId={opp.idEstoque}
                      onSelect={(id) => save('idEstoque', id)}
                    />
                  </SidebarSection>

                  <Separator />

                  {/* Origem do lead */}
                  <SidebarSection title="Origem do lead">
                    {opp.lead ? (
                      (() => {
                        // Encontra a origem correspondente ignorando maiúsculas/minúsculas
                        const origemBruta = opp.lead.Origem?.trim() ?? '';
                        const origemAtual = ORIGENS.find(
                          o => o.value.toLowerCase() === origemBruta.toLowerCase()
                        );
                        return (
                       <Select
                         value={origemAtual?.value ?? ''}
                         onValueChange={(v) => saveLead('Origem', v)}
                       >
                         <SelectTrigger className="w-full h-8 text-sm">
                           <SelectValue placeholder="Selecionar origem">
                             {origemBruta ? (
                               <span className="flex items-center gap-2">
                                 <span
                                   className="inline-block rounded-full"
                                   style={{
                                     width: 10,
                                     height: 10,
                                     backgroundColor: origemAtual?.cor ?? '#cbd5e1',
                                   }}
                                 />
                                 {origemAtual?.label ?? origemBruta}
                               </span>
                             ) : null}
                           </SelectValue>
                         </SelectTrigger>
                        <SelectContent>
                          {ORIGENS.map(o => (
                            <SelectItem key={o.value} value={o.value}>
                              <span className="flex items-center gap-2">
                                <span
                                  className="inline-block rounded-full"
                                  style={{ width: 10, height: 10, backgroundColor: o.cor }}
                                />
                                {o.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                       </Select>
                        );
                      })()
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Nenhum lead vinculado</p>
                    )}
                  </SidebarSection>

                  <Separator />

                  {/* Resumo */}
                  <SidebarSection title="Resumo">
                    <EditableField
                      value={opp.resumo || ''}
                      onSave={(v) => save('resumo', v)}
                      placeholder="Adicionar resumo..."
                      multiline
                    />
                  </SidebarSection>

                  {/* Observação */}
                  <SidebarSection title="Observação">
                    <EditableField
                      value={opp.obs || ''}
                      onSave={(v) => save('obs', v)}
                      placeholder="Adicionar observação..."
                      multiline
                    />
                  </SidebarSection>

                  <Separator />

                  {/* Anexos */}
                  <AnexoGallery oppId={opp.id} />
                </div>
              </ScrollArea>

              {/* ─── Central area: Atividades ─── */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Status result box */}
                {opp.status === 'perdeu' && (
                  <div className="mx-4 mt-4 mb-2 rounded-md border border-red-300 bg-red-50 p-3">
                    <p className="text-sm font-semibold text-red-600 mb-1">Perdeu</p>
                    <EditableField
                      value={opp.motivo_perda || ''}
                      onSave={(v) => save('motivo_perda', v)}
                      placeholder="Adicionar motivo da perda..."
                      multiline
                      className="text-sm text-red-900"
                    />
                    {opp.data_finalizado && (
                      <p className="text-xs text-red-400 mt-2">
                        Finalizado em {new Date(opp.data_finalizado).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                )}
                {opp.status === 'ganhou' && (
                  <div className="mx-4 mt-4 mb-2 rounded-md border border-green-300 bg-green-50 p-3">
                    <p className="text-sm font-semibold text-green-600 mb-1">Ganhou</p>
                    {opp.data_finalizado && (
                      <p className="text-xs text-green-500">
                        Finalizado em {new Date(opp.data_finalizado).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                )}

                {/* Collapsible form */}
                <Collapsible open={formOpen} onOpenChange={setFormOpen}>
                  <div className="px-4 py-3 border-b shrink-0">
                    <CollapsibleTrigger asChild>
                      <button className="w-full text-sm font-semibold text-foreground flex items-center gap-2 hover:text-primary transition-colors">
                        <CalendarClock className="h-4 w-4" />
                        Atividades
                        {formOpen ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <AtividadeForm
                        oppId={opp.id}
                        leadId={opp.id_lead}
                        userId={opp.id_usuario}
                        onSubmit={ativCreate}
                        isCreating={ativIsCreating}
                      />
                    </CollapsibleContent>
                  </div>
                </Collapsible>
                {/* Timeline */}
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    <AtividadeTimeline
                      atividades={atividades}
                      onUpdate={ativUpdate}
                      onDelete={ativRemove}
                    />
                  </div>
                </ScrollArea>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* ─── Sidebar helper ─── */
const SidebarSection: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({
  title,
  children,
  action,
}) => (
  <div>
    <div className="flex items-center justify-between gap-2 mb-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </p>
      {action}
    </div>
    {children}
  </div>
);

export default OportunidadeDetailDialog;
