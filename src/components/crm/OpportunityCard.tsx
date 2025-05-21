
import React from 'react';
import { OpportunityData } from '@/lib/crmTypes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Update the OpportunityCard component to include a "View" button to navigate to details
const OpportunityCard = ({ opportunity }: { opportunity: OpportunityData }) => {
  const navigate = useNavigate();

  const leadName = opportunity.lead?.nome || 'Sem Lead';
  const title = opportunity.titulo || 'Sem título';
  const value = opportunity.valor || '-';
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return '';
    }
  };

  const handleViewDetails = () => {
    navigate(`/opportunity/${opportunity.id}`);
  };

  return (
    <Card className="mb-3 w-full">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="text-xs text-muted-foreground">Lead: {leadName}</p>
          </div>
          <div className="text-sm">
            <span className="font-semibold">
              {value}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-end mt-4">
          <div className="text-xs text-muted-foreground">
            {opportunity.data_criacao && formatDate(opportunity.data_criacao)}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleViewDetails}
          >
            Ver detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OpportunityCard;
