import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, GripVertical, Plus, Lock } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  KanbanColumn,
  useUpdateKanbanColumn,
  useCreateKanbanColumn,
  useDeleteKanbanColumn,
  useBulkUpdateKanbanPositions,
} from '@/hooks/crm/useKanban';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: KanbanColumn[];
}

interface EditableColumn extends KanbanColumn {
  isNew?: boolean;
}

const KanbanEditDialog: React.FC<Props> = ({ open, onOpenChange, columns }) => {
  const [items, setItems] = useState<EditableColumn[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<EditableColumn | null>(null);
  const [saving, setSaving] = useState(false);

  const updateColumn = useUpdateKanbanColumn();
  const createColumn = useCreateKanbanColumn();
  const deleteColumn = useDeleteKanbanColumn();
  const bulkUpdate = useBulkUpdateKanbanPositions();

  useEffect(() => {
    if (open) {
      const sorted = [...columns].sort((a, b) => (a.posicao ?? 999) - (b.posicao ?? 999));
      setItems(sorted);
    }
  }, [open, columns]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setItems(reordered);
  };

  const handleFieldChange = (index: number, field: keyof EditableColumn, value: any) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleAddColumn = () => {
    const maxPos = items.reduce((max, i) => Math.max(max, i.posicao ?? 0), 0);
    setItems(prev => [
      ...prev,
      {
        id: Date.now(),
        descricao: '',
        cor: '#3B82F6',
        posicao: maxPos + 1,
        padrao: false,
        visivel: true,
        created_at: new Date().toISOString(),
        isNew: true,
      },
    ]);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.isNew) {
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
    } else {
      await deleteColumn.mutateAsync(deleteTarget.id);
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Create new columns
      for (const item of items.filter(i => i.isNew)) {
        await createColumn.mutateAsync({
          descricao: item.descricao || 'Nova Coluna',
          cor: item.cor || '#3B82F6',
          posicao: items.indexOf(item) + 1,
          visivel: item.visivel ?? true,
        });
      }

      // 2. Update existing columns
      const existingItems = items.filter(i => !i.isNew);
      for (const item of existingItems) {
        const original = columns.find(c => c.id === item.id);
        if (!original) continue;

        const updates: Partial<KanbanColumn> & { id: number } = { id: item.id };
        let hasChanges = false;

        if (!original.padrao) {
          if (item.descricao !== original.descricao) { updates.descricao = item.descricao; hasChanges = true; }
          if (item.cor !== original.cor) { updates.cor = item.cor; hasChanges = true; }
        }
        if (item.visivel !== original.visivel) { updates.visivel = item.visivel; hasChanges = true; }

        if (hasChanges) {
          await updateColumn.mutateAsync(updates);
        }
      }

      // 3. Update positions
      const positionUpdates = items
        .filter(i => !i.isNew)
        .map((item, index) => ({ id: item.id, posicao: index + 1 }));
      if (positionUpdates.length > 0) {
        await bulkUpdate.mutateAsync(positionUpdates);
      }

      onOpenChange(false);
    } catch (e) {
      // errors are handled by mutation hooks
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Gerenciar Colunas do Kanban</DialogTitle>
            <DialogDescription>Arraste para reordenar, edite descrição, cor e visibilidade.</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh] pr-2">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="kanban-edit-list">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                    {items.map((item, index) => (
                      <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg bg-accent' : 'bg-card'
                            }`}
                          >
                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                              <GripVertical size={18} className="text-muted-foreground" />
                            </div>

                            <div
                              className="w-4 h-8 rounded flex-shrink-0"
                              style={{ backgroundColor: item.cor || '#ccc' }}
                            />

                            {item.padrao ? (
                              <div className="flex-1 flex items-center gap-2">
                                <span className="text-sm font-medium">{item.descricao}</span>
                                <Lock size={14} className="text-muted-foreground" />
                              </div>
                            ) : (
                              <>
                                <Input
                                  value={item.descricao || ''}
                                  onChange={(e) => handleFieldChange(index, 'descricao', e.target.value)}
                                  className="flex-1 h-8 text-sm"
                                  placeholder="Nome da coluna"
                                />
                                <Input
                                  type="color"
                                  value={item.cor || '#3B82F6'}
                                  onChange={(e) => handleFieldChange(index, 'cor', e.target.value)}
                                  className="w-10 h-8 p-0.5 cursor-pointer border-none"
                                />
                              </>
                            )}

                            <div className="flex items-center gap-1.5">
                              <Label htmlFor={`vis-${item.id}`} className="text-xs text-muted-foreground">
                                {item.visivel ? 'Visível' : 'Oculto'}
                              </Label>
                              <Switch
                                id={`vis-${item.id}`}
                                checked={item.visivel ?? true}
                                onCheckedChange={(val) => handleFieldChange(index, 'visivel', val)}
                              />
                            </div>

                            {!item.padrao && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget(item)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </ScrollArea>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={handleAddColumn} className="gap-1.5">
              <Plus size={16} /> Nova Coluna
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir coluna</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a coluna "{deleteTarget?.descricao}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default KanbanEditDialog;
