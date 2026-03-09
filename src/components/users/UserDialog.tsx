import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, User } from 'lucide-react';

interface UserType {
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

interface Config {
  id: number;
  empresa: string | null;
  evo_instancia: string | null;
  evo_key: string | null;
  telefone: string | null;
  receptor: string | null;
  apikeyvoice: string | null;
  codVoice: string | null;
  pausa: number | null;
  temporesposta: number | null;
  ativo: boolean;
  ativoolx: boolean;
  access_token_olx: string | null;
  webhook_olx: string | null;
}

interface UserDialogProps {
  user: UserType | null;
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

  const [configData, setConfigData] = useState({
    empresa: '',
    evo_instancia: '',
    evo_key: '',
    telefone: '',
    receptor: '',
    apikeyvoice: '',
    codVoice: '',
    pausa: 15,
    temporesposta: 15,
    ativo: true,
    ativoolx: true,
    access_token_olx: '',
    webhook_olx: '',
  });

  const [userEmail, setUserEmail] = useState('');
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  // Buscar email do usuário na auth.users
  const { data: authUserData } = useQuery({
    queryKey: ['auth-user', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      const { data, error } = await supabase.auth.admin.getUserById(user.uid);
      if (error) throw error;
      return data.user;
    },
    enabled: !!user?.uid,
  });

  // Buscar dados da config associada ao usuário
  const { data: config } = useQuery({
    queryKey: ['user-config', user?.config],
    queryFn: async () => {
      if (!user?.config) return null;
      const { data, error } = await supabase
        .from('config')
        .select('*')
        .eq('id', user.config)
        .single();
      
      if (error) throw error;
      return data as Config;
    },
    enabled: !!user?.config,
  });

  useEffect(() => {
    // Definir o email do usuário da auth.users
    if (authUserData?.email) {
      setUserEmail(authUserData.email);
    }
  }, [authUserData]);

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || '',
        email: userEmail || user.email || '',
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
      setFotoUrl(user.foto || null);
      setFotoPreview(null);
      setFotoFile(null);
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
      setFotoUrl(null);
      setFotoPreview(null);
      setFotoFile(null);
    }

