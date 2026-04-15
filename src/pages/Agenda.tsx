import React, { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAgendaAtividades, type AgendaFilters, type AgendaAtividade } from '@/hooks/crm/useAgendaAtividades';
import { useConfigUsers } from '@/hooks/crm/useConfigUsers';
import { useAuth } from '@/contexts/AuthContext';
import AtividadeDetailDialog from '@/components/crm/AtividadeDetailDialog';
import OportunidadeDetailDialog from '@/components/crm/OportunidadeDetailDialog';
import { PhoneCall, MessageSquare, Bot, MapPin, CheckCircle2, Info, StickyNote } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  'Ligação': 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/30',
  'Mensagem': 'border-l-green-500 bg-green-50 dark:bg-green-950/30',
  'Mensagem Automática': 'border-l-teal-500 bg-teal-50 dark:bg-teal-950/30',
  'Visita': 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/30',
  'Confirmar': 'border-l-purple-500 bg-purple-50 dark:bg-purple-950/30',
  'Informação': 'border-l-cyan-500 bg-cyan-50 dark:bg-cyan-950/30',
  'Observação': 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/30',
};

const TIPOS = ['Ligação', 'Mensagem', 'Mensagem Automática', 'Visita', 'Confirmar', 'Informação', 'Observação'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatPhoneBR(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits[2]} ${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

const Agenda: React.FC = () => {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAtividade, setSelectedAtividade] = useState<AgendaAtividade | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filters
  const isManager = profile?.cargo === 'Gerente' || profile?.cargo === 'Supervisor';
  const [filterConcluida, setFilterConcluida] = useState<string>('nao'); // 'todos' | 'sim' | 'nao'
  const [filterTipo, setFilterTipo] = useState<string>('Ligação');
  const [filterUsuario, setFilterUsuario] = useState<string>(() => {
    return profile?.id?.toString() || 'me';
  });

  const { data: configUsers } = useConfigUsers();

  const filters: AgendaFilters = useMemo(() => {
    const f: AgendaFilters = {};
    if (filterConcluida === 'sim') f.concluida = true;
    else if (filterConcluida === 'nao') f.concluida = false;
    if (filterTipo && filterTipo !== 'todos') f.tipo = filterTipo;
    if (filterUsuario === 'todos') {
      f.id_usuario = null;
    } else if (filterUsuario && filterUsuario !== 'me') {
      f.id_usuario = parseInt(filterUsuario, 10);
    } else if (profile?.id) {
      f.id_usuario = profile.id;
    }
    return f;
  }, [filterConcluida, filterTipo, filterUsuario, profile?.id]);

  const { atividades, isLoading, update, remove } = useAgendaAtividades(selectedDate, filters);

  // Group activities by hour
  const atividadesByHour = useMemo(() => {
    const map: Record<number, AgendaAtividade[]> = {};
    atividades.forEach((a) => {
      if (a.data_hora) {
        const hour = new Date(a.data_hora).getHours();
        if (!map[hour]) map[hour] = [];
        map[hour].push(a);
      }
    });
    return map;
  }, [atividades]);

  const handleClickAtividade = (a: AgendaAtividade) => {
    setSelectedAtividade(a);
    setDialogOpen(true);
  };

  const handleUpdate = (data: { id: number; [key: string]: any }) => {
    update(data);
    if (selectedAtividade && data.id === selectedAtividade.id) {
      setSelectedAtividade((prev) => prev ? { ...prev, ...data } : prev);
    }
  };

  const formattedDate = format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  // Set filterUsuario to profile.id once loaded
  React.useEffect(() => {
    if (profile?.id && filterUsuario === 'me') {
      setFilterUsuario(profile.id.toString());
    }
  }, [profile?.id]);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-5rem)] gap-0">
      {/* Left side - Calendar + Filters */}
      <div className="md:w-[300px] shrink-0 border-r border-border bg-card p-4 flex flex-col gap-4 overflow-y-auto">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => d && setSelectedDate(d)}
          locale={ptBR}
          className="rounded-md"
        />
        <div className="text-sm text-muted-foreground text-center capitalize">
          {formattedDate}
        </div>
        <div className="text-xs text-muted-foreground text-center">
          {atividades.length} atividade{atividades.length !== 1 ? 's' : ''}
        </div>

        {/* Filters */}
        <div className="border-t border-border pt-3 space-y-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filtros</div>

          {/* Concluída */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Concluída</Label>
            <Select value={filterConcluida} onValueChange={setFilterConcluida}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {TIPOS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Responsável - only managers can change */}
          {isManager && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Responsável</Label>
              <Select value={filterUsuario} onValueChange={setFilterUsuario}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {configUsers?.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.nome || `Usuário #${u.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Hourly timeline */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Day header */}
        <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-3">
          <div className="text-center">
            <div className="text-xs text-muted-foreground uppercase">
              {format(selectedDate, 'EEE', { locale: ptBR })}.
            </div>
            <div className="text-2xl font-bold">
              {format(selectedDate, 'd')}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <ScrollArea className="flex-1">
          <div className="relative">
            {HOURS.map((hour) => {
              const hourAtividades = atividadesByHour[hour] || [];
              const timeStr = `${hour.toString().padStart(2, '0')}:00`;

              return (
                <div key={hour} className="flex border-b border-border/50 min-h-[60px]">
                  {/* Time label */}
                  <div className="w-16 shrink-0 text-xs text-muted-foreground text-right pr-3 pt-1">
                    {timeStr}
                  </div>

                  {/* Activities slot */}
                  <div className="flex-1 py-1 pr-4 space-y-1">
                    {isLoading && hour === 8 && (
                      <Skeleton className="h-10 w-full rounded" />
                    )}
                    {hourAtividades.map((a) => {
                      const Icon = TIPO_ICONS[a.tipo || ''] || Info;
                      const colorClass = TIPO_COLORS[a.tipo || ''] || 'border-l-muted-foreground bg-muted/30';
                      const startTime = a.data_hora
                        ? format(new Date(a.data_hora), 'HH:mm')
                        : '';

                      // Build description with lead info
                      const descParts: string[] = [];
                      if (a.descricao) descParts.push(a.descricao);
                      const leadInfo: string[] = [];
                      if (a.lead_nome) leadInfo.push(a.lead_nome);
                      if (a.lead_telefone) leadInfo.push(formatPhoneBR(a.lead_telefone));
                      const leadStr = leadInfo.join(' • ');

                      return (
                        <button
                          key={a.id}
                          onClick={() => handleClickAtividade(a)}
                          className={`w-full text-left border-l-4 rounded-r-md px-3 py-2 transition-all hover:shadow-md cursor-pointer ${colorClass} ${a.concluida ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className={`text-sm font-medium truncate ${a.concluida ? 'line-through' : ''}`}>
                              {a.descricao || 'Sem descrição'}
                              {leadStr && (
                                <span className="font-normal text-muted-foreground"> — {leadStr}</span>
                              )}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {startTime}
                            {a.obs && <span className="ml-2">— {a.obs}</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Detail dialog */}
      <AtividadeDetailDialog
        atividade={selectedAtividade}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={handleUpdate}
        onDelete={remove}
      />
    </div>
  );
};

export default Agenda;
