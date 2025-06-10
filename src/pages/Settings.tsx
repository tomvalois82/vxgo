
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Upload, X, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { uploadCarImages } from '@/lib/uploadCarImages';

interface ConfigData {
  ativo: boolean;
  ativoolx: boolean;
  pausa: number; // em minutos
  temporesposta: number; // em segundos
  fotoloja?: string;
}

const Settings = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const { register, handleSubmit, setValue, watch, reset } = useForm<{
    ativo: boolean;
    ativoolx: boolean;
    pausaHours: string;
    pausaMinutes: string;
    temporesposta: string;
  }>();

  // Load user config
  useEffect(() => {
    if (profile?.id) {
      loadConfig();
    }
  }, [profile?.id]);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('config')
        .select('*')
        .eq('idusuario', profile?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig(data);
        const hours = Math.floor(data.pausa / 60);
        const minutes = data.pausa % 60;
        
        reset({
          ativo: data.ativo,
          ativoolx: data.ativoolx || false,
          pausaHours: hours.toString().padStart(2, '0'),
          pausaMinutes: minutes.toString().padStart(2, '0'),
          temporesposta: (data.temporesposta || 15).toString(),
        });
        
        if (data.fotoloja) {
          setImagePreview(data.fotoloja);
        }
      } else {
        // Create default config if doesn't exist
        const defaultConfig = {
          idusuario: profile?.id,
          ativo: true,
          ativoolx: false,
          pausa: 15,
          temporesposta: 15,
          alertaNovo: true
        };
        
        const { data: newConfig, error: createError } = await supabase
          .from('config')
          .insert(defaultConfig)
          .select()
          .single();

        if (createError) throw createError;
        
        setConfig(newConfig);
        reset({
          ativo: true,
          ativoolx: false,
          pausaHours: '00',
          pausaMinutes: '15',
          temporesposta: '15',
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar configurações",
      });
    }
  };

  const adjustTime = (field: 'hours' | 'minutes', direction: 'up' | 'down') => {
    const currentHours = parseInt(watch('pausaHours')) || 0;
    const currentMinutes = parseInt(watch('pausaMinutes')) || 0;
    
    if (field === 'hours') {
      const newValue = direction === 'up' ? Math.min(currentHours + 1, 99) : Math.max(currentHours - 1, 0);
      setValue('pausaHours', newValue.toString().padStart(2, '0'));
    } else {
      const newValue = direction === 'up' ? Math.min(currentMinutes + 1, 59) : Math.max(currentMinutes - 1, 0);
      setValue('pausaMinutes', newValue.toString().padStart(2, '0'));
    }
  };

  const formatTimeInput = (value: string, type: 'hours' | 'minutes') => {
    const numericValue = value.replace(/\D/g, '');
    const maxValue = type === 'hours' ? 99 : 59;
    const intValue = Math.min(parseInt(numericValue) || 0, maxValue);
    return intValue.toString().padStart(2, '0');
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Validate temporesposta
      const temporesposta = parseInt(data.temporesposta);
      if (temporesposta < 5 || temporesposta > 60) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Tempo de resposta deve estar entre 5 e 60 segundos",
        });
        setLoading(false);
        return;
      }

      let fotoloja = config?.fotoloja;

      // Upload new image if selected
      if (selectedImage) {
        const uploadedUrls = await uploadCarImages([selectedImage]);
        fotoloja = uploadedUrls[0];
      } else if (!imagePreview) {
        fotoloja = null;
      }

      const pausaInMinutes = (parseInt(data.pausaHours) * 60) + parseInt(data.pausaMinutes);

      const configData = {
        ativo: data.ativo,
        ativoolx: data.ativoolx,
        pausa: pausaInMinutes,
        temporesposta: temporesposta,
        fotoloja,
      };

      const { error } = await supabase
        .from('config')
        .update(configData)
        .eq('idusuario', profile?.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      });

      setSelectedImage(null);
      loadConfig(); // Reload to get updated data
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar configurações",
      });
    } finally {
      setLoading(false);
    }
  };

  const watchedAtivo = watch('ativo');
  const watchedAtivoOlx = watch('ativoolx');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-2">
          Configure os parâmetros que afetam o funcionamento da automação
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Atendimento IA (WhatsApp) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Atendimento IA (WhatsApp)
              <Tooltip>
                <TooltipTrigger>
                  <Info size={16} className="text-gray-500 hover:text-gray-700" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ao desativar a Inteligência Artificial, ela deixará de responder mensagens do WhatsApp.</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CardDescription>
              Controle se a IA deve responder às mensagens do WhatsApp automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                {...register('ativo')}
                checked={watchedAtivo}
                onCheckedChange={(checked) => setValue('ativo', checked)}
              />
              <Label htmlFor="ativo">
                {watchedAtivo ? 'Ativado' : 'Desativado'}
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Atendimento IA (OLX) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Atendimento IA (OLX)
              <Tooltip>
                <TooltipTrigger>
                  <Info size={16} className="text-gray-500 hover:text-gray-700" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ao desativar a Inteligência Artificial, ela deixará de responder mensagens da OLX.</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CardDescription>
              Controle se a IA deve responder às mensagens da OLX automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="ativoolx"
                {...register('ativoolx')}
                checked={watchedAtivoOlx}
                onCheckedChange={(checked) => setValue('ativoolx', checked)}
              />
              <Label htmlFor="ativoolx">
                {watchedAtivoOlx ? 'Ativado' : 'Desativado'}
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Pausa por Intervenção */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Pausa por Intervenção
              <Tooltip>
                <TooltipTrigger>
                  <Info size={16} className="text-gray-500 hover:text-gray-700" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Após alguma intervenção humana em uma conversa, quanto tempo a Inteligência Artificial deverá esperar para voltar a responder? Preencha com 00:00 se quiser que ela não pare de responder.</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CardDescription>
              Tempo de espera após intervenção humana (formato HH:MM)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="00"
                  maxLength={2}
                  className="w-16 text-center pr-8"
                  {...register('pausaHours')}
                  onChange={(e) => {
                    const formatted = formatTimeInput(e.target.value, 'hours');
                    setValue('pausaHours', formatted);
                  }}
                />
                <div className="absolute right-1 top-0 flex flex-col h-full">
                  <button
                    type="button"
                    className="flex-1 px-1 hover:bg-gray-100 rounded-t flex items-center justify-center"
                    onClick={() => adjustTime('hours', 'up')}
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    type="button"
                    className="flex-1 px-1 hover:bg-gray-100 rounded-b flex items-center justify-center"
                    onClick={() => adjustTime('hours', 'down')}
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
              </div>
              <span>:</span>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="00"
                  maxLength={2}
                  className="w-16 text-center pr-8"
                  {...register('pausaMinutes')}
                  onChange={(e) => {
                    const formatted = formatTimeInput(e.target.value, 'minutes');
                    setValue('pausaMinutes', formatted);
                  }}
                />
                <div className="absolute right-1 top-0 flex flex-col h-full">
                  <button
                    type="button"
                    className="flex-1 px-1 hover:bg-gray-100 rounded-t flex items-center justify-center"
                    onClick={() => adjustTime('minutes', 'up')}
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    type="button"
                    className="flex-1 px-1 hover:bg-gray-100 rounded-b flex items-center justify-center"
                    onClick={() => adjustTime('minutes', 'down')}
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
              </div>
              <span className="text-sm text-gray-500 ml-2">(horas:minutos)</span>
            </div>
          </CardContent>
        </Card>

        {/* Tempo de Resposta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Tempo de Resposta
              <Tooltip>
                <TooltipTrigger>
                  <Info size={16} className="text-gray-500 hover:text-gray-700" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Define o tempo que a IA aguarda antes de responder uma mensagem (entre 5 e 60 segundos).</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CardDescription>
              Tempo de espera antes da IA responder (5 a 60 segundos)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="5"
                max="60"
                className="w-20"
                {...register('temporesposta')}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 5 && value <= 60) {
                    setValue('temporesposta', e.target.value);
                  }
                }}
              />
              <span className="text-sm text-gray-500">segundos</span>
            </div>
          </CardContent>
        </Card>

        {/* Frente da Loja */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Frente da Loja
              <Tooltip>
                <TooltipTrigger>
                  <Info size={16} className="text-gray-500 hover:text-gray-700" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Envie a foto da fachada da sua loja. A IA poderá usar essa imagem para ajudar o lead a identificar melhor seu ponto físico.</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CardDescription>
              Foto da fachada da sua loja para auxiliar na identificação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Frente da loja"
                    className="w-48 h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                    onClick={removeImage}
                  >
                    <X size={12} />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Nenhuma imagem carregada
                  </p>
                </div>
              )}
              
              <div>
                <input
                  type="file"
                  id="fotoloja"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('fotoloja')?.click()}
                >
                  <Upload size={16} className="mr-2" />
                  {imagePreview ? 'Trocar Imagem' : 'Selecionar Imagem'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="bg-carblue hover:bg-carblue/90">
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
