
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X } from 'lucide-react';
import type { EvolutionApiFormData } from '@/hooks/useEvolutionApi';

interface EvolutionApiFormProps {
  formData: EvolutionApiFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isConnected: boolean;
  isValidCredentials: boolean | null;
}

export function EvolutionApiForm({ 
  formData, 
  onInputChange, 
  isConnected,
  isValidCredentials
}: EvolutionApiFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="evo_instancia">Nome da Instância</Label>
        <Input
          id="evo_instancia"
          name="evo_instancia"
          value={formData.evo_instancia}
          onChange={onInputChange}
          placeholder="Digite o nome da instância"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="evo_key">Token API</Label>
        <div className="relative">
          <Input
            id="evo_key"
            name="evo_key"
            type="password"
            value={formData.evo_key}
            onChange={onInputChange}
            placeholder="Digite o token da API"
          />
          {isValidCredentials !== null && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isValidCredentials ? (
                <Check className="text-green-500 w-5 h-5" />
              ) : (
                <X className="text-red-500 w-5 h-5" />
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="telefone">Número de Telefone</Label>
        <Input
          id="telefone"
          name="telefone"
          value={formData.telefone}
          onChange={onInputChange}
          placeholder="Digite seu número de telefone"
          readOnly={isConnected}
        />
      </div>
    </div>
  );
}
