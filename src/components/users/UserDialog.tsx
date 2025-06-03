
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

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
}

interface UserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserDialog = ({ user, open, onOpenChange }: UserDialogProps) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    evo_instancia: '',
    evo_key: '',
    tbEstoque: '',
    tbHistorico: '',
    cargo: '',
    ativo: true,
    superadm: false,
    password: '',
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || '',
        email: user.email || '',
        telefone: user.telefone || '',
        evo_instancia: user.evo_instancia || '',
        evo_key: user.evo_key || '',
        tbEstoque: user.tbEstoque || '',
        tbHistorico: user.tbHistorico || '',
        cargo: user.cargo || '',
        ativo: user.ativo,
        superadm: user.superadm,
        password: '',
      });
    } else {
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        evo_instancia: '',
        evo_key: '',
        tbEstoque: '',
        tbHistorico: '',
        cargo: '',
        ativo: true,
        superadm: false,
        password: '',
      });
    }
  }, [user, open]);

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof formData) => {
      // Criar usuário no auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
      });

      if (authError) throw authError;

      // Criar registro na tabela usuario
      const { error: userError } = await supabase
        .from('usuario')
        .insert({
          uid: authUser.user.id,
          nome: userData.nome,
          email: userData.email,
          telefone: userData.telefone,
          evo_instancia: userData.evo_instancia,
          evo_key: userData.evo_key,
          tbEstoque: userData.tbEstoque,
          tbHistorico: userData.tbHistorico,
          cargo: userData.cargo as any,
          ativo: userData.ativo,
          superadm: userData.superadm,
        });

      if (userError) throw userError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error creating user:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar usuário.",
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const { data, error } = await supabase.functions.invoke('admin-update-user-password', {
        body: {
          userId,
          newPassword: password,
        },
      });

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      console.error('Error updating password:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar senha.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: typeof formData) => {
      if (!user) throw new Error('Usuário não encontrado');

      // Atualizar dados na tabela usuario (exceto senha)
      const { error: userError } = await supabase
        .from('usuario')
        .update({
          nome: userData.nome,
          telefone: userData.telefone,
          evo_instancia: userData.evo_instancia,
          evo_key: userData.evo_key,
          tbEstoque: userData.tbEstoque,
          tbHistorico: userData.tbHistorico,
          cargo: userData.cargo as any,
          ativo: userData.ativo,
          superadm: userData.superadm,
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // Se senha foi fornecida, atualizar via Edge Function
      if (userData.password && user.uid) {
        await updatePasswordMutation.mutateAsync({
          userId: user.uid,
          password: userData.password,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating user:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar usuário.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.email) {
      toast({
        title: "Erro",
        description: "Nome e email são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!user && !formData.password) {
      toast({
        title: "Erro",
        description: "Senha é obrigatória para novos usuários.",
        variant: "destructive",
      });
      return;
    }

    // Validação de força da senha (se fornecida)
    if (formData.password && formData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (user) {
      updateUserMutation.mutate(formData);
    } else {
      createUserMutation.mutate(formData);
    }
  };

  const isLoading = createUserMutation.isPending || updateUserMutation.isPending || updatePasswordMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {user ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={!!user} // Email não pode ser alterado após criação
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="cargo">Cargo</Label>
              <Select value={formData.cargo} onValueChange={(value) => setFormData({ ...formData, cargo: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gerente">Gerente</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                  <SelectItem value="Vendedor">Vendedor</SelectItem>
                  <SelectItem value="Avaliador">Avaliador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="evo_instancia">Instância Evolution</Label>
              <Input
                id="evo_instancia"
                value={formData.evo_instancia}
                onChange={(e) => setFormData({ ...formData, evo_instancia: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="evo_key">Chave Evolution</Label>
              <Input
                id="evo_key"
                value={formData.evo_key}
                onChange={(e) => setFormData({ ...formData, evo_key: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="tbEstoque">Tabela Estoque</Label>
              <Input
                id="tbEstoque"
                value={formData.tbEstoque}
                onChange={(e) => setFormData({ ...formData, tbEstoque: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="tbHistorico">Tabela Histórico</Label>
              <Input
                id="tbHistorico"
                value={formData.tbHistorico}
                onChange={(e) => setFormData({ ...formData, tbHistorico: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="password">
                {user ? 'Nova Senha (deixe em branco para não alterar - mínimo 6 caracteres)' : 'Senha * (mínimo 6 caracteres)'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!user}
                minLength={6}
              />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label htmlFor="ativo">Usuário Ativo</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="superadm"
                checked={formData.superadm}
                onCheckedChange={(checked) => setFormData({ ...formData, superadm: checked })}
              />
              <Label htmlFor="superadm">Super Administrador</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-carblue hover:bg-carblue-dark">
              {isLoading ? 'Salvando...' : (user ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserDialog;
