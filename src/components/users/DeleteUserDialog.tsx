import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';

interface User {
  id: number;
  uid: string | null;
  nome: string | null;
  email: string | null;
  evo_key: string | null;
  telefone: string | null;
  evo_instancia: string | null;
  tbEstoque: string | null;
  tbHistorico: string | null;
  ativo: boolean;
  superadm: boolean;
  cargo: string | null;
}

interface DeleteUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteUserDialog = ({ user, open, onOpenChange }: DeleteUserDialogProps) => {
  const queryClient = useQueryClient();

  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não encontrado');

      // Primeiro, remover da tabela usuario
      const { error: userError } = await supabase
        .from('usuario')
        .delete()
        .eq('id', user.id);

      if (userError) throw userError;

      // Depois, remover do auth.users se tiver uid
      if (user.uid) {
        const { error: authError } = await supabase.auth.admin.deleteUser(user.uid);
        
        if (authError) {
          console.error('Error deleting auth user:', authError);
          // Não vamos falhar toda a operação se não conseguir deletar do auth
          // pois o usuário já foi removido da tabela principal
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso!",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteUserMutation.mutate();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o usuário{' '}
            <strong>{user?.nome || user?.email}</strong> permanentemente?
            <br />
            <br />
            Esta ação não pode ser desfeita e todos os dados do usuário serão removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteUserMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteUserMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteUserMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteUserDialog;
