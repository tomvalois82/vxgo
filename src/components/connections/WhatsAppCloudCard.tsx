import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Cloud, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function WhatsAppCloudCard() {
  const { profile } = useAuth();
  const [tokenPermanente, setTokenPermanente] = useState('');
  const [tokenTemporario, setTokenTemporario] = useState('');
  const [versaoApi, setVersaoApi] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [savingVersao, setSavingVersao] = useState(false);

  // Carregar dados da config ao montar o componente
  useEffect(() => {
    if (profile?.id) {
      loadConfig();
    }
  }, [profile?.id]);

  const loadConfig = async () => {
    setLoadingConfig(true);
    try {
      const { data, error } = await supabase
        .from('config')
        .select('evo_key, versao_waba')
        .eq('idusuario', profile?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.evo_key) {
        setTokenPermanente(data.evo_key);
      }
      if (data?.versao_waba) {
        setVersaoApi(data.versao_waba);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSalvarToken = async () => {
    if (!profile?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setSavingToken(true);
    try {
      const { error } = await supabase
        .from('config')
        .update({ evo_key: tokenPermanente })
        .eq('idusuario', profile.id);

      if (error) throw error;

      toast.success('Token salvo com sucesso');
    } catch (error) {
      console.error('Erro ao salvar token:', error);
      toast.error('Erro ao salvar token');
    } finally {
      setSavingToken(false);
    }
  };

  const handleSalvarVersao = async () => {
    if (!profile?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setSavingVersao(true);
    try {
      const { error } = await supabase
        .from('config')
        .update({ versao_waba: versaoApi })
        .eq('idusuario', profile.id);

      if (error) throw error;

      toast.success('Versão da API salva com sucesso');
    } catch (error) {
      console.error('Erro ao salvar versão:', error);
      toast.error('Erro ao salvar versão da API');
    } finally {
      setSavingVersao(false);
    }
  };

  const handleSalvarExecutar = () => {
    // Funcionalidade será implementada posteriormente
  };

  const handleEnviarTeste = () => {
    // Funcionalidade será implementada posteriormente
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Cloud className="h-5 w-5 text-primary" />
        <CardTitle>WhatsApp Cloud (API Oficial)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Token Permanente */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Token Permanente</h3>
          <div className="space-y-2">
            <Label htmlFor="token-permanente">Token</Label>
            <Input
              id="token-permanente"
              value={tokenPermanente}
              onChange={(e) => setTokenPermanente(e.target.value)}
              placeholder="Cole aqui seu token permanente"
              disabled={loadingConfig}
              className="font-mono text-sm"
            />
          </div>
          <Button onClick={handleSalvarToken} disabled={savingToken || loadingConfig}>
            {savingToken && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>

        <Separator />

        {/* Etapa 1: Versão API */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">1. Versão API</h3>
          <div className="space-y-2">
            <Label htmlFor="versao-api">Versão</Label>
            <Input
              id="versao-api"
              value={versaoApi}
              onChange={(e) => setVersaoApi(e.target.value)}
              maxLength={10}
              placeholder="Ex: v18.0"
              disabled={loadingConfig}
            />
          </div>
          <Button onClick={handleSalvarVersao} disabled={savingVersao || loadingConfig}>
            {savingVersao && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>

        <Separator />

        {/* Etapa 2: Inscrever-se para WABA */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">2. Inscrever-se para WABA</h3>
          <div className="space-y-2">
            <Label htmlFor="token-temporario">Token Temporário</Label>
            <Input
              id="token-temporario"
              value={tokenTemporario}
              onChange={(e) => setTokenTemporario(e.target.value)}
              placeholder="Cole aqui seu token temporário"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="waba-id">WABA ID</Label>
            <Input
              id="waba-id"
              value={wabaId}
              onChange={(e) => setWabaId(e.target.value)}
              maxLength={100}
              placeholder="Digite o WABA ID"
            />
          </div>
          <Button onClick={handleSalvarExecutar}>
            Salvar e Executar
          </Button>
        </div>

        <Separator />

        {/* Etapa 3: Mensagem Teste */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">3. Mensagem Teste</h3>
          <div className="space-y-2">
            <Label htmlFor="telefone-teste">Telefone</Label>
            <Input
              id="telefone-teste"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="Ex: 5511999999999"
            />
          </div>
          <Button onClick={handleEnviarTeste}>
            Enviar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
