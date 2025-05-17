
import React, { useState, useCallback } from 'react';
import KanbanBoard from '@/components/crm/KanbanBoard';
import AddOpportunityForm from '@/components/crm/AddOpportunityForm';
import { DndContext, closestCenter, DragEndEvent, useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCrm } from '@/hooks/useCrmData';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

const CrmPage = () => {
  const { updateOpportunityKanbanStatus, isLoading } = useCrm();
  const [isAddOpportunityOpen, setIsAddOpportunityOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // active.id is like "opportunity-123"
    // over.id is like "column-1"
    const activeIdString = String(active.id);
    const opportunityId = Number(activeIdString.replace('opportunity-', ''));
    
    const overIdString = String(over.id);
    let newKanbanId: number | undefined;

    if (overIdString.startsWith('column-')) {
      newKanbanId = Number(overIdString.replace('column-', ''));
    } else if (over.data.current?.type === 'column') { // Dropped onto a column directly
      newKanbanId = over.data.current?.columnId;
    } else if (over.data.current?.type === 'opportunity' && over.data.current?.columnId) { // Dropped onto an opportunity within a column
      newKanbanId = over.data.current?.columnId;
    }

    if (newKanbanId !== undefined && !isNaN(opportunityId)) {
      console.log(`Opportunity ${opportunityId} dragged to Kanban column ${newKanbanId}`);
      updateOpportunityKanbanStatus(opportunityId, Number(newKanbanId));
    } else {
      console.warn("Drag ended but could not determine target Kanban ID or valid opportunity ID.", { active, over });
    }
  }, [updateOpportunityKanbanStatus]);
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><p>Loading CRM data...</p></div>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">CRM Kanban</h1>
          <Dialog open={isAddOpportunityOpen} onOpenChange={setIsAddOpportunityOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nova Oportunidade
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Adicionar Nova Oportunidade</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes abaixo para criar uma nova oportunidade.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 max-h-[70vh] overflow-y-auto pr-2">
                <AddOpportunityForm onFormSubmit={() => setIsAddOpportunityOpen(false)} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <KanbanBoard />
      </div>
    </DndContext>
  );
};

export default CrmPage;