    if (config) {
      setConfigData({
        empresa: config.empresa || '',
        evo_instancia: config.evo_instancia || '',
        evo_key: config.evo_key || '',
        telefone: config.telefone || '',
        receptor: config.receptor || '',
        apikeyvoice: config.apikeyvoice || '',
        codVoice: config.codVoice || '',
        pausa: config.pausa || 15,
        temporesposta: config.temporesposta || 15,
        ativo: config.ativo ?? true,
        ativoolx: config.ativoolx ?? true,
        access_token_olx: config.access_token_olx || '',
        webhook_olx: config.webhook_olx || '',
      });
    } else {
      setConfigData({
        empresa: '',
        evo_instancia: '',
        evo_key: '',
        telefone: '',
        receptor: '',
        apikeyvoice: '',
        codVoice: '',
        pausa: 15,
        temporesposta: 15,
        ativo: true,
        ativoolx: true,
        access_token_olx: '',
        webhook_olx: '',
      });
    }
  }, [user, config, open, userEmail]);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Erro', description: 'Selecione um arquivo de imagem.', variant: 'destructive' });
      return;
    }
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const uploadFoto = async (userId: number): Promise<string | null> => {
    if (!fotoFile) return fotoUrl;
    const ext = fotoFile.name.split('.').pop() || 'jpg';
    const filePath = `user-${userId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(filePath, fotoFile, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return urlData.publicUrl;
  };


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
      const { data: newUser, error: userError } = await supabase
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
        })
        .select()
        .single();

      if (userError) throw userError;

      // Upload foto se selecionada
      if (fotoFile) {
        const newFotoUrl = await uploadFoto(newUser.id);
        if (newFotoUrl) {
          await supabase.from('usuario').update({ foto: newFotoUrl }).eq('id', newUser.id);
        }
      }

      // Criar config associada ao usuário
      const { data: newConfig, error: configError } = await supabase
        .from('config')
        .insert({
          empresa: configData.empresa,
          evo_instancia: configData.evo_instancia,
          evo_key: configData.evo_key,
          telefone: configData.telefone,
          receptor: configData.receptor as any,
          apikeyvoice: configData.apikeyvoice,
          codVoice: configData.codVoice,
          pausa: configData.pausa,
          temporesposta: configData.temporesposta,
          ativo: configData.ativo,
          ativoolx: configData.ativoolx,
          access_token_olx: configData.access_token_olx,
          webhook_olx: configData.webhook_olx,
        })
        .select()
        .single();

      if (configError) throw configError;

      // Atualizar o usuário com o ID da config
      const { error: updateError } = await supabase
        .from('usuario')
        .update({ config: newConfig.id })
        .eq('id', newUser.id);

      if (updateError) throw updateError;
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

      // Upload foto se selecionada
      let finalFotoUrl = fotoUrl;
      if (fotoFile) {
        finalFotoUrl = await uploadFoto(user.id);
      }

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
          foto: finalFotoUrl,
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // Atualizar ou criar config
      if (user.config) {
        // Atualizar config existente
        const { error: configError } = await supabase
          .from('config')
          .update({
            empresa: configData.empresa,
            evo_instancia: configData.evo_instancia,
            evo_key: configData.evo_key,
            telefone: configData.telefone,
            receptor: configData.receptor as any,
            apikeyvoice: configData.apikeyvoice,
            codVoice: configData.codVoice,
            pausa: configData.pausa,
            temporesposta: configData.temporesposta,
            ativo: configData.ativo,
            ativoolx: configData.ativoolx,
            access_token_olx: configData.access_token_olx,
            webhook_olx: configData.webhook_olx,
          })
          .eq('id', user.config);

        if (configError) throw configError;
      } else {
        // Criar nova config
        const { data: newConfig, error: configError } = await supabase
          .from('config')
          .insert({
            empresa: configData.empresa,
            evo_instancia: configData.evo_instancia,
            evo_key: configData.evo_key,
            telefone: configData.telefone,
            receptor: configData.receptor as any,
            apikeyvoice: configData.apikeyvoice,
            codVoice: configData.codVoice,
            pausa: configData.pausa,
            temporesposta: configData.temporesposta,
            ativo: configData.ativo,
            ativoolx: configData.ativoolx,
            access_token_olx: configData.access_token_olx,
            webhook_olx: configData.webhook_olx,
          })
          .select()
          .single();

        if (configError) throw configError;

        // Atualizar o usuário com o ID da nova config
        const { error: updateError } = await supabase
          .from('usuario')
          .update({ config: newConfig.id })
          .eq('id', user.id);

        if (updateError) throw updateError;
      }

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

    // Validação do temporesposta
    if (configData.temporesposta < 0 || configData.temporesposta > 60) {
      toast({
        title: "Erro",
        description: "Tempo de resposta deve estar entre 0 e 60 segundos.",
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {user ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção de Dados do Usuário */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Dados do Usuário</h3>
            
            {/* Foto do perfil */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="relative cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <Avatar className="h-24 w-24 border-2 border-muted">
                  {(fotoPreview || fotoUrl) ? (
                    <AvatarImage src={fotoPreview || fotoUrl || ''} alt="Foto do usuário" className="object-cover" />
                  ) : (
                    <AvatarFallback className="bg-muted">
                      <User className="h-10 w-10 text-muted-foreground" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFotoChange}
              />
              <span className="text-xs text-muted-foreground">Clique para alterar a foto</span>
            </div>

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
          </div>

          {/* Seção da Empresa */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Empresa</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="config_empresa">Nome da Empresa</Label>
                <Input
                  id="config_empresa"
                  value={configData.empresa}
                  onChange={(e) => setConfigData({ ...configData, empresa: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="config_telefone">Telefone da Empresa</Label>
                <Input
                  id="config_telefone"
                  value={configData.telefone}
                  onChange={(e) => setConfigData({ ...configData, telefone: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="config_evo_instancia">Instância Evolution</Label>
                <Input
                  id="config_evo_instancia"
                  value={configData.evo_instancia}
                  onChange={(e) => setConfigData({ ...configData, evo_instancia: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="config_evo_key">Chave Evolution</Label>
                <Input
                  id="config_evo_key"
                  value={configData.evo_key}
                  onChange={(e) => setConfigData({ ...configData, evo_key: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="config_receptor">Receptor</Label>
                <Select value={configData.receptor} onValueChange={(value) => setConfigData({ ...configData, receptor: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o receptor" />
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
                <Label htmlFor="config_apikeyvoice">API Key ElevenLabs</Label>
                <Input
                  id="config_apikeyvoice"
                  value={configData.apikeyvoice}
                  onChange={(e) => setConfigData({ ...configData, apikeyvoice: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="config_codVoice">Código de Voz</Label>
                <Input
                  id="config_codVoice"
                  value={configData.codVoice}
                  onChange={(e) => setConfigData({ ...configData, codVoice: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="config_pausa">Pausa (minutos)</Label>
                <Input
                  id="config_pausa"
                  type="number"
                  min="0"
                  value={configData.pausa}
                  onChange={(e) => setConfigData({ ...configData, pausa: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="config_temporesposta">Tempo de Resposta (0-60 segundos)</Label>
                <Input
                  id="config_temporesposta"
                  type="number"
                  min="0"
                  max="60"
                  value={configData.temporesposta}
                  onChange={(e) => setConfigData({ ...configData, temporesposta: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="config_access_token_olx">Access Token OLX</Label>
                <Input
                  id="config_access_token_olx"
                  value={configData.access_token_olx}
                  onChange={(e) => setConfigData({ ...configData, access_token_olx: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="config_webhook_olx">Webhook OLX</Label>
                <Input
                  id="config_webhook_olx"
                  value={configData.webhook_olx}
                  onChange={(e) => setConfigData({ ...configData, webhook_olx: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="config_ativo"
                  checked={configData.ativo}
                  onCheckedChange={(checked) => setConfigData({ ...configData, ativo: checked })}
                />
                <Label htmlFor="config_ativo">Atendimento WhatsApp</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="config_ativoolx"
                  checked={configData.ativoolx}
                  onCheckedChange={(checked) => setConfigData({ ...configData, ativoolx: checked })}
                />
                <Label htmlFor="config_ativoolx">Atendimento OLX</Label>
              </div>
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
