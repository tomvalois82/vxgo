import React from 'react';
import KanbanColumn from './KanbanColumn';
import { useCrm } from '@/hooks/crm/useCrm';

const KanbanBoard = () => {
  const { kanbanColumns, opportunities, isLoading } = useCrm();

  if (isLoading && !kanbanColumns.length && !opportunities.length) {
    return <div className="text-center p-10">Carregando quadro Kanban...</div>;
  }
  
  if (!kanbanColumns.length) {
    return <div className="text-center p-10">Nenhuma coluna Kanban configurada.</div>;
  }

  return (
    <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 md:overflow-x-auto p-1 md:p-2 bg-gray-100 rounded-lg min-h-[calc(100vh-200px)]">
      {kanbanColumns
        .sort((a, b) => (a.posicao || 0) - (b.posicao || 0))
        .map((column) => {
          const columnOpportunities = opportunities.filter(
            (op) => op.id_kanban === column.id
          );
          return (
            <KanbanColumn
              key={`column-${column.id}`}
              column={column}
              opportunities={columnOpportunities}
            />
          );
        })}
    </div>
  );
};

export default KanbanBoard;
