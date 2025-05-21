import React, { useState } from 'react';
import { ActivityData } from '@/lib/crmTypes';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  MessageSquare, 
  PhoneCall, 
  Calendar, 
  MapPin, 
  MoreHorizontal,
  Pencil,
  Trash2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCrm } from '@/hooks/crm/useCrm';
import { Separator } from '@/components/ui/separator';
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
import EditActivityModal from './EditActivityModal';

interface ActivityTimelineProps {
  activities: ActivityData[];
  opportunityId: number;
  onActivitiesChange: () => Promise<void>;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ 
  activities, 
  opportunityId,
  onActivitiesChange 
}) => {
  const { deleteActivity } = useCrm();
  const [editingActivity, setEditingActivity] = useState<ActivityData | null>(null);

  // Format date to display 
  const formatActivityDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      // Display relative time (e.g., "2 hours ago") if within 24 hours
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
      }
      
      // Otherwise display formatted date time
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Get icon based on activity type
  const getActivityIcon = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'ligação':
        return <PhoneCall className="h-5 w-5 text-blue-500" />;
      case 'mensagem':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'reunião':
        return <Calendar className="h-5 w-5 text-violet-500" />;
      case 'visita':
        return <MapPin className="h-5 w-5 text-orange-500" />;
      default:
        return <MoreHorizontal className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    const success = await deleteActivity(activityId);
    if (success) {
      await onActivitiesChange();
    }
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma atividade registrada para esta oportunidade.</p>
        <p className="text-sm mt-2">Clique em "+ Nova Atividade" para adicionar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex overflow-x-auto pb-4 space-x-4">
        {activities.map((activity) => (
          <Card 
            key={activity.id} 
            className="min-w-[250px] max-w-[350px] flex-shrink-0 transition-shadow hover:shadow-md"
          >
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="mr-2">
                    {getActivityIcon(activity.tipo)}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">{activity.tipo || 'Atividade'}</h4>
                    <p className="text-xs text-muted-foreground">
                      {formatActivityDate(activity.data_hora)}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setEditingActivity(activity)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Atividade</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteActivity(activity.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
                            
              <Separator className="my-2" />
              
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Descrição</p>
                  <p className="text-sm">{activity.descricao || '-'}</p>
                </div>
                
                {activity.obs && (
                  <div>
                    <p className="text-sm font-medium">Observações</p>
                    <p className="text-sm">{activity.obs}</p>
                  </div>
                )}
                
                <div className="flex items-center mt-2">
                  <p className="text-xs text-muted-foreground mr-2">Status:</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activity.concluida ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {activity.concluida ? 'Concluída' : 'Pendente'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Edit Activity Modal */}
      {editingActivity && (
        <EditActivityModal
          isOpen={!!editingActivity}
          onClose={() => setEditingActivity(null)}
          activity={editingActivity}
          onActivityUpdated={onActivitiesChange}
        />
      )}
    </div>
  );
};

export default ActivityTimeline;
