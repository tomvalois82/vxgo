
import React, { useState, useMemo } from 'react';
import { DndContext, closestCenter, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors, Active } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import { useKanbanColumns, useOpportunities, useUpdateOpportunityKanban } from '@/hooks/useCrmData';
import { OpportunityDb, KanbanColumnDb } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

const KanbanBoard: React.FC = () => {
  const { data: columns, isLoading: isLoadingColumns, error: columnsError } = useKanbanColumns();
  const { data: opportunitiesData, isLoading: isLoadingOpportunities, error: opportunitiesError } = useOpportunities();
  const updateOpportunityMutation = useUpdateOpportunityKanban();

  const [activeOpportunity, setActiveOpportunity] = useState<OpportunityDb | null>(null);
  const [activeColumn, setActiveColumn] = useState<KanbanColumnDb | null>(null);

  const opportunities = useMemo(() => opportunitiesData || [], [opportunitiesData]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require pointer to move 8px before initiating drag
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeOp = opportunities.find(op => op.id.toString() === active.id);
    if (activeOp) {
      setActiveOpportunity(activeOp);
      const sourceCol = columns?.find(col => col.id === activeOp.id_kanban);
      if (sourceCol) setActiveColumn(sourceCol);
    }
  };
  
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !activeOpportunity) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    const isActiveAnOpportunity = opportunities.some(op => op.id.toString() === activeId);
    const isOverAColumn = columns?.some(col => col.id.toString() === overId);

    if (isActiveAnOpportunity && isOverAColumn) {
      const overColumnId = parseInt(overId, 10);
      if (activeOpportunity.id_kanban !== overColumnId) {
        // Optimistically update UI or wait for mutation
        // For now, we'll handle actual update in onDragEnd
        console.log(`Opportunity ${activeOpportunity.id} dragged over column ${overColumnId}`);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOpportunity(null);
    setActiveColumn(null);

    if (!over) return;

    const activeId = active.id.toString(); // Opportunity ID
    const overId = over.id.toString(); // Can be column ID or another opportunity ID if sorting within column

    const opportunity = opportunities.find(op => op.id.toString() === activeId);
    if (!opportunity) return;

    let newKanbanId = opportunity.id_kanban;

    // Check if 'over' is a column
    const overIsColumn = columns?.find(col => col.id.toString() === overId);
    if (overIsColumn) {
        newKanbanId = overIsColumn.id;
    } else {
        // If 'over' is another opportunity, find its column
        const overOpportunity = opportunities.find(op => op.id.toString() === overId);
        if (overOpportunity && overOpportunity.id_kanban) {
            newKanbanId = overOpportunity.id_kanban;
        }
    }
    
    if (newKanbanId !== null && opportunity.id_kanban !== newKanbanId) {
      console.log(`Moving opportunity ${opportunity.id} to column ${newKanbanId}`);
      updateOpportunityMutation.mutate({ opportunityId: opportunity.id, newKanbanId });
    } else if (active.id !== over.id && opportunity.id_kanban === newKanbanId) {
      // Handle reordering within the same column - not implemented in this pass
      // This would involve updating a 'position_in_column' field or similar
      console.log(`Reordering opportunity ${opportunity.id} within column ${newKanbanId}`);
    }
  };

  if (isLoadingColumns || isLoadingOpportunities) {
    return (
      <div className="flex space-x-4 p-4 h-full overflow-x-auto">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-100 p-4 rounded-lg shadow-md min-w-[300px]">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-24 w-full mb-2" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (columnsError || opportunitiesError) {
    return <div className="text-red-500 p-4">Error loading CRM data: {columnsError?.message || opportunitiesError?.message}</div>;
  }

  if (!columns || columns.length === 0) {
    return <div className="p-4">Nenhuma coluna Kanban configurada.</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex space-x-4 p-4 h-[calc(100vh-150px)] overflow-x-auto">
        {/* We are not sorting columns themselves for now, just opportunities within them */}
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            opportunities={opportunities.filter(op => op.id_kanban === column.id || (activeOpportunity?.id_kanban === column.id && activeOpportunity?.id_kanban !== null))}
          />
        ))}
      </div>
    </DndContext>
  );
};

export default KanbanBoard;
