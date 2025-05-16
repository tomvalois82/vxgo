
import React from 'react';
import KanbanBoard from '@/components/crm/KanbanBoard';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { useCrm } from '@/hooks/useCrmData'; // We will create this hook

const CrmPage = () => {
  const { opportunities, updateOpportunityKanbanStatus, isLoading } = useCrm();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const opportunityId = Number(active.id);
      // The 'over.id' for a column could be something like `column-${kanbanColumn.id}`
      // Or, if dropping onto a sortable list within the column, it might be more complex.
      // For simplicity, let's assume over.id directly gives us the new column's ID or a parseable string.
      // This part needs careful implementation based on how SortableContext and droppable areas are set up.
      
      // For now, let's assume over.data.current?.columnId contains the target column id
      const newKanbanId = over.data.current?.columnId;

      if (newKanbanId !== undefined) {
        console.log(`Opportunity ${opportunityId} dragged to Kanban column ${newKanbanId}`);
        updateOpportunityKanbanStatus(opportunityId, Number(newKanbanId));
      } else {
        console.warn("Drag ended but could not determine target Kanban ID from over.id:", over);
      }
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><p>Loading CRM data...</p></div>;
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">CRM Kanban</h1>
        <KanbanBoard />
      </div>
    </DndContext>
  );
};

export default CrmPage;
