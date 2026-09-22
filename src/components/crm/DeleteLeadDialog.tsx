import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLeadOportunidades } from '@/hooks/crm/useLeadOportunidades';
import type { LeadListItem } from '@/hooks/crm/useLeadsList';

interface DeleteLeadDialogProps {
  lead: LeadListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

/** Confirmação de exclusão permanente do lead e das oportunidades vinculadas */
const DeleteLeadDialog: React.FC<DeleteLeadDialogProps> = ({ lead, open, onOpenChange, onDeleted }) => {
  const { toast } = useToast();
  const [excluindo, setExcluindo] = useState(false);
  const { data: oportunidades, isLoading } = useLeadOportunidades(open ? lead?.id ?? null : null);

  const excluir = async () => {
    if (!lead) return;
    setExcluindo(true);
    try {
      const oppIds = (oportunidades ?? []).map((o) => o.id);

      if (oppIds.length > 0) {
        // Remove dependências das oportunidades antes de excluí-las
        const { error: erroAnexos } = await supabase
          .from('oportunidade_anexo')
          .delete()
          .in('id_oportunidade', oppIds);
        if (erroAnexos) throw new Error(erroAnexos.message);

        const { error: erroAtvOpp } = await supabase
          .from('atividade')
          .delete()
          .in('id_oportunidade', oppIds);
        if (erroAtvOpp) throw new Error(erroAtvOpp.message);
      }

      // Atividades ligadas diretamente ao lead
      const { error: erroAtvLead } = await supabase.from('atividade').delete().eq('id_lead', lead.id);
      if (erroAtvLead) throw new Error(erroAtvLead.message);

      const { error: erroOpp } = await supabase.from('opotunidade').delete().eq('id_lead', lead.id);
      if (erroOpp) throw new Error(erroOpp.message);

      const { error: erroLead } = await supabase.from('lead').delete().eq('id', lead.id);
      if (erroLead) throw new Error(erroLead.message);

      toast({
        title: 'Lead excluído',
        description: `${lead.nome || 'Lead'} e ${oppIds.length} oportunidade(s) foram removidos.`,
      });
      onOpenChange(false);
      onDeleted?.();
    } catch (e) {
      toast({
        title: 'Erro ao excluir',
        description: e instanceof Error ? e.message : 'Não foi possível excluir o lead.',
        variant: 'destructive',
      });
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir lead</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Esse lead será deletado permanentemente e as oportunidades ligadas a ele.
                <br />
                <strong>Deseja realmente fazer isso?</strong>
              </p>

              <div className="rounded-md border bg-muted/40 p-3">
                <p className="mb-2 text-sm font-medium text-foreground">
                  Oportunidades vinculadas {oportunidades ? `(${oportunidades.length})` : ''}
                </p>
                {isLoading && <p className="text-sm">Carregando oportunidades...</p>}
                {!isLoading && (oportunidades?.length ?? 0) === 0 && (
                  <p className="text-sm">Nenhuma oportunidade vinculada.</p>
                )}
                <ul className="max-h-40 space-y-1 overflow-y-auto">
                  {oportunidades?.map((o) => (
                    <li key={o.id} className="text-sm">
                      • {o.titulo || `Oportunidade #${o.id}`}
                      {o.funil || o.etapa ? (
                        <span className="text-muted-foreground">
                          {' '}
                          — {[o.funil, o.etapa].filter(Boolean).join(' / ')}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void excluir();
            }}
            disabled={excluindo}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {excluindo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Deletar permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteLeadDialog;
