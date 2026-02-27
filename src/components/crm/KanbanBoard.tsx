import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  useKanbanColumns,
  useKanbanOportunidades,
  useMoveOportunidade,
  Oportunidade,
  KanbanColumn,
} from '@/hooks/crm/useKanban';
import KanbanEditDialog from './KanbanEditDialog';

const KanbanBoard: React.FC = () => {
  const { data: allColumns = [], isLoading: columnsLoading } = useKanbanColumns();
  const { data: oportunidades = [], isLoading: oppsLoading } = useKanbanOportunidades();
  const moveOpp = useMoveOportunidade();
  const [editOpen, setEditOpen] = useState(false);

  const visibleColumns = useMemo(() => {
    return allColumns
      .filter((c) => c.visivel !== false)
      .sort((a, b) => (a.posicao ?? 999) - (b.posicao ?? 999));
  }, [allColumns]);

  const oppsByColumn = useMemo(() => {
    const map: Record<number, Oportunidade[]> = {};
    visibleColumns.forEach((col) => {
      map[col.id] = [];
    });
    oportunidades.forEach((opp) => {
      if (opp.id_kanban && map[opp.id_kanban]) {
        map[opp.id_kanban].push(opp);
      }
    });
    return map;
  }, [visibleColumns, oportunidades]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const oppId = parseInt(result.draggableId.replace('opp-', ''), 10);
    const destColumnId = parseInt(result.destination.droppableId.replace('col-', ''), 10);
    
    // Only move if column changed
    const sourceColumnId = parseInt(result.source.droppableId.replace('col-', ''), 10);
    if (sourceColumnId === destColumnId) return;

    moveOpp.mutate({ id: oppId, id_kanban: destColumnId });
  };

  if (columnsLoading || oppsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando Kanban...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">CRM - Kanban</h1>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
          <Settings2 size={16} />
          Gerenciar Colunas
        </Button>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 h-full min-h-[60vh]">
            {visibleColumns.map((column) => (
              <KanbanColumnView
                key={column.id}
                column={column}
                oportunidades={oppsByColumn[column.id] || []}
              />
            ))}

            {visibleColumns.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p>Nenhuma coluna visível. Clique em "Gerenciar Colunas" para configurar.</p>
              </div>
            )}
          </div>
        </div>
      </DragDropContext>

      <KanbanEditDialog open={editOpen} onOpenChange={setEditOpen} columns={allColumns} />
    </div>
  );
};

interface ColumnProps {
  column: KanbanColumn;
  oportunidades: Oportunidade[];
}

const KanbanColumnView: React.FC<ColumnProps> = ({ column, oportunidades }) => {
  return (
    <div className="flex flex-col w-72 min-w-[18rem] flex-shrink-0 bg-muted/40 rounded-xl border">
      {/* Column header with color stripe */}
      <div
        className="h-1.5 rounded-t-xl"
        style={{ backgroundColor: column.cor || '#94a3b8' }}
      />
      <div className="px-3 py-2.5 flex items-center justify-between border-b">
        <h3 className="text-sm font-semibold text-foreground truncate">
          {column.descricao || 'Sem nome'}
        </h3>
        <Badge variant="secondary" className="text-xs ml-2 font-normal">
          {oportunidades.length}
        </Badge>
      </div>

      {/* Cards area */}
      <Droppable droppableId={`col-${column.id}`}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 space-y-2 transition-colors min-h-[120px] ${
              snapshot.isDraggingOver ? 'bg-accent/40' : ''
            }`}
          >
            {oportunidades.map((opp, index) => (
              <Draggable key={opp.id} draggableId={`opp-${opp.id}`} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`bg-card rounded-lg border p-3 cursor-grab active:cursor-grabbing transition-shadow ${
                      snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/20' : 'shadow-sm hover:shadow-md'
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {opp.titulo || `Oportunidade #${opp.id}`}
                    </p>
                    {opp.valor && (
                      <p className="text-xs text-muted-foreground mt-1">
                        R$ {opp.valor}
                      </p>
                    )}
                    {opp.resumo && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {opp.resumo}
                      </p>
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanBoard;
