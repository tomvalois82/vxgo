import React, { useMemo, useRef, useState } from 'react';
import { Upload, FileSpreadsheet, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

type CampoLeadSimples = Exclude<CampoLead, 'interesse'>;

interface MapeamentoCampos {
  nome: string;
  telefone: string;
  email: string;
  // Interesse aceita múltiplas colunas, concatenadas na ordem de seleção.
  interesse: string[];
}

/** Sugere automaticamente a coluna do arquivo para cada campo do lead */
const sugerirMapeamento = (cabecalho: string[]): MapeamentoCampos => {
  const mapa = { interesse: [] } as unknown as MapeamentoCampos;
  CAMPOS_LEAD.forEach(({ campo, palavrasChave }) => {
    const indice = cabecalho.findIndex((coluna) =>
      palavrasChave.some((palavra) => coluna.toLowerCase().includes(palavra)),
    );
    if (campo === 'interesse') {
      mapa.interesse = indice >= 0 ? [String(indice)] : [];
    } else {
      mapa[campo as CampoLeadSimples] = indice >= 0 ? String(indice) : SEM_MAPEAMENTO;
    }
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
  const [mapeamento, setMapeamento] = useState<MapeamentoCampos>({
    nome: SEM_MAPEAMENTO,
    telefone: SEM_MAPEAMENTO,
    email: SEM_MAPEAMENTO,
    interesse: [],
  });
  const [importando, setImportando] = useState(false);
  const [interesseAberto, setInteresseAberto] = useState(false);

  const resetar = () => {
    setNomeArquivo('');
    setCabecalho([]);
    setLinhas([]);
    setOrigem('');
    setMapeamento({
      nome: SEM_MAPEAMENTO,
      telefone: SEM_MAPEAMENTO,
      email: SEM_MAPEAMENTO,
      interesse: [],
    });
    setInteresseAberto(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  // Adiciona ou remove a coluna do interesse mantendo a ordem de seleção.
  const alternarColunaInteresse = (indice: string) => {
    setMapeamento((atual) => {
      const selecionadas = atual.interesse;
      const novas = selecionadas.includes(indice)
        ? selecionadas.filter((item) => item !== indice)
        : [...selecionadas, indice];
      return { ...atual, interesse: novas };
    });
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

    const configUsuario = profile?.config;
    if (!configUsuario) {
      toast({
        title: 'Configuração não encontrada',
        description: 'Não foi possível identificar a configuração do usuário logado.',
        variant: 'destructive',
      });
      return;
    }

    setImportando(true);
    try {
      const registrosBrutos = linhas
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
          // Concatena as colunas de interesse na ordem em que foram selecionadas.
          const interesse = mapeamento.interesse
            .map((indice) => valorDaColuna(linha, indice))
            .filter((valor): valor is string => !!valor)
            .join(', ') || null;
          return {
            nome: valorDaColuna(linha, mapeamento.nome),
            telefone,
            email: valorDaColuna(linha, mapeamento.email),
            interesse,
            Origem: origem,
            config: configUsuario,
          };
        })
        .filter((registro) => registro.nome || registro.telefone);

      if (registrosBrutos.length === 0) {
        toast({
          title: 'Nenhum lead válido',
          description: 'Os registros do arquivo estão sem nome e sem telefone.',
          variant: 'destructive',
        });
        return;
      }

      // Busca leads existentes do mesmo config para verificar duplicidade por telefone.
      const { data: existentes, error: erroConsulta } = await supabase
        .from('lead')
        .select('telefone')
        .eq('config', configUsuario)
        .not('telefone', 'is', null);

      if (erroConsulta) throw erroConsulta;

      const telefonesExistentes = new Set(
        (existentes ?? [])
          .map((item) => normalizarTelefoneParaComparacao(item.telefone))
          .filter((telefone): telefone is string => !!telefone)
      );

      const telefonesJaProcessados = new Set<string>();
      const registros = registrosBrutos.filter((registro) => {
        const telefoneNormalizado = normalizarTelefoneParaComparacao(registro.telefone);
        if (!telefoneNormalizado) return true;

        if (
          telefonesExistentes.has(telefoneNormalizado) ||
          telefonesJaProcessados.has(telefoneNormalizado)
        ) {
          return false;
        }
        telefonesJaProcessados.add(telefoneNormalizado);
        return true;
      });

      const ignorados = registrosBrutos.length - registros.length;

      if (registros.length === 0) {
        toast({
          title: 'Nenhum lead novo',
          description: 'Todos os registros do arquivo já existem na base de dados.',
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

      toast({
        title: `${inseridos} novos lead(s) importado(s)`,
        description: ignorados > 0 ? `${ignorados} registro(s) ignorado(s) por duplicidade.` : undefined,
      });
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
                  {campo === 'interesse' ? (
                    <div className="relative w-full">
                      <Button
                        variant="outline"
                        className="w-full justify-between font-normal"
                        type="button"
                        onClick={() => setInteresseAberto((aberto) => !aberto)}
                      >
                        <span className="truncate">
                          {mapeamento.interesse.length > 0
                            ? mapeamento.interesse
                                .map((indice) => cabecalho[Number(indice)] || `Coluna ${Number(indice) + 1}`)
                                .join(', ')
                            : 'Colunas do arquivo'}
                        </span>
                        {interesseAberto ? (
                          <ChevronUp className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        ) : (
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        )}
                      </Button>
                      {interesseAberto && (
                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-md">
                          <div className="max-h-56 space-y-1 overflow-y-auto">
                            {cabecalho.map((coluna, indice) => {
                              const chave = String(indice);
                              const ordem = mapeamento.interesse.indexOf(chave);
                              return (
                                <div
                                  key={`${coluna}-${indice}`}
                                  role="button"
                                  tabIndex={0}
                                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                                  onClick={() => alternarColunaInteresse(chave)}
                                  onKeyDown={(evento) => {
                                    if (evento.key === 'Enter' || evento.key === ' ') {
                                      evento.preventDefault();
                                      alternarColunaInteresse(chave);
                                    }
                                  }}
                                >
                                  <Checkbox
                                    checked={ordem >= 0}
                                    className="pointer-events-none"
                                    tabIndex={-1}
                                  />
                                  <span className="flex-1 truncate">
                                    {coluna || `Coluna ${indice + 1}`}
                                  </span>
                                  {ordem >= 0 && (
                                    <span className="text-xs text-muted-foreground">{ordem + 1}º</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {mapeamento.interesse.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              className="mt-1 w-full gap-1 text-xs"
                              onClick={() => setMapeamento((atual) => ({ ...atual, interesse: [] }))}
                            >
                              <X className="h-3 w-3" />
                              Limpar seleção
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
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
                  )}
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
