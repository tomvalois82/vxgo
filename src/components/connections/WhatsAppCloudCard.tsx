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
  const [versaoApi, setVersaoApi] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loadingVersao, setLoadingVersao] = useState(false);
  const [savingVersao, setSavingVersao] = useState(false);

  // Carregar dados da config ao montar o componente
  useEffect(() => {
    if (profile?.id) {
      loadConfig();
    }
  }, [profile?.id]);

  const loadConfig = async () => {
    setLoadingVersao(true);
    try {
      const { data, error } = await supabase
        .from('config')
        .select('versao_waba')
        .eq('idusuario', profile?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.versao_waba) {
        setVersaoApi(data.versao_waba);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoadingVersao(false);
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
              disabled={loadingVersao}
            />
          </div>
          <Button onClick={handleSalvarVersao} disabled={savingVersao || loadingVersao}>
            {savingVersao && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>

        <Separator />

        {/* Etapa 2: Inscrever-se para WABA */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">2. Inscrever-se para WABA</h3>
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
