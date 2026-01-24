import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Cloud } from 'lucide-react';

export function WhatsAppCloudCard() {
  const [versaoApi, setVersaoApi] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [telefone, setTelefone] = useState('');

  const handleSalvarVersao = () => {
    // Funcionalidade será implementada posteriormente
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
            />
          </div>
          <Button onClick={handleSalvarVersao}>
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
