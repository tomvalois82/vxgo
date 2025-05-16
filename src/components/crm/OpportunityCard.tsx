
import React from 'react';
import { OpportunityData } from '@/lib/crmTypes';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react'; // For a drag handle icon

interface OpportunityCardProps {
  opportunity: OpportunityData;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `opportunity-${opportunity.id}`, // Unique ID for the draggable item
    data: { // Pass opportunity data for onDragEnd or other handlers
      opportunityId: opportunity.id,
      currentKanbanId: opportunity.id_kanban,
      type: 'opportunity'
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="mb-3 shadow-md hover:shadow-lg transition-shadow duration-200 bg-white cursor-grab">
        <CardHeader className="p-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base font-medium text-carblue">
              {opportunity.titulo || 'Sem Título'}
            </CardTitle>
            <div {...listeners} className="cursor-grab p-1 -mr-1 -mt-1 text-gray-400 hover:text-gray-600">
              <GripVertical size={18} />
            </div>
          </div>
          {opportunity.lead?.nome && (
            <CardDescription className="text-xs text-gray-500">
              Lead: {opportunity.lead.nome}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-3 text-sm">
          {opportunity.valor && (
            <p className="text-gray-700 font-semibold">
              Valor: R$ {opportunity.valor}
            </p>
          )}
          {opportunity.resumo && (
            <p className="text-gray-600 mt-1 truncate">
              {opportunity.resumo}
            </p>
          )}
        </CardContent>
        <CardFooter className="p-3 flex justify-between items-center text-xs text-gray-500">
          <span>ID: {opportunity.id}</span>
          {opportunity.status && <Badge variant="outline">{opportunity.status}</Badge>}
        </CardFooter>
      </Card>
    </div>
  );
};

export default OpportunityCard;
