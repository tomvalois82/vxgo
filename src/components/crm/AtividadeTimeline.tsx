import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, PhoneCall, MessageSquare, Bot, MapPin, CheckCircle2, Info, StickyNote, Trash2 } from 'lucide-react';
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

/* ─── Inline Edit Text ─── */
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
    const cls = `w-full bg-background border border-input rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring ${className}`;
    return multiline ? (
      <textarea ref={ref as React.RefObject<HTMLTextAreaElement>} className={`${cls} min-h-[40px] resize-y`} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={onKey} />
    ) : (
      <input ref={ref as React.RefObject<HTMLInputElement>} className={cls} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={onKey} />
    );
  }

  return (
    <span
      className={`group inline-flex items-start gap-1 cursor-pointer ${className}`}
      onClick={() => setEditing(true)}
      title="Clique para editar"
    >
      <span className={value ? 'whitespace-pre-wrap' : 'text-muted-foreground italic text-xs'}>
        {value || placeholder}
      </span>
      <Pencil className="h-2.5 w-2.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0 mt-0.5" />
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
        className="bg-background border border-input rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      />
    );
  }

  return (
    <span
      className="group inline-flex items-center gap-1 cursor-pointer text-xs text-muted-foreground"
      onClick={() => setEditing(true)}
      title="Clique para editar"
    >
      {formatted}
      <Pencil className="h-2.5 w-2.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
    </span>
  );
};

/* ─── Timeline ─── */
interface Props {
  atividades: Atividade[];
  onUpdate: (data: { id: number; [key: string]: any }) => void;
  onDelete?: (id: number) => void;
}

const AtividadeTimeline: React.FC<Props> = ({ atividades, onUpdate, onDelete }) => {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  if (atividades.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

      {atividades.map((a) => {
        const Icon = TIPO_ICONS[a.tipo || ''] || Info;
        const dotColor = TIPO_COLORS[a.tipo || ''] || 'bg-muted-foreground';

        return (
          <div key={a.id} className="relative pb-4 last:pb-0">
            {/* Dot */}
            <div
              className={`absolute -left-6 top-1 w-[22px] h-[22px] rounded-full flex items-center justify-center ${dotColor} shadow-sm`}
            >
              <Icon className="h-3 w-3 text-white" />
            </div>

            {/* Card */}
            <div className={`bg-card border border-border rounded-lg p-3 ml-2 transition-opacity ${a.concluida ? 'opacity-60' : ''}`}>
              {/* Header: type + checkbox */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <InlineEdit
                    value={a.descricao || ''}
                    onSave={(v) => onUpdate({ id: a.id, descricao: v })}
                    className="font-medium text-sm"
                    placeholder="Sem descrição"
                  />
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <Checkbox
                    checked={a.concluida === true}
                    onCheckedChange={(v) => onUpdate({ id: a.id, concluida: v === true })}
                  />
                  {onDelete && (
                    <button
                      onClick={() => setDeleteId(a.id)}
                      className="text-muted-foreground/30 hover:text-destructive transition-colors"
                      title="Excluir atividade"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Obs */}
{(a.obs || true) && (
  <InlineEdit
    value={a.obs || ''}
    onSave={(v) => onUpdate({ id: a.id, obs: v })}
    className="text-base text-black"
    multiline
    placeholder="Adicionar observação..."
  />
)}

              {/* Date */}
              <div className="mt-1.5">
                <InlineDateTimeEdit
                  value={a.data_hora}
                  onSave={(v) => onUpdate({ id: a.id, data_hora: v })}
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
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
                if (deleteId !== null && onDelete) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AtividadeTimeline;
