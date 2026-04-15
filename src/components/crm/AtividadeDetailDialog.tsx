import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2, PhoneCall, MessageSquare, Bot, MapPin, CheckCircle2, Info, StickyNote, Pencil, ExternalLink } from 'lucide-react';
import type { Atividade } from '@/hooks/crm/useAtividades';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TIPO_ICONS: Record<string, React.FC<{ className?: string }>> = {
  'Ligação': PhoneCall,
  'Mensagem': MessageSquare,
  'Mensagem Automática': Bot,
  'Visita': MapPin,
  'Confirmar': CheckCircle2,
  'Informação': Info,
  'Observação': StickyNote,
};

const TIPO_COLORS: Record<string, string> = {
  'Ligação': 'bg-blue-500',
  'Mensagem': 'bg-green-500',
  'Mensagem Automática': 'bg-teal-500',
  'Visita': 'bg-orange-500',
  'Confirmar': 'bg-purple-500',
  'Informação': 'bg-cyan-500',
  'Observação': 'bg-yellow-500',
};

/* ─── Inline Edit ─── */
const InlineEdit: React.FC<{
  value: string;
  onSave: (val: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
}> = ({ value, onSave, className = '', multiline = false, placeholder = '' }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    if (editing && ref.current) { ref.current.focus(); ref.current.select(); }
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft.trim());
  }, [draft, value, onSave]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setDraft(value); setEditing(false); }
  };

  if (editing) {
    const cls = `w-full bg-background border border-input rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring ${className}`;
    return multiline ? (
      <textarea ref={ref as React.RefObject<HTMLTextAreaElement>} className={`${cls} min-h-[60px] resize-y`} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={onKey} />
    ) : (
      <input ref={ref as React.RefObject<HTMLInputElement>} className={cls} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={onKey} />
    );
  }

  return (
    <span className={`group inline-flex items-start gap-1 cursor-pointer ${className}`} onClick={() => setEditing(true)} title="Clique para editar">
      <span className={value ? 'whitespace-pre-wrap' : 'text-muted-foreground italic text-xs'}>{value || placeholder}</span>
      <Pencil className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0 mt-0.5" />
    </span>
  );
};

/* ─── Inline DateTime Edit ─── */
const InlineDateTimeEdit: React.FC<{
  value: string | null;
  onSave: (val: string) => void;
}> = ({ value, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - offset * 60000);
      setDraft(local.toISOString().slice(0, 16));
    }
  }, [value]);

  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft) onSave(draft);
  };

  const formatted = value
    ? format(new Date(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : 'Sem data';

  if (editing) {
    return (
      <input
        ref={ref}
        type="datetime-local"
        className="bg-background border border-input rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      />
    );
  }

  return (
    <span className="group inline-flex items-center gap-1 cursor-pointer text-sm text-muted-foreground" onClick={() => setEditing(true)} title="Clique para editar">
      {formatted}
      <Pencil className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
    </span>
  );
};

/* ─── Dialog ─── */
interface Props {
  atividade: Atividade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (data: { id: number; [key: string]: any }) => void;
  onDelete: (id: number) => void;
  onViewOportunidade?: (id: number) => void;
}

const AtividadeDetailDialog: React.FC<Props> = ({ atividade, open, onOpenChange, onUpdate, onDelete, onViewOportunidade }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!atividade) return null;

  const Icon = TIPO_ICONS[atividade.tipo || ''] || Info;
  const dotColor = TIPO_COLORS[atividade.tipo || ''] || 'bg-muted-foreground';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${dotColor}`}>
                <Icon className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm text-muted-foreground">{atividade.tipo || 'Atividade'}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Descrição */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Descrição</Label>
              <InlineEdit
                value={atividade.descricao || ''}
                onSave={(v) => onUpdate({ id: atividade.id, descricao: v })}
                className="font-medium text-base"
                placeholder="Sem descrição"
              />
            </div>

            {/* Observação */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Observação</Label>
              <InlineEdit
                value={atividade.obs || ''}
                onSave={(v) => onUpdate({ id: atividade.id, obs: v })}
                className="text-sm"
                multiline
                placeholder="Adicionar observação..."
              />
            </div>

            {/* Data e hora */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Data e hora</Label>
              <InlineDateTimeEdit
                value={atividade.data_hora}
                onSave={(v) => onUpdate({ id: atividade.id, data_hora: v })}
              />
            </div>

            {/* Concluída */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="detail-concluida"
                checked={atividade.concluida === true}
                onCheckedChange={(v) => onUpdate({ id: atividade.id, concluida: v === true })}
              />
              <Label htmlFor="detail-concluida" className="text-sm cursor-pointer">
                Concluída
              </Label>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2 border-t">
              {onViewOportunidade && atividade.id_oportunidade ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    onOpenChange(false);
                    onViewOportunidade(atividade.id_oportunidade!);
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Ver oportunidade
                </Button>
              ) : (
                <div />
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir atividade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete(atividade.id);
                setConfirmDelete(false);
                onOpenChange(false);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AtividadeDetailDialog;
