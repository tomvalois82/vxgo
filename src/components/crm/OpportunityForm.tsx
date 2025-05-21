
import React, { useState } from 'react';
import { OpportunityData, LeadData } from '@/lib/crmTypes';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { LoaderCircle } from 'lucide-react';

interface OpportunityFormProps {
  opportunity: OpportunityData;
  isEditing: boolean;
  onCancel: () => void;
  onSubmit: (data: Partial<OpportunityData>) => Promise<void>;
}

const OpportunityForm = ({ opportunity, isEditing, onCancel, onSubmit }: OpportunityFormProps) => {
  const [formData, setFormData] = useState<Partial<OpportunityData>>({
    titulo: opportunity.titulo,
    valor: opportunity.valor,
    resumo: opportunity.resumo,
    obs: opportunity.obs,
    status: opportunity.status,
    lead: opportunity.lead ? {
      ...opportunity.lead,
    } : undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLeadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      lead: {
        ...(prev.lead || {}),
        [name]: value,
      } as LeadData,
    }));
  };

  const handleOpportunityChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return dateString;
    }
  };

  // View Mode - Display data
  if (!isEditing) {
    return (
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Dados do Lead</h3>
        <div className="grid gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Nome</p>
            <p className="font-medium">{opportunity.lead?.nome || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Telefone</p>
            <p className="font-medium">{opportunity.lead?.telefone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{opportunity.lead?.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Origem</p>
            <p className="font-medium">{opportunity.lead?.Origem || '-'}</p>
          </div>
        </div>

        <Separator className="my-4" />

        <h3 className="font-medium text-lg">Dados da Oportunidade</h3>
        <div className="grid gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Título</p>
            <p className="font-medium">{opportunity.titulo || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor</p>
            <p className="font-medium">{opportunity.valor || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium">{opportunity.status || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Resumo</p>
            <p className="font-medium">{opportunity.resumo || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Observações</p>
            <p className="font-medium">{opportunity.obs || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Data de Criação</p>
            <p className="font-medium">{formatDate(opportunity.data_criacao)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Última Interação</p>
            <p className="font-medium">{formatDate(opportunity.ultima_interacao)}</p>
          </div>
        </div>
      </div>
    );
  }

  // Edit Mode - Display form
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-medium text-lg">Dados do Lead</h3>
      <div className="grid gap-3">
        <div>
          <label htmlFor="lead.nome" className="text-sm font-medium">Nome</label>
          <Input
            id="lead.nome"
            name="nome"
            value={formData.lead?.nome || ''}
            onChange={handleLeadChange}
            placeholder="Nome do lead"
          />
        </div>
        <div>
          <label htmlFor="lead.telefone" className="text-sm font-medium">Telefone</label>
          <Input
            id="lead.telefone"
            name="telefone"
            value={formData.lead?.telefone || ''}
            onChange={handleLeadChange}
            placeholder="Telefone"
          />
        </div>
        <div>
          <label htmlFor="lead.email" className="text-sm font-medium">Email</label>
          <Input
            id="lead.email"
            name="email"
            type="email"
            value={formData.lead?.email || ''}
            onChange={handleLeadChange}
            placeholder="Email"
          />
        </div>
        <div>
          <label htmlFor="lead.Origem" className="text-sm font-medium">Origem</label>
          <Input
            id="lead.Origem"
            name="Origem"
            value={formData.lead?.Origem || ''}
            onChange={handleLeadChange}
            placeholder="Origem do lead"
          />
        </div>
      </div>

      <Separator className="my-4" />

      <h3 className="font-medium text-lg">Dados da Oportunidade</h3>
      <div className="grid gap-3">
        <div>
          <label htmlFor="titulo" className="text-sm font-medium">Título</label>
          <Input
            id="titulo"
            name="titulo"
            value={formData.titulo || ''}
            onChange={handleOpportunityChange}
            placeholder="Título da oportunidade"
          />
        </div>
        <div>
          <label htmlFor="valor" className="text-sm font-medium">Valor</label>
          <Input
            id="valor"
            name="valor"
            value={formData.valor || ''}
            onChange={handleOpportunityChange}
            placeholder="Valor"
          />
        </div>
        <div>
          <label htmlFor="status" className="text-sm font-medium">Status</label>
          <Input
            id="status"
            name="status"
            value={formData.status || ''}
            onChange={handleOpportunityChange}
            placeholder="Status"
          />
        </div>
        <div>
          <label htmlFor="resumo" className="text-sm font-medium">Resumo</label>
          <Textarea
            id="resumo"
            name="resumo"
            value={formData.resumo || ''}
            onChange={handleOpportunityChange}
            placeholder="Resumo"
            rows={3}
          />
        </div>
        <div>
          <label htmlFor="obs" className="text-sm font-medium">Observações</label>
          <Textarea
            id="obs"
            name="obs"
            value={formData.obs || ''}
            onChange={handleOpportunityChange}
            placeholder="Observações"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar'
          )}
        </Button>
      </div>
    </form>
  );
};

export default OpportunityForm;
