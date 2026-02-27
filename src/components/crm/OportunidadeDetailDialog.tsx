import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Pencil, User, Phone, Mail, Car, FileText, MessageSquare, CalendarClock } from 'lucide-react';
import { useOportunidadeDetail } from '@/hooks/crm/useOportunidadeDetail';
import { useUpdateOportunidade } from '@/hooks/crm/useUpdateOportunidade';
import { useKanbanColumns } from '@/hooks/crm/useKanban';
import { useUserStockVehicles, type Vehicle } from '@/hooks/crm/useUserStockVehicles';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

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

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    if (draft.trim() !== value) {
      onSave(draft.trim());
    }
  }, [draft, value, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      setDraft(value);
      setEditing(false);
    }
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
      className={`group inline-flex items-center gap-1.5 cursor-pointer ${className}`}
      onClick={() => setEditing(true)}
      title="Clique para editar"
    >
      <span className={value ? '' : 'text-muted-foreground italic'}>
        {value || placeholder}
      </span>
      <Pencil className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
    </span>
  );
};

/* ─── Main Dialog ─── */
const OportunidadeDetailDialog: React.FC<Props> = ({ oppId, open, onOpenChange }) => {
  const { data: opp, isLoading } = useOportunidadeDetail(oppId);
  const updateOpp = useUpdateOportunidade();
  const { data: columns = [] } = useKanbanColumns();
  const { data: vehicles = [] } = useUserStockVehicles();
  const queryClient = useQueryClient();

  const currentColumn = useMemo(
    () => columns.find((c) => c.id === opp?.id_kanban),
    [columns, opp?.id_kanban]
  );

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
            <div className="px-6 py-4 border-b shrink-0">
              <EditableField
                value={opp.titulo || ''}
                onSave={(v) => save('titulo', v)}
                placeholder="Título da oportunidade"
                className="text-xl font-bold text-foreground"
                inputClassName="text-xl font-bold"
              />
              {subtitleParts.length > 0 && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {subtitleParts.join(' — ')}
                </p>
              )}
            </div>

            {/* ─── Body ─── */}
            <div className="flex flex-1 min-h-0">
              {/* ─── Left sidebar ─── */}
              <ScrollArea className="w-full max-w-xs border-r shrink-0">
                <div className="p-4 space-y-5">
                  {/* Etapa */}
                  <SidebarSection title="Etapa">
                    <Badge
                      style={{
                        backgroundColor: currentColumn?.cor || undefined,
                        color: '#fff',
                      }}
                    >
                      {currentColumn?.descricao || 'Sem etapa'}
                    </Badge>
                  </SidebarSection>

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
                      <p className="text-sm text-muted-foreground italic">Nenhum lead vinculado</p>
                    )}
                  </SidebarSection>

                  <Separator />

                  {/* Responsável */}
                  <SidebarSection title="Responsável">
                    <p className="text-sm">
                      {opp.usuario?.nome || (
                        <span className="text-muted-foreground italic">Não definido</span>
                      )}
                    </p>
                  </SidebarSection>

                  {/* Veículo */}
                  <SidebarSection title="Veículo de Interesse">
                    {currentVehicle ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Car className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{vehicleLabel}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Nenhum veículo</p>
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
                </div>
              </ScrollArea>

              {/* ─── Central area: Atividades (placeholder) ─── */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="px-6 py-3 border-b shrink-0">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    Atividades
                  </h3>
                </div>
                <ScrollArea className="flex-1">
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center space-y-2">
                      <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        As atividades serão implementadas em breve.
                      </p>
                    </div>
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
const SidebarSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div>
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
      {title}
    </p>
    {children}
  </div>
);

export default OportunidadeDetailDialog;
