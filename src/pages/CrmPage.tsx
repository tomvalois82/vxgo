
import React from 'react';
import KanbanBoard from '@/components/crm/KanbanBoard';

const CrmPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-semibold">CRM - Kanban</h1>
      </header>
      <div className="flex-grow">
        <KanbanBoard />
      </div>
    </div>
  );
};

export default CrmPage;
