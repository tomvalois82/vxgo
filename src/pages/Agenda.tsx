import React, { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAgendaAtividades } from '@/hooks/crm/useAgendaAtividades';
import AtividadeDetailDialog from '@/components/crm/AtividadeDetailDialog';
import type { Atividade } from '@/hooks/crm/useAtividades';
import { PhoneCall, MessageSquare, MapPin, CheckCircle2, Info, StickyNote } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const TIPO_ICONS: Record<string, React.FC<{ className?: string }>> = {
  'Ligação': PhoneCall,
  'Mensagem': MessageSquare,
  'Visita': MapPin,
  'Confirmar': CheckCircle2,
  'Informação': Info,
  'Observação': StickyNote,
};

const TIPO_COLORS: Record<string, string> = {
  'Ligação': 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/30',
  'Mensagem': 'border-l-green-500 bg-green-50 dark:bg-green-950/30',
  'Visita': 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/30',
  'Confirmar': 'border-l-purple-500 bg-purple-50 dark:bg-purple-950/30',
  'Informação': 'border-l-cyan-500 bg-cyan-50 dark:bg-cyan-950/30',
  'Observação': 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/30',
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const Agenda: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAtividade, setSelectedAtividade] = useState<Atividade | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { atividades, isLoading, update, remove } = useAgendaAtividades(selectedDate);

  // Group activities by hour
  const atividadesByHour = useMemo(() => {
    const map: Record<number, Atividade[]> = {};
    atividades.forEach((a) => {
      if (a.data_hora) {
        const hour = new Date(a.data_hora).getHours();
        if (!map[hour]) map[hour] = [];
        map[hour].push(a);
      }
    });
    return map;
  }, [atividades]);

  const handleClickAtividade = (a: Atividade) => {
    setSelectedAtividade(a);
    setDialogOpen(true);
  };

  const handleUpdate = (data: { id: number; [key: string]: any }) => {
    update(data);
    // Update the local selected atividade for immediate feedback
    if (selectedAtividade && data.id === selectedAtividade.id) {
      setSelectedAtividade((prev) => prev ? { ...prev, ...data } : prev);
    }
  };

  const formattedDate = format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-5rem)] gap-0">
      {/* Left side - Calendar */}
      <div className="md:w-[300px] shrink-0 border-r border-border bg-card p-4 flex flex-col gap-4">
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
