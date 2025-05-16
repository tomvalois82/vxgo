
import React from 'react';
import { KanbanColumnDb, OpportunityDb } from '@/lib/types';
import OpportunityCard from './OpportunityCard';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';

interface KanbanColumnProps {
  column: KanbanColumnDb;
  opportunities: OpportunityDb[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, opportunities }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id.toString(),
  });

  const columnOpportunities = opportunities.filter(op => op.id_kanban === column.id);

  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-100 p-4 rounded-lg shadow-md min-w-[300px] h-full flex flex-col ${isOver ? 'bg-gray-200 ring-2 ring-carblue' : ''}`}
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{column.descricao}</h3>
      <div className="flex-grow overflow-y-auto space-y-2 pr-1">
        <SortableContext items={columnOpportunities.map(op => op.id.toString())} strategy={verticalListSortingStrategy}>
          {columnOpportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
          {columnOpportunities.length === 0 && (
            <p className="text-sm text-gray-500">Nenhuma oportunidade nesta coluna.</p>
          )}
        </SortableContext>
      </div>
    </div>
  );
};

export default KanbanColumn;
