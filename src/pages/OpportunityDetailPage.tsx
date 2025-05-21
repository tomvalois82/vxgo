
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCrm } from '@/hooks/useCrmData';
import { OpportunityData, LeadData, ActivityData } from '@/lib/crmTypes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import OpportunityForm from '@/components/crm/OpportunityForm';
import ActivityTimeline from '@/components/crm/ActivityTimeline';
import AddActivityModal from '@/components/crm/AddActivityModal';
import { LoaderCircle, Trash2 } from 'lucide-react';

const OpportunityDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { 
    getOpportunityById, 
    updateOpportunity, 
    deleteOpportunity,
    getActivitiesForOpportunity 
  } = useCrm();

  const [opportunity, setOpportunity] = useState<OpportunityData | null>(null);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch opportunity details and activities
  useEffect(() => {
    const opportunityId = Number(id);
    if (!isNaN(opportunityId)) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const opportunityData = await getOpportunityById(opportunityId);
          
          // Check if the opportunity belongs to the current user
          if (opportunityData && opportunityData.id_usuario === profile?.id) {
            setOpportunity(opportunityData);
            
            // Fetch activities for this opportunity
            const activitiesData = await getActivitiesForOpportunity(opportunityId);
            setActivities(activitiesData);
          } else {
            // Navigate away if unauthorized
            navigate('/crm');
          }
        } catch (error) {
          console.error("Error fetching opportunity data:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    } else {
      navigate('/crm');
    }
  }, [id, getOpportunityById, getActivitiesForOpportunity, profile, navigate]);

  // Handle opportunity update
  const handleUpdate = async (updatedData: Partial<OpportunityData>) => {
    if (opportunity) {
      const success = await updateOpportunity(opportunity.id, updatedData);
      if (success) {
        // Refresh opportunity data
        const refreshedData = await getOpportunityById(opportunity.id);
        if (refreshedData) {
          setOpportunity(refreshedData);
        }
        setIsEditing(false);
      }
    }
  };

  // Handle opportunity deletion
  const handleDelete = async () => {
    if (opportunity) {
      setIsDeleting(true);
      try {
        const success = await deleteOpportunity(opportunity.id);
        if (success) {
          // Navigate back to CRM page after successful deletion
          navigate('/crm');
        }
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Handle activity refresh
  const refreshActivities = async () => {
    if (opportunity) {
      const activitiesData = await getActivitiesForOpportunity(opportunity.id);
      setActivities(activitiesData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando oportunidade...</span>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-center">Oportunidade não encontrada</h1>
        <div className="mt-4 text-center">
          <Button onClick={() => navigate('/crm')}>Voltar para CRM</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Detalhes da Oportunidade</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/crm')}
          >
            Voltar
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente a oportunidade
                  e todos os dados associados a ela.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete} 
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    'Sim, excluir'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left column - Opportunity and Lead data */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Oportunidade e Lead</span>
                {!isEditing && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    Editar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OpportunityForm
                opportunity={opportunity}
                isEditing={isEditing}
                onCancel={() => setIsEditing(false)}
                onSubmit={handleUpdate}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right column - Activities */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Atividades</span>
                <Button 
                  size="sm"
                  onClick={() => setIsActivityModalOpen(true)}
                >
                  + Nova Atividade
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline 
                activities={activities}
                onActivitiesChange={refreshActivities}
                opportunityId={opportunity.id}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Modal */}
      <AddActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        opportunityId={opportunity.id}
        leadId={opportunity.id_lead || undefined}
        onActivityAdded={refreshActivities}
      />
    </div>
  );
};

export default OpportunityDetailPage;
