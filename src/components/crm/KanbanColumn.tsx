
import React from 'react';
import OpportunityCard from './OpportunityCard';
import { KanbanColumnData, OpportunityData } from '@/lib/crmTypes';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface KanbanColumnProps {
  column: KanbanColumnData;
  opportunities: OpportunityData[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, opportunities }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: {
      columnId: column.id,
      type: 'column'
    }
  });

  const opportunityIds = opportunities.map(op => `opportunity-${op.id}`);

  return (
    <div
      ref={setNodeRef}
      className={`bg-neutral-100 p-3 rounded-md shadow-sm w-full md:w-80 flex-shrink-0 h-full flex flex-col ${isOver ? 'bg-neutral-200 ring-2 ring-carblue' : ''}`}
      style={{minHeight: '300px'}}
    >
      <h2 className="text-lg font-semibold text-gray-700 mb-3 px-1 border-b pb-2">
        {column.descricao} ({opportunities.length})
      </h2>
      <SortableContext items={opportunityIds} strategy={verticalListSortingStrategy}>
        <div className="flex-grow space-y-3 overflow-y-auto p-1 min-h-[200px]">
          {opportunities.length === 0 && !isOver && (
            <div className="text-center text-gray-500 py-4">
              Nenhuma oportunidade aqui.
            </div>
          )}
          {opportunities.length === 0 && isOver && (
             <div className="text-center text-gray-500 py-4 border-2 border-dashed border-gray-300 rounded-md">
              Solte aqui
            </div>
          )}
          {opportunities.map((op) => (
            <OpportunityCard key={op.id} opportunity={op} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default KanbanColumn;
