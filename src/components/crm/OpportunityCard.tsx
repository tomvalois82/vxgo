
import React from 'react';
import { OpportunityDb } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Draggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';


interface OpportunityCardProps {
  opportunity: OpportunityDb;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opportunity.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="p-4">
          <CardTitle className="text-md font-semibold">{opportunity.titulo || 'Sem Título'}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-gray-600">Valor: {opportunity.valor ? `R$ ${opportunity.valor}` : 'N/A'}</p>
          {/* Add more details as needed: Lead info, last interaction, etc. */}
        </CardContent>
      </Card>
    </div>
  );
};

export default OpportunityCard;
