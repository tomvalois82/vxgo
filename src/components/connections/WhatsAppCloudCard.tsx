import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Cloud, Loader2, Phone, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PhoneNumberInfo {
  verified_name: string;
  code_verification_status: string;
  display_phone_number: string;
  quality_rating: string;
  platform_type: string;
  throughput?: {
    level: string;
  };
  webhook_configuration?: {
    application: string;
  };
  id: string;
}

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
  const [executingWaba, setExecutingWaba] = useState(false);
  const [wabaError, setWabaError] = useState<string | null>(null);
  const [phoneInfo, setPhoneInfo] = useState<PhoneNumberInfo | null>(null);
  const [registeringPhone, setRegisteringPhone] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerPin, setRegisterPin] = useState('');

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
        .select('evo_key, versao_waba, waba_id, id_phone_wtz_api')
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
      if (data?.waba_id) {
        setWabaId(data.waba_id);
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

  const handleSalvarExecutar = async () => {
    if (!profile?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (!versaoApi) {
      toast.error('Versão da API é obrigatória');
      return;
    }

    if (!wabaId) {
      toast.error('WABA ID é obrigatório');
      return;
    }

    if (!tokenTemporario) {
      toast.error('Token Temporário é obrigatório');
      return;
    }

    setExecutingWaba(true);
    setWabaError(null);
    setPhoneInfo(null);

    try {
      const response = await supabase.functions.invoke('subscribe-waba', {
        body: {
          version: versaoApi,
          wabaId: wabaId,
          token: tokenTemporario,
        },
      });

      console.log('Subscribe WABA response:', response);

      const data = response.data;
      const error = response.error;

      // Handle the case where we have an error object from the invoke
      if (error) {
        console.log('Invoke error:', error);
        if (error.context?.body) {
          try {
            const errorBody = JSON.parse(error.context.body);
            if (errorBody?.error) {
              setWabaError(JSON.stringify(errorBody.error, null, 2));
              return;
            }
          } catch (e) {
            // If parsing fails, continue to show error message
          }
        }
        setWabaError(error.message || 'Erro na chamada da API');
        return;
      }

      // If there's data with Facebook error, display it
      if (data?.error) {
        setWabaError(JSON.stringify(data.error, null, 2));
        return;
      }

      // Check if response has success: true
      if (data?.success === true) {
        // Save waba_id to database
        const { error: updateError } = await supabase
          .from('config')
          .update({ waba_id: wabaId })
          .eq('idusuario', profile.id);

        if (updateError) throw updateError;

        // Check if we have phone numbers data
        if (data.phoneNumbers?.data && data.phoneNumbers.data.length > 0) {
          const firstPhone = data.phoneNumbers.data[0] as PhoneNumberInfo;
          
          // Save the phone ID to database
          const { error: phoneUpdateError } = await supabase
            .from('config')
            .update({ id_phone_wtz_api: firstPhone.id })
            .eq('idusuario', profile.id);

          if (phoneUpdateError) {
            console.error('Erro ao salvar ID do telefone:', phoneUpdateError);
          }

          setPhoneInfo(firstPhone);
          toast.success('Inscrição realizada com sucesso! Número encontrado.');
        } else {
          toast.success('Inscrição realizada com sucesso!');
        }
        
        setWabaError(null);
      } else {
        // Unknown response format
        setWabaError(JSON.stringify(data, null, 2));
      }
    } catch (error: any) {
      console.error('Erro ao executar inscrição WABA:', error);
      setWabaError(error?.message || 'Erro ao executar inscrição');
    } finally {
      setExecutingWaba(false);
    }
  };

  const handleRegistrarNumero = async () => {
    if (!profile?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (!versaoApi) {
      toast.error('Versão da API é obrigatória');
      return;
    }

    if (!phoneInfo?.id) {
      toast.error('ID do telefone não encontrado');
      return;
    }

    if (!tokenTemporario) {
      toast.error('Token Temporário é obrigatório');
      return;
    }

    if (!registerPin || registerPin.length !== 6) {
      toast.error('PIN de 6 dígitos é obrigatório');
      return;
    }

    setRegisteringPhone(true);
    setRegisterError(null);

    try {
      const response = await supabase.functions.invoke('register-phone-waba', {
        body: {
          version: versaoApi,
          phoneNumberId: phoneInfo.id,
          token: tokenTemporario,
          pin: registerPin,
        },
      });

      console.log('Register Phone response:', response);

      const data = response.data;
      const error = response.error;

      if (error) {
        console.log('Invoke error:', error);
        if (error.context?.body) {
          try {
            const errorBody = JSON.parse(error.context.body);
            if (errorBody?.error) {
              setRegisterError(JSON.stringify(errorBody.error, null, 2));
              return;
            }
          } catch (e) {
            // If parsing fails, continue to show error message
          }
        }
        setRegisterError(error.message || 'Erro na chamada da API');
        return;
      }

      if (data?.error) {
        setRegisterError(JSON.stringify(data.error, null, 2));
        return;
      }

      if (data?.success === true) {
        toast.success('Número registrado com sucesso!');
        setRegisterError(null);
        setRegisterPin('');
      } else {
        setRegisterError(JSON.stringify(data, null, 2));
      }
    } catch (error: any) {
      console.error('Erro ao registrar número:', error);
      setRegisterError(error?.message || 'Erro ao registrar número');
    } finally {
      setRegisteringPhone(false);
    }
  };

  const handleEnviarTeste = () => {
    // Funcionalidade será implementada posteriormente
  };

  const getQualityRatingColor = (rating: string) => {
    switch (rating?.toUpperCase()) {
      case 'GREEN':
        return 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30';
      case 'YELLOW':
        return 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30';
      case 'RED':
        return 'text-destructive bg-destructive/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
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
          <Button onClick={handleSalvarExecutar} disabled={executingWaba || loadingConfig}>
            {executingWaba && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar e Executar
          </Button>
          
          {wabaError && (
            <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm font-medium text-destructive mb-2">Erro na inscrição:</p>
              <pre className="text-xs text-destructive whitespace-pre-wrap font-mono overflow-auto max-h-40">
                {wabaError}
              </pre>
            </div>
          )}

          {/* Phone Info Success Box */}
          {phoneInfo && (
            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">Número Encontrado</h4>
              </div>
              
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{phoneInfo.display_phone_number}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>
                    <span className="text-xs">Nome Verificado:</span>
                    <p className="font-medium text-foreground">{phoneInfo.verified_name}</p>
                  </div>
                  <div>
                    <span className="text-xs">ID:</span>
                    <p className="font-mono text-foreground">{phoneInfo.id}</p>
                  </div>
                  <div>
                    <span className="text-xs">Status Verificação:</span>
                    <p className="font-medium text-foreground">{phoneInfo.code_verification_status}</p>
                  </div>
                  <div>
                    <span className="text-xs">Qualidade:</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getQualityRatingColor(phoneInfo.quality_rating)}`}>
                      {phoneInfo.quality_rating}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs">Plataforma:</span>
                    <p className="font-medium text-foreground">{phoneInfo.platform_type}</p>
                  </div>
                  {phoneInfo.throughput?.level && (
                    <div>
                      <span className="text-xs">Throughput:</span>
                      <p className="font-medium text-foreground">{phoneInfo.throughput.level}</p>
                    </div>
                  )}
                </div>

                {phoneInfo.webhook_configuration?.application && (
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground">Webhook:</span>
                    <p className="font-mono text-xs text-foreground break-all">{phoneInfo.webhook_configuration.application}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="register-pin">PIN de Registro (6 dígitos)</Label>
                  <Input
                    id="register-pin"
                    value={registerPin}
                    onChange={(e) => setRegisterPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Ex: 258456"
                    maxLength={6}
                    className="font-mono"
                  />
                </div>
                <Button 
                  onClick={handleRegistrarNumero} 
                  disabled={registeringPhone || registerPin.length !== 6}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white"
                >
                  {registeringPhone && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar Número
                </Button>
              </div>

              {registerError && (
                <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm font-medium text-destructive mb-2">Erro no registro:</p>
                  <pre className="text-xs text-destructive whitespace-pre-wrap font-mono overflow-auto max-h-40">
                    {registerError}
                  </pre>
                </div>
              )}
            </div>
          )}
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
