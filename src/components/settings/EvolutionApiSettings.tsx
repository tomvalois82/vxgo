
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function EvolutionApiSettings() {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    evo_instancia: profile?.evo_instancia || '',
    evo_key: profile?.evo_key || '',
    telefone: profile?.telefone || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('usuario')
        .update({
          evo_instancia: formData.evo_instancia,
          evo_key: formData.evo_key,
          telefone: formData.telefone,
        })
        .eq('uid', user.id);

      if (error) throw error;

      toast({
        title: 'Configurações salvas',
        description: 'Suas configurações foram atualizadas com sucesso.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar suas configurações.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!formData.evo_instancia || !formData.evo_key) {
      toast({
        variant: 'destructive',
        title: 'Dados incompletos',
        description: 'Por favor, preencha todos os campos antes de conectar.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://evolution-evolution.ppmwkh.easypanel.host/instance/connect/${formData.evo_instancia}`,
        {
          headers: {
            'apikey': formData.evo_key
          }
        }
      );

      if (!response.ok) throw new Error('Falha na conexão com Evolution API');

      toast({
        title: 'Conexão estabelecida',
        description: 'Conexão com WhatsApp realizada com sucesso.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro na conexão',
        description: 'Não foi possível conectar ao WhatsApp.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Evolution API</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="evo_instancia">Nome da Instância</Label>
          <Input
            id="evo_instancia"
            name="evo_instancia"
            value={formData.evo_instancia}
            onChange={handleInputChange}
            placeholder="Digite o nome da instância"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="evo_key">Token API</Label>
          <Input
            id="evo_key"
            name="evo_key"
            type="password"
            value={formData.evo_key}
            onChange={handleInputChange}
            placeholder="Digite o token da API"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="telefone">Número de Telefone</Label>
          <Input
            id="telefone"
            name="telefone"
            value={formData.telefone}
            onChange={handleInputChange}
            placeholder="Digite seu número de telefone"
          />
        </div>

        <div className="flex space-x-2 pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
          >
            Salvar
          </Button>
          <Button 
            onClick={handleConnect}
            disabled={isLoading || !formData.evo_instancia || !formData.evo_key}
            variant="secondary"
          >
            Conectar WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
