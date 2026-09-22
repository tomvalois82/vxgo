import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, ChevronLeft, ChevronRight, Trash2, Upload } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeadsList, type LeadListItem } from '@/hooks/crm/useLeadsList';
import LeadDetailDialog from '@/components/crm/LeadDetailDialog';
import CreateLeadDialog from '@/components/crm/CreateLeadDialog';
import DeleteLeadDialog from '@/components/crm/DeleteLeadDialog';
import ImportLeadsDialog from '@/components/crm/ImportLeadsDialog';
import OportunidadeDetailDialog from '@/components/crm/OportunidadeDetailDialog';
import { getCorOrigem } from '@/lib/origem-utils';
import { useQueryClient } from '@tanstack/react-query';

const TAMANHOS_PAGINA = [50, 100, 200, 500];

/** Formata telefone brasileiro para exibição */
const formatarTelefone = (telefone: string | null): string => {
  if (!telefone) return '-';
  const digitos = telefone.replace(/\D/g, '').replace(/^55/, '');
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return telefone;
};

/** Formata data ISO para DD/MM/YYYY */
const formatarData = (data: string | null): string => {
  if (!data) return '-';
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR');
};

const Leads: React.FC = () => {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [leadSelecionado, setLeadSelecionado] = useState<LeadListItem | null>(null);
  const [detalheAberto, setDetalheAberto] = useState(false);
  const [criarAberto, setCriarAberto] = useState(false);
  const [importarAberto, setImportarAberto] = useState(false);
  const [oppId, setOppId] = useState<number | null>(null);
  const [oppAberto, setOppAberto] = useState(false);
  const [leadParaExcluir, setLeadParaExcluir] = useState<LeadListItem | null>(null);
  const [excluirAberto, setExcluirAberto] = useState(false);

  const { data, isLoading } = useLeadsList({ search: buscaAplicada, page, pageSize });

  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaAplicada(busca);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [busca]);

  const abrirLead = (lead: LeadListItem) => {
    setLeadSelecionado(lead);
    setDetalheAberto(true);
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">
            {total} lead{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportarAberto(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar leads
          </Button>
          <Button onClick={() => setCriarAberto(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo lead
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome ou telefone..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Interesse</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Oportunidades</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && (data?.leads.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  Nenhum lead encontrado.
                </TableCell>
              </TableRow>
            )}

            {data?.leads.map((lead) => (
              <TableRow
                key={lead.id}
                className="cursor-pointer"
                onClick={() => abrirLead(lead)}
              >
                <TableCell className="font-medium">{lead.nome || 'Sem nome'}</TableCell>
                <TableCell>{formatarTelefone(lead.telefone)}</TableCell>
                <TableCell>
                  {lead.Origem ? (
                    <span className="flex items-center gap-2 text-sm">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: getCorOrigem(lead.Origem) ?? 'hsl(var(--muted-foreground))' }}
                      />
                      {lead.Origem}
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="max-w-[240px] truncate">{lead.interesse || '-'}</TableCell>
                <TableCell>{formatarData(lead.created_at)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">{lead.totalOportunidades}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    aria-label="Deletar lead"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLeadParaExcluir(lead);
                      setExcluirAberto(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Registros por página</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAMANHOS_PAGINA.map((t) => (
                <SelectItem key={t} value={t.toString()}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPaginas}
            onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <LeadDetailDialog
        lead={leadSelecionado}
        open={detalheAberto}
        onOpenChange={setDetalheAberto}
        onViewOportunidade={(id) => {
          setOppId(id);
          setOppAberto(true);
        }}
      />

      <CreateLeadDialog
        open={criarAberto}
        onOpenChange={setCriarAberto}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ['leads-list'] })}
      />

      <ImportLeadsDialog
        open={importarAberto}
        onOpenChange={setImportarAberto}
        onImported={() => queryClient.invalidateQueries({ queryKey: ['leads-list'] })}
      />

      <OportunidadeDetailDialog oppId={oppId} open={oppAberto} onOpenChange={setOppAberto} />

      <DeleteLeadDialog
        lead={leadParaExcluir}
        open={excluirAberto}
        onOpenChange={setExcluirAberto}
        onDeleted={() => {
          setLeadParaExcluir(null);
          queryClient.invalidateQueries({ queryKey: ['leads-list'] });
        }}
      />
    </div>
  );
};

export default Leads;
