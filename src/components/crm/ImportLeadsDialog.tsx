import React, { useMemo, useRef, useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { parseCsv } from '@/lib/csv-utils';
import { getCorOrigem } from '@/lib/origem-utils';
import { formatarTelefoneBR } from '@/lib/phoneUtils';

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

type CampoLead = 'nome' | 'telefone' | 'email' | 'interesse';

const CAMPOS_LEAD: { campo: CampoLead; label: string; palavrasChave: string[] }[] = [
  { campo: 'nome', label: 'Nome', palavrasChave: ['nome', 'name', 'cliente', 'lead'] },
  { campo: 'telefone', label: 'Telefone', palavrasChave: ['telefone', 'fone', 'celular', 'whatsapp', 'phone'] },
  { campo: 'email', label: 'E-mail', palavrasChave: ['email', 'e-mail', 'mail'] },
  { campo: 'interesse', label: 'Interesse', palavrasChave: ['interesse', 'veiculo', 'veículo', 'carro', 'modelo', 'produto'] },
];

const ORIGENS = ['Whatsapp', 'Olx', 'Webmotors', 'Instagram', 'Facebook', 'Indicação', 'Carteira', 'Outros'];

const SEM_MAPEAMENTO = '__nenhum__';

/** Sugere automaticamente a coluna do arquivo para cada campo do lead */
const sugerirMapeamento = (cabecalho: string[]): Record<CampoLead, string> => {
  const mapa = {} as Record<CampoLead, string>;
  CAMPOS_LEAD.forEach(({ campo, palavrasChave }) => {
    const indice = cabecalho.findIndex((coluna) =>
      palavrasChave.some((palavra) => coluna.toLowerCase().includes(palavra)),
    );
    mapa[campo] = indice >= 0 ? String(indice) : SEM_MAPEAMENTO;
  });
  return mapa;
};

const ImportLeadsDialog: React.FC<ImportLeadsDialogProps> = ({ open, onOpenChange, onImported }) => {
  const { profile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [cabecalho, setCabecalho] = useState<string[]>([]);
  const [linhas, setLinhas] = useState<string[][]>([]);
  const [origem, setOrigem] = useState('');
  const [mapeamento, setMapeamento] = useState<Record<CampoLead, string>>({
    nome: SEM_MAPEAMENTO,
    telefone: SEM_MAPEAMENTO,
    email: SEM_MAPEAMENTO,
    interesse: SEM_MAPEAMENTO,
  });
  const [importando, setImportando] = useState(false);

  const resetar = () => {
    setNomeArquivo('');
    setCabecalho([]);
    setLinhas([]);
    setOrigem('');
    setMapeamento({
      nome: SEM_MAPEAMENTO,
      telefone: SEM_MAPEAMENTO,
      email: SEM_MAPEAMENTO,
      interesse: SEM_MAPEAMENTO,
    });
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClose = (aberto: boolean) => {
    if (!aberto) resetar();
    onOpenChange(aberto);
  };

  const handleArquivo = async (evento: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    try {
      const conteudo = await arquivo.text();
      const { cabecalho: colunas, linhas: registros } = parseCsv(conteudo);
      if (colunas.length === 0 || registros.length === 0) {
        toast({
          title: 'Arquivo sem dados',
          description: 'Não encontramos registros para importar neste arquivo.',
          variant: 'destructive',
        });
        return;
      }
      setNomeArquivo(arquivo.name);
      setCabecalho(colunas);
      setLinhas(registros);
      setMapeamento(sugerirMapeamento(colunas));
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro desconhecido';
      toast({ title: 'Erro ao ler arquivo', description: mensagem, variant: 'destructive' });
    }
  };

  const podeImportar = useMemo(
    () =>
      cabecalho.length > 0 &&
      !!origem &&
      (mapeamento.nome !== SEM_MAPEAMENTO || mapeamento.telefone !== SEM_MAPEAMENTO),
    [cabecalho.length, origem, mapeamento],
  );

  const valorDaColuna = (linha: string[], chave: string): string | null => {
    if (chave === SEM_MAPEAMENTO) return null;
    const valor = linha[Number(chave)];
    return valor && valor.trim() !== '' ? valor.trim() : null;
  };

  /** Normaliza um telefone para comparação, lidando com 9º dígito e códigos de país. */
  const normalizarTelefoneParaComparacao = (telefone: string | null): string | null => {
    if (!telefone || telefone.trim() === '') return null;
    try {
      return formatarTelefoneBR(telefone);
    } catch {
      const digitos = telefone.replace(/\D/g, '');
      return digitos || null;
    }
  };

  const importar = async () => {
    if (!podeImportar) return;
    setImportando(true);
    try {
      const registros = linhas
        .map((linha) => {
          const telefoneBruto = valorDaColuna(linha, mapeamento.telefone);
          let telefone: string | null = telefoneBruto;
          if (telefoneBruto) {
            try {
              telefone = formatarTelefoneBR(telefoneBruto);
            } catch {
              // Mantém apenas os dígitos quando o número não atende ao padrão brasileiro.
              telefone = telefoneBruto.replace(/\D/g, '') || null;
            }
          }
          return {
            nome: valorDaColuna(linha, mapeamento.nome),
            telefone,
            email: valorDaColuna(linha, mapeamento.email),
            interesse: valorDaColuna(linha, mapeamento.interesse),
            Origem: origem,
            config: profile?.config ?? null,
          };
        })
        .filter((registro) => registro.nome || registro.telefone);

      if (registros.length === 0) {
        toast({
          title: 'Nenhum lead válido',
          description: 'Os registros do arquivo estão sem nome e sem telefone.',
          variant: 'destructive',
        });
        return;
      }

      // Insere em lotes para evitar requisições muito grandes.
      const TAMANHO_LOTE = 200;
      let inseridos = 0;
      for (let i = 0; i < registros.length; i += TAMANHO_LOTE) {
        const lote = registros.slice(i, i + TAMANHO_LOTE);
        const { error } = await supabase.from('lead').insert(lote);
        if (error) throw error;
        inseridos += lote.length;
      }

      toast({ title: `${inseridos} lead(s) importado(s) com sucesso` });
      onImported();
      resetar();
      onOpenChange(false);
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro desconhecido';
      toast({ title: 'Erro ao importar leads', description: mensagem, variant: 'destructive' });
    } finally {
      setImportando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet size={18} />
            Importar leads
          </DialogTitle>
          <DialogDescription>
            Envie um arquivo .csv exportado de outra plataforma e relacione as colunas aos campos do lead.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="arquivo-csv">Arquivo .csv</Label>
            <input
              ref={inputRef}
              id="arquivo-csv"
              type="file"
              accept=".csv,text/csv"
              onChange={handleArquivo}
              className="block w-full cursor-pointer rounded-md border border-input bg-background p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm"
            />
            {nomeArquivo && (
              <p className="text-xs text-muted-foreground">
                {nomeArquivo} — {linhas.length} registro(s), {cabecalho.length} coluna(s).
              </p>
            )}
          </div>

          {cabecalho.length > 0 && (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
              <div className="space-y-2">
                <Label>Origem dos leads importados</Label>
                <Select value={origem} onValueChange={setOrigem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORIGENS.map((item) => (
                      <SelectItem key={item} value={item}>
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: getCorOrigem(item) ?? 'hsl(var(--muted-foreground))' }}
                          />
                          {item}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {CAMPOS_LEAD.map(({ campo, label }) => (
                <div key={campo} className="grid grid-cols-[100px_1fr] items-center gap-3">
                  <Label className="text-sm">{label}</Label>
                  <Select
                    value={mapeamento[campo]}
                    onValueChange={(valor) => setMapeamento((atual) => ({ ...atual, [campo]: valor }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Coluna do arquivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SEM_MAPEAMENTO}>Não importar</SelectItem>
                      {cabecalho.map((coluna, indice) => (
                        <SelectItem key={`${coluna}-${indice}`} value={String(indice)}>
                          {coluna || `Coluna ${indice + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              <p className="text-xs text-muted-foreground">
                Informe ao menos o nome ou o telefone para concluir a importação.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button onClick={importar} disabled={!podeImportar || importando} className="gap-1.5">
            <Upload size={16} />
            {importando ? 'Importando...' : 'Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ImportLeadsDialog };
export default ImportLeadsDialog;
