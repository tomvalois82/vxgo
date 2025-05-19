
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCrm } from '@/hooks/useCrmData';
import { OpportunityData } from '@/lib/crmTypes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';

const OpportunityDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { fetchOpportunityById, isOpportunityLoading } = useCrm();
  const [opportunity, setOpportunity] = useState<OpportunityData | null>(null);
  const [isEditing, setIsEditing] = useState(false); // For future edit functionality

  useEffect(() => {
    if (id) {
      const opportunityId = parseInt(id, 10);
      if (!isNaN(opportunityId)) {
        fetchOpportunityById(opportunityId).then(data => {
          setOpportunity(data);
        });
      } else {
        setOpportunity(null); // Invalid ID
      }
    }
  }, [id, fetchOpportunityById]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    // Later, this will involve form setup and resetting
  };

  if (isOpportunityLoading && !opportunity) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Carregando detalhes da oportunidade...</p>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="mb-4">Oportunidade não encontrada.</p>
        <Button asChild>
          <Link to="/crm">Voltar para o CRM</Link>
        </Button>
      </div>
    );
  }

  const lead = opportunity.lead;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" asChild>
          <Link to="/crm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Kanban
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-gray-800">
          Oportunidade: {opportunity.titulo || `ID ${opportunity.id}`}
        </h1>
      </div>

      {/* Using a simple grid for now, can be replaced with ResizablePanelGroup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel (Lead & Opportunity Details) */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Detalhes do Lead</CardTitle>
            </CardHeader>
            <CardContent>
              {lead ? (
                <div className="space-y-1 text-sm">
                  <p><strong>Nome:</strong> {lead.nome || 'N/A'}</p>
                  <p><strong>Telefone:</strong> {lead.telefone || 'N/A'}</p>
                  <p><strong>Email:</strong> {lead.email || 'N/A'}</p>
                  <p><strong>Origem:</strong> {lead.Origem || 'N/A'}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum lead associado.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Detalhes da Oportunidade</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleEditToggle} title="Editar Detalhes">
                <Edit className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p><strong>Título:</strong> {opportunity.titulo || 'N/A'}</p>
              <p><strong>Valor:</strong> {opportunity.valor ? `R$ ${opportunity.valor}` : 'N/A'}</p>
              <p><strong>Status:</strong> {opportunity.status || 'N/A'}</p>
              <p><strong>Data de Criação:</strong> {opportunity.data_criacao ? new Date(opportunity.data_criacao).toLocaleString() : 'N/A'}</p>
              <p><strong>Última Interação:</strong> {opportunity.ultima_interacao ? new Date(opportunity.ultima_interacao).toLocaleString() : 'N/A'}</p>
              <p><strong>Resumo:</strong> {opportunity.resumo || 'N/A'}</p>
              <p><strong>Observações:</strong> {opportunity.obs || 'N/A'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel (Activity Timeline) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Histórico de Atividades</CardTitle>
              <CardDescription>Novas atividades e o gerenciamento aparecerão aqui.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder for Activity Timeline and Add Activity Button */}
              <div className="min-h-[200px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md">
                <p className="text-muted-foreground">Gerenciamento de atividades em breve.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetailPage;
