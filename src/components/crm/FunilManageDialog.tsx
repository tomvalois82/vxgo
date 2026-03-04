import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Pencil, Check, X, Plus } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFunis, useCreateFunil, useUpdateFunil, useDeleteFunil, CrmFunil } from '@/hooks/crm/useFunis';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FunilManageDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { data: funis = [], isLoading } = useFunis();
  const createFunil = useCreateFunil();
  const updateFunil = useUpdateFunil();
  const deleteFunil = useDeleteFunil();

  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CrmFunil | null>(null);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createFunil.mutateAsync(newTitle.trim());
    setNewTitle('');
  };

  const handleStartEdit = (funil: CrmFunil) => {
    setEditingId(funil.id);
    setEditingTitle(funil.titulo || '');
  };

  const handleSaveEdit = async () => {
    if (editingId === null || !editingTitle.trim()) return;
    await updateFunil.mutateAsync({ id: editingId, titulo: editingTitle.trim() });
    setEditingId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleToggleAtivo = async (funil: CrmFunil) => {
    await updateFunil.mutateAsync({ id: funil.id, ativo: !funil.ativo });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteFunil.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Gerenciar Funis</DialogTitle>
            <DialogDescription>Crie, edite e gerencie os funis do CRM.</DialogDescription>
          </DialogHeader>

          {/* Create form */}
          <div className="flex gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título do novo funil"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button
              onClick={handleCreate}
              disabled={createFunil.isPending || !newTitle.trim()}
              size="sm"
              className="gap-1.5"
            >
              <Plus size={16} />
              Criar
            </Button>
          </div>

          {/* List */}
          <ScrollArea className="max-h-[40vh] pr-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
            ) : funis.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum funil cadastrado.</p>
            ) : (
              <div className="space-y-2">
                {funis.map((funil) => (
                  <div
                    key={funil.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    {editingId === funil.id ? (
                      <>
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="flex-1 h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <Button variant="ghost" size="sm" className="p-1 h-8 w-8" onClick={handleSaveEdit}>
                          <Check size={16} className="text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-1 h-8 w-8" onClick={handleCancelEdit}>
                          <X size={16} className="text-muted-foreground" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium truncate">
                          {funil.titulo || 'Sem título'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-8 w-8"
                          onClick={() => handleStartEdit(funil)}
                        >
                          <Pencil size={14} className="text-muted-foreground" />
                        </Button>
                      </>
                    )}

                    <div className="flex items-center gap-1.5">
                      <Label htmlFor={`funil-ativo-${funil.id}`} className="text-xs text-muted-foreground">
                        {funil.ativo ? 'Ativo' : 'Inativo'}
                      </Label>
                      <Switch
                        id={`funil-ativo-${funil.id}`}
                        checked={funil.ativo ?? true}
                        onCheckedChange={() => handleToggleAtivo(funil)}
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(funil)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir funil</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o funil "{deleteTarget?.titulo}"?
              Esta ação excluirá também todas as etapas (colunas) do Kanban associadas.
              Só é possível excluir se não houver oportunidades vinculadas.
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

export default FunilManageDialog;
