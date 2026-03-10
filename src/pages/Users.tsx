
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Search, Bot } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import UserDialog from '@/components/users/UserDialog';
import DeleteUserDialog from '@/components/users/DeleteUserDialog';

interface User {
  id: number;
  uid: string | null;
  nome: string | null;
  telefone: string | null;
  email: string | null;
  evo_instancia: string | null;
  evo_key: string | null;
  tbEstoque: string | null;
  tbHistorico: string | null;
  ativo: boolean;
  superadm: boolean;
  cargo: string | null;
  config: number | null;
  foto: string | null;
}

const Users = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const queryClient = useQueryClient();

  // Verifica se o usuário é super admin
  if (!profile?.superadm) {
    return <Navigate to="/" replace />;
  }

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data as User[];
    },
  });

  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, ativo }: { userId: number; ativo: boolean }) => {
      const { error } = await supabase
        .from('usuario')
        .update({ ativo })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Sucesso",
        description: "Status do usuário atualizado com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Error updating user status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do usuário.",
        variant: "destructive",
      });
    },
  });

  // Filtrar apenas por nome
  const filteredUsers = users?.filter(user =>
    user.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsUserDialogOpen(true);
  };

  const handleNewUser = () => {
    setSelectedUser(null);
    setIsUserDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
  };

  const handleStatusChange = (userId: number, ativo: boolean) => {
    updateUserStatus.mutate({ userId, ativo });
  };

  const handleEditPrompt = (user: User) => {
    if (user.config) {
      navigate(`/dashboard/prompt-editor/${user.config}`);
    } else {
      toast({
        title: "Erro",
        description: "Este usuário não possui configuração associada.",
        variant: "destructive",
      });
    }
  };

  const handleEditPromptOlx = (user: User) => {
    if (user.config) {
      navigate(`/dashboard/prompt-editor-olx/${user.config}`);
    } else {
      toast({
        title: "Erro",
        description: "Este usuário não possui configuração associada.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando usuários...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">Gerenciamento de Usuários</CardTitle>
            <Button onClick={handleNewUser} className="bg-carblue hover:bg-carblue-dark">
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barra de pesquisa - busca apenas por nome */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabela de usuários */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Nome</TableHead>
                  <TableHead>Instância</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Histórico</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead>Super Admin</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow 
                      key={user.id}
                      className={!user.ativo ? 'opacity-60 bg-gray-50' : ''}
                    >
                      <TableCell className="font-medium w-1/3 break-words">
                        {user.nome || '-'}
                      </TableCell>
                      <TableCell>{user.evo_instancia || '-'}</TableCell>
                      <TableCell>{user.tbEstoque || '-'}</TableCell>
                      <TableCell>{user.tbHistorico || '-'}</TableCell>
                      <TableCell>
                        <Switch
                          checked={user.ativo}
                          onCheckedChange={(checked) => handleStatusChange(user.id, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        {user.superadm ? (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            Super Admin
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            Usuário
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPrompt(user)}
                            title="Editar Prompt WhatsApp"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Bot className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPromptOlx(user)}
                            title="Editar Prompt da OLX"
                            className="text-purple-600 hover:text-purple-700"
                          >
                            <Bot className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogos */}
      <UserDialog
        user={selectedUser}
        open={isUserDialogOpen}
        onOpenChange={setIsUserDialogOpen}
      />

      <DeleteUserDialog
        user={userToDelete}
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      />
    </div>
  );
};

export default Users;
