import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useLeadOportunidades } from '@/hooks/crm/useLeadOportunidades';
import { CORES_ORIGEM, getCorOrigem } from '@/lib/origem-utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { LeadListItem } from '@/hooks/crm/useLeadsList';

const ORIGENS = ['Whatsapp', 'Olx', 'Webmotors', 'Instagram', 'Facebook', 'Indicação', 'Carteira', 'Outros'];

interface LeadDetailDialogProps {
  lead: LeadListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewOportunidade: (id: number) => void;
}

const formatarMoeda = (valor: number | null) =>
  valor == null
    ? '-'
    : valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const LeadDetailDialog: React.FC<LeadDetailDialogProps> = ({
  lead,
  open,
  onOpenChange,
  onViewOportunidade,
}) => {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [origem, setOrigem] = useState('');
  const [interesse, setInteresse] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: oportunidades, isLoading } = useLeadOportunidades(open ? lead?.id ?? null : null);

  useEffect(() => {
    if (lead) {
      setNome(lead.nome ?? '');
      setTelefone(lead.telefone ?? '');
      setEmail(lead.email ?? '');
      setOrigem(
        ORIGENS.find((o) => o.toLowerCase() === (lead.Origem ?? '').trim().toLowerCase()) ?? '',
      );
      setInteresse(lead.interesse ?? '');
    }
  }, [lead]);

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('lead')
        .update({
          nome: nome.trim() || null,
          telefone: telefone.trim() || null,
          email: email.trim() || null,
          Origem: origem || null,
          interesse: interesse.trim() || null,
        })
        .eq('id', lead.id);
      if (error) throw error;
      toast({ title: 'Lead atualizado com sucesso' });
      queryClient.invalidateQueries({ queryKey: ['leads-list'] });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Erro ao atualizar lead',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do lead</DialogTitle>
        </DialogHeader>

        {lead && (
          <>
            <p className="text-xs italic text-muted-foreground">
              Criado em {new Date(lead.created_at).toLocaleString('pt-BR')}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="detalhe-nome">Nome</Label>
                <Input id="detalhe-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="detalhe-telefone">Telefone</Label>
                <Input id="detalhe-telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="detalhe-email">Email</Label>
                <Input id="detalhe-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Origem</Label>
                <Select value={origem} onValueChange={setOrigem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORIGENS.map((o) => (
                      <SelectItem key={o} value={o}>
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: CORES_ORIGEM[o.toLowerCase()] }}
                          />
                          {o}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="detalhe-interesse">Interesse</Label>
                <Input id="detalhe-interesse" value={interesse} onChange={(e) => setInteresse(e.target.value)} />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="mb-3 text-sm font-semibold">
                Oportunidades do lead {oportunidades ? `(${oportunidades.length})` : ''}
              </h3>

              {isLoading && <Skeleton className="h-16 w-full" />}

              {!isLoading && (oportunidades?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma oportunidade para este lead.</p>
              )}

              <div className="space-y-2">
                {oportunidades?.map((opp) => (
                  <button
                    key={opp.id}
                    type="button"
                    onClick={() => onViewOportunidade(opp.id)}
                    className="w-full rounded-md border px-3 py-2 text-left transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {opp.titulo || `Oportunidade #${opp.id}`}
                      </span>
                      <span className="text-sm font-semibold">{formatarMoeda(opp.valor)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {opp.funil && <Badge variant="outline">{opp.funil}</Badge>}
                      {opp.etapa && <Badge variant="secondary">{opp.etapa}</Badge>}
                      {opp.status && <span className="capitalize">{opp.status}</span>}
                      <span>{new Date(opp.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailDialog;
