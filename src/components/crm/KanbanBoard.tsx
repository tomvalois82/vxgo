import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Settings2, Plus, GitBranch, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useKanbanColumns,
  useKanbanOportunidades,
  useMoveOportunidade,
  Oportunidade,
  KanbanColumn,
} from '@/hooks/crm/useKanban';
import { useActiveFunis } from '@/hooks/crm/useFunis';
import { useConfigUsers } from '@/hooks/crm/useConfigUsers';
import KanbanEditDialog from './KanbanEditDialog';
import OportunidadeDialog from './OportunidadeDialog';
import OportunidadeDetailDialog from './OportunidadeDetailDialog';
import FunilManageDialog from './FunilManageDialog';
import KanbanFilterBar from './KanbanFilterBar';

const KanbanBoard: React.FC = () => {
  const { data: activeFunis = [], isLoading: funisLoading } = useActiveFunis();
  const [selectedFunilId, setSelectedFunilId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [funilManageOpen, setFunilManageOpen] = useState(false);
  const [newOppColumn, setNewOppColumn] = useState<{ id: number; name: string } | null>(null);
  const [detailOppId, setDetailOppId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterColumnId, setFilterColumnId] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const { data: configUsers = [] } = useConfigUsers();
  // Auto-select first funnel when loaded
  const currentFunilId = useMemo(() => {
    if (selectedFunilId && activeFunis.some(f => f.id === selectedFunilId)) {
      return selectedFunilId;
    }
    return activeFunis.length > 0 ? activeFunis[0].id : null;
  }, [selectedFunilId, activeFunis]);

  const { data: allColumns = [], isLoading: columnsLoading } = useKanbanColumns(currentFunilId);
  const { data: oportunidades = [], isLoading: oppsLoading } = useKanbanOportunidades();
  const moveOpp = useMoveOportunidade();

  const visibleColumns = useMemo(() => {
    return allColumns
      .filter((c) => c.visivel !== false)
      .sort((a, b) => (a.posicao ?? 999) - (b.posicao ?? 999));
  }, [allColumns]);

  const searchLower = useMemo(() => filterSearch.toLowerCase().trim(), [filterSearch]);

  const oppsByColumn = useMemo(() => {
    const map: Record<number, Oportunidade[]> = {};
    visibleColumns.forEach((col) => {
      map[col.id] = [];
    });
    oportunidades.forEach((opp) => {
      if (opp.id_kanban && map[opp.id_kanban]) {
        // User filter
        if (selectedUserId === 'unassigned' && opp.id_usuario != null) return;
        if (selectedUserId !== 'all' && selectedUserId !== 'unassigned' && opp.id_usuario !== Number(selectedUserId)) return;
        // Column filter
        if (filterColumnId !== 'all' && opp.id_kanban !== Number(filterColumnId)) return;
        // Text search filter
        if (searchLower) {
          const leadNome = opp.lead?.nome?.toLowerCase() || '';
          const leadTel = opp.lead?.telefone?.toLowerCase() || '';
          const outroInteresse = (opp.outro_interesse || []).join(' ').toLowerCase();
          const titulo = (opp.titulo || '').toLowerCase();
          if (
            !leadNome.includes(searchLower) &&
            !leadTel.includes(searchLower) &&
            !outroInteresse.includes(searchLower) &&
            !titulo.includes(searchLower)
          ) return;
        }
        map[opp.id_kanban].push(opp);
      }
    });
    return map;
  }, [visibleColumns, oportunidades, selectedUserId, filterColumnId, searchLower]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const oppId = parseInt(result.draggableId.replace('opp-', ''), 10);
    const destColumnId = parseInt(result.destination.droppableId.replace('col-', ''), 10);
    const sourceColumnId = parseInt(result.source.droppableId.replace('col-', ''), 10);
    if (sourceColumnId === destColumnId) return;
    moveOpp.mutate({ id: oppId, id_kanban: destColumnId });
  };

  const isLoading = funisLoading || columnsLoading || oppsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando Kanban...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground">CRM - Kanban</h1>

          {activeFunis.length > 0 && (
            <Select
              value={currentFunilId ? String(currentFunilId) : undefined}
              onValueChange={(val) => setSelectedFunilId(Number(val))}
            >
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="Selecione o funil" />
              </SelectTrigger>
              <SelectContent>
                {activeFunis.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.titulo || `Funil #${f.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFunilManageOpen(true)}
            className="gap-1.5"
            title="Gerenciar Funis"
          >
            <GitBranch size={16} />
            <span className="hidden sm:inline">Funis</span>
          </Button>

          <Select
            value={selectedUserId}
            onValueChange={setSelectedUserId}
          >
            <SelectTrigger className="w-44 h-9">
              <div className="flex items-center gap-1.5">
                <Users size={14} className="flex-shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Responsável" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="unassigned">Sem responsável</SelectItem>
              {configUsers.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.nome || `Usuário #${u.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditOpen(true)}
          className="gap-1.5"
          disabled={!currentFunilId}
        >
          <Settings2 size={16} />
          Gerenciar Colunas
        </Button>
      </div>

      <KanbanFilterBar
        open={filterOpen}
        onToggle={() => setFilterOpen((v) => !v)}
        columns={visibleColumns}
        selectedColumnId={filterColumnId}
        onColumnChange={setFilterColumnId}
        searchText={filterSearch}
        onSearchChange={setFilterSearch}
      />

      {!currentFunilId ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p>Nenhum funil ativo. Clique em "Funis" para criar um.</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex-1 overflow-x-auto pb-4">
            <div className="flex gap-4 h-full min-h-[60vh]">
              {visibleColumns.map((column) => (
                <KanbanColumnView
                  key={column.id}
                  column={column}
                  oportunidades={oppsByColumn[column.id] || []}
                  onAddOpp={() =>
                    setNewOppColumn({ id: column.id, name: column.descricao || 'Sem nome' })
                  }
                  onClickOpp={(id) => setDetailOppId(id)}
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
      )}

      <KanbanEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        columns={allColumns}
        funilId={currentFunilId}
      />

      <FunilManageDialog
        open={funilManageOpen}
        onOpenChange={setFunilManageOpen}
      />

      <OportunidadeDialog
        open={!!newOppColumn}
        onOpenChange={(open) => {
          if (!open) setNewOppColumn(null);
        }}
        columnId={newOppColumn?.id ?? 0}
        columnName={newOppColumn?.name}
      />

      <OportunidadeDetailDialog
        oppId={detailOppId}
        open={!!detailOppId}
        onOpenChange={(open) => {
          if (!open) setDetailOppId(null);
        }}
      />
    </div>
  );
};

interface ColumnProps {
  column: KanbanColumn;
  oportunidades: Oportunidade[];
  onAddOpp: () => void;
  onClickOpp: (id: number) => void;
}

const KanbanColumnView: React.FC<ColumnProps> = ({ column, oportunidades, onAddOpp, onClickOpp }) => {
  return (
    <div className="flex flex-col w-72 min-w-[18rem] flex-shrink-0 bg-muted/40 rounded-xl border">
      <div
        className="h-1.5 rounded-t-xl"
        style={{ backgroundColor: column.cor || '#94a3b8' }}
      />
      <div className="px-3 py-2.5 flex items-center justify-between border-b">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {column.descricao || 'Sem nome'}
          </h3>
          <Badge variant="secondary" className="text-xs font-normal">
            {oportunidades.length}
          </Badge>
        </div>
        <button
          onClick={onAddOpp}
          className="flex-shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Nova oportunidade"
        >
          <Plus size={16} />
        </button>
      </div>

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
                    onClick={() => onClickOpp(opp.id)}
                    className={`bg-card rounded-lg border p-3 cursor-pointer transition-shadow ${
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
