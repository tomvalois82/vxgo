
import React from 'react';
import KanbanColumn from './KanbanColumn';
import { useCrm } from '@/hooks/useCrmData';
import { OpportunityData } from '@/lib/crmTypes';

const KanbanBoard = () => {
  const { kanbanColumns, opportunities, isLoading } = useCrm();

  if (isLoading && !kanbanColumns.length && !opportunities.length) {
    // Show a more prominent loading state if it's the initial load for the board
    return <div className="text-center p-10">Carregando quadro Kanban...</div>;
  }
  
  if (!kanbanColumns.length) {
    return <div className="text-center p-10">Nenhuma coluna Kanban configurada.</div>;
  }

  return (
    <div className="flex space-x-4 overflow-x-auto p-2 bg-gray-100 rounded-lg min-h-[calc(100vh-200px)]">
      {kanbanColumns
        .sort((a, b) => (a.posicao || 0) - (b.posicao || 0)) // Ensure sorting by position
        .map((column) => {
          const columnOpportunities = opportunities.filter(
            (op) => op.id_kanban === column.id
          );
          return (
            <KanbanColumn
              key={column.id}
              column={column}
              opportunities={columnOpportunities}
            />
          );
        })}
    </div>
  );
};

export default KanbanBoard;
