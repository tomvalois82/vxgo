import React from 'react';
import KanbanBoard from '@/components/crm/KanbanBoard';

const CRM: React.FC = () => {
  return (
    <div className="p-4 md:p-6 h-[calc(100vh-5rem)]">
      <KanbanBoard />
    </div>
  );
};

export default CRM;
