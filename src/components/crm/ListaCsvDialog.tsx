import React, { useState } from 'react';
import { Download, Save, FileText } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from
'@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Oportunidade } from '@/hooks/crm/useKanban';

interface ListaCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnName: string;
  oportunidades: Oportunidade[];
}

/** Formata o telefone no padrão brasileiro: DDD + 9 + 8 dígitos (11 dígitos) */
const formatarTelefone = (telefone?: string | null): string => {
  if (!telefone) return '';
  let digitos = telefone.replace(/\D/g, '');
  // Remove código do país
  if (digitos.length > 11 && digitos.startsWith('55')) {
    digitos = digitos.slice(2);
  }
  if (digitos.length > 11) {
    digitos = digitos.slice(-11);
  }
  if (digitos.length === 10) {
    // Insere o nono dígito após o DDD
    return `${digitos.slice(0, 2)}9${digitos.slice(2)}`;
  }
  return digitos;
};

/** Escapa o valor entre aspas duplas (delimiter=quotes) */
const escaparCampo = (valor: string): string =>
`"${(valor || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;

const CABECALHO = ['areacodephone', 'Nome', 'Interesse', 'Resumo', 'identifier'];

const ListaCsvDialog: React.FC<ListaCsvDialogProps> = ({
  open,
  onOpenChange,
  columnName,
  oportunidades
}) => {
  const [csv, setCsv] = useState<string>('');
  const [csvOriginal, setCsvOriginal] = useState<string>('');
  const [gerando, setGerando] = useState(false);

  const handleClose = (aberto: boolean) => {
    if (!aberto) {
      setCsv('');
      setCsvOriginal('');
    }
    onOpenChange(aberto);
  };

  const gerarCsv = async () => {
    setGerando(true);
    try {
      // Busca os dados de estoque das oportunidades com veículo vinculado
      const idsEstoque = Array.from(
        new Set(oportunidades.map((o) => o.idEstoque).filter((id): id is number => !!id))
      );
      const mapaEstoque = new Map<number, { modelo: string | null;ano: string | null;cor: string | null; }>();
      if (idsEstoque.length > 0) {
        const { data, error } = await supabase.
        from('estoque').
        select('id, modelo, ano, cor').
        in('id', idsEstoque);
        if (error) throw error;
        (data || []).forEach((e: { id: number;modelo: string | null;ano: string | null;cor: string | null; }) => {
          mapaEstoque.set(e.id, { modelo: e.modelo, ano: e.ano, cor: e.cor });
        });
      }

      const linhas = oportunidades.map((opp) => {
        const veiculo = opp.idEstoque ? mapaEstoque.get(opp.idEstoque) : null;
        const interesse = veiculo ?
        `${veiculo.modelo || ''} ${veiculo.ano || ''} -${veiculo.cor || ''}`.trim() :
        (opp.outro_interesse || []).join(', ');
        return [
        formatarTelefone(opp.lead?.telefone),
        opp.lead?.nome || '',
        interesse,
        opp.resumo || '',
        String(opp.id)].
        map(escaparCampo).join(',');
      });

      const conteudo = [CABECALHO.map(escaparCampo).join(','), ...linhas].join('\n');
      setCsv(conteudo);
      setCsvOriginal(conteudo);
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro desconhecido';
      toast({ title: 'Erro ao gerar lista', description: mensagem, variant: 'destructive' });
    } finally {
      setGerando(false);
    }
  };

  const nomeArquivo = `lista-${columnName.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.csv`;

  const baixarCsv = () => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    link.click();
    URL.revokeObjectURL(url);
  };

  const salvarAlteracoes = () => {
    setCsvOriginal(csv);
    toast({ title: 'Alterações salvas' });
  };

  const foiAlterado = csv !== csvOriginal;
  const jaGerado = csvOriginal !== '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={18} />
            Gerar lista de leads
          </DialogTitle>
          <DialogDescription>
            Será gerada uma lista em .csv com as informações dos leads da coluna "{columnName}".
          </DialogDescription>
        </DialogHeader>

        {!jaGerado ?
        <div className="py-4 text-sm text-muted-foreground">
            {oportunidades.length} oportunidade(s) serão incluídas na lista.
          </div> :

        <div className="space-y-2 py-2">
            <p className="text-xs text-muted-foreground">
              Você pode revisar e editar o conteúdo abaixo antes de baixar.
            </p>
            <Textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            className="font-mono text-xs h-64 whitespace-pre-wrap" />

          </div>
        }

        <DialogFooter className="gap-2">
          {!jaGerado ?
          <Button onClick={gerarCsv} disabled={gerando || oportunidades.length === 0}>
              {gerando ? 'Gerando...' : 'Gerar'}
            </Button> :

          <>
              <Button variant="outline" onClick={salvarAlteracoes} disabled={!foiAlterado} className="gap-1.5">
                <Save size={16} />
                Salvar
              </Button>
              <Button onClick={baixarCsv} className="gap-1.5">
                <Download size={16} />
                Download
              </Button>
            </>
          }
        </DialogFooter>
      </DialogContent>
    </Dialog>);

};

export { ListaCsvDialog };
export default ListaCsvDialog;