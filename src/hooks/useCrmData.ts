import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OpportunityData, KanbanColumnData, LeadData, StockVehicle, ActivityData } from '@/lib/crmTypes';
import { useToast } from '@/components/ui/use-toast';

export const useCrm = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<OpportunityData[]>([]);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumnData[]>([]);
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [userStockVehicles, setUserStockVehicles] = useState<StockVehicle[]>([]);
  const [isUserStockLoading, setIsUserStockLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCrmData = useCallback(async () => {
    if (!profile?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Fetch Kanban Columns
      const { data: columnsData, error: columnsError } = await supabase
        .from('kanban')
        .select('id, descricao, posicao, created_at')
        .order('posicao', { ascending: true });

      if (columnsError) throw columnsError;
      setKanbanColumns(columnsData || []);

      // Fetch Opportunities
      const { data: opportunitiesData, error: opportunitiesError } = await supabase
        .from('opotunidade')
        .select(`
          id,
          id_usuario,
          id_lead,
          idEstoque,
          titulo,
          valor,
          obs,
          resumo,
          id_kanban,
          data_criacao,
          ultima_interacao,
          status,
          created_at,
          session_id_olx,
          lead:lead (
            id,
            nome,
            telefone,
            email,
            Origem,
            idUsuario,
            created_at,
            session_id_whatsaap,
            session_id_olx
          )
        `)
        .order('created_at', { ascending: false });

      if (opportunitiesError) throw opportunitiesError;
      
      // Only proceed if data is valid and not an error
      if (opportunitiesData) {
        const typedOpportunitiesData = opportunitiesData
          .filter(op => typeof op === 'object' && !('error' in op))
          .map(op => {
            // Safely handle the lead property which might not exist
            return {
              ...op,
              lead: op.lead && typeof op.lead === 'object' && !('error' in op.lead) 
                ? op.lead as LeadData
                : undefined
            };
          }) as OpportunityData[];
        
        setOpportunities(typedOpportunitiesData);
      }

      // Fetch Leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('lead')
        .select('id, nome, telefone, email, Origem, created_at, idUsuario, session_id_whatsaap, session_id_olx');

      if (leadsError) throw leadsError;
      
      if (leadsData) {
        setLeads(leadsData
          .filter(item => typeof item === 'object' && !('error' in item))
          .sort((a, b) => (a.nome || '').localeCompare(b.nome || '')) as LeadData[]);
      }

    } catch (error: any) {
      console.error('Error fetching CRM data:', error);
      toast({
        title: 'Erro ao carregar dados do CRM',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, toast]);

  const fetchUserStockVehicles = useCallback(async () => {
    if (!profile?.tbEstoque) {
      setUserStockVehicles([]);
      setIsUserStockLoading(false);
      return;
    }
    setIsUserStockLoading(true);
    try {
      const { data: stockData, error: stockError } = await supabase
        .from(profile.tbEstoque as any)
        .select('id, modelo, fabricante')
        .eq('status', 'Em estoque');

      if (stockError) {
        console.error(`Error fetching stock vehicles from ${profile.tbEstoque}:`, stockError);
        setUserStockVehicles([]);
      } else if (stockData && Array.isArray(stockData)) {
        // Filter the data to ensure it contains valid vehicle objects before setting state
        const validVehicles = stockData.filter(
          (item: any): item is StockVehicle => {
            if (!item || typeof item !== 'object' || 'error' in item) {
              return false;
            }
            const hasId = typeof item.id === 'number';
            const hasModelo = Object.prototype.hasOwnProperty.call(item, 'modelo');
            const hasFabricante = Object.prototype.hasOwnProperty.call(item, 'fabricante');
            return hasId && hasModelo && hasFabricante;
          }
        );
        
        // Now we're sure validVehicles only contains objects that match StockVehicle type
        setUserStockVehicles(validVehicles);
        
        if (validVehicles.length !== stockData.length) {
          console.warn(`Filtered out some invalid vehicle data from ${profile.tbEstoque}. Original count: ${stockData.length}, Filtered count: ${validVehicles.length}`);
        }
      } else {
        setUserStockVehicles([]);
        if (stockData !== null) {
          console.warn(`Received unexpected data type for stock vehicles from ${profile.tbEstoque}:`, stockData);
        }
      }
    } catch (error: any) {
      console.error(`Error fetching stock vehicles from ${profile.tbEstoque}:`, error);
      setUserStockVehicles([]);
      toast({
        title: 'Erro ao carregar veículos do estoque',
        description: `Não foi possível carregar veículos da tabela ${profile.tbEstoque}. Detalhe: ${error.message}`,
        variant: 'default', 
      });
    } finally {
      setIsUserStockLoading(false);
    }
  }, [profile?.tbEstoque, toast]);

  useEffect(() => {
    fetchCrmData();
  }, [fetchCrmData]);

  useEffect(() => {
    if (profile?.tbEstoque) {
      fetchUserStockVehicles();
    } else {
      setUserStockVehicles([]);
      setIsUserStockLoading(false);
    }
  }, [profile?.tbEstoque, fetchUserStockVehicles]);

  const updateOpportunityKanbanStatus = async (opportunityId: number, newKanbanId: number) => {
    try {
      // Find the opportunity to update in our local state
      const opportunityIndex = opportunities.findIndex(op => op.id === opportunityId);
      if (opportunityIndex === -1) {
        console.error(`Opportunity with ID ${opportunityId} not found`);
        return;
      }
      
      const opportunityToUpdate = opportunities[opportunityIndex];
      
      // Create updated opportunity with new kanban ID
      const updatedOpportunity = { 
        ...opportunityToUpdate, 
        id_kanban: newKanbanId,
        ultima_interacao: new Date().toISOString()
      };
      
      // Immediately update the opportunity in local state for a responsive UI
      const updatedOpportunities = [...opportunities];
      updatedOpportunities[opportunityIndex] = updatedOpportunity;
      setOpportunities(updatedOpportunities);

      // Then update in the database
      const { error } = await supabase
        .from('opotunidade')
        .update({ 
          id_kanban: newKanbanId, 
          ultima_interacao: new Date().toISOString() 
        })
        .eq('id', opportunityId);

      if (error) {
        // If there was an error, revert the change in the local state
        updatedOpportunities[opportunityIndex] = opportunityToUpdate;
        setOpportunities(updatedOpportunities);
        throw error;
      }

      toast({
        title: 'Oportunidade atualizada',
        description: 'Status da oportunidade movido com sucesso.',
      });
      
      return updatedOpportunity;
    } catch (error: any) {
      console.error('Error updating opportunity status:', error);
      toast({
        title: 'Erro ao atualizar oportunidade',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };
  
  type AddOpportunityHookInput = Pick<
    OpportunityData,
    'titulo' | 'id_lead' | 'idEstoque' | 'valor' | 'obs' | 'resumo' | 'status' | 'data_criacao'
  > & { id_kanban: number };

  const addOpportunity = async (opportunityFormData: AddOpportunityHookInput) => {
    if (!user?.id || !profile?.id) {
        toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });
        return;
    }
    try {
        const newOpportunityPayload = {
            ...opportunityFormData, 
            id_usuario: profile.id,
        };

        if (newOpportunityPayload.valor && typeof newOpportunityPayload.valor === 'number') {
          newOpportunityPayload.valor = String(newOpportunityPayload.valor);
        } else if (newOpportunityPayload.valor === '') {
          newOpportunityPayload.valor = null;
        }
        
        const { data, error } = await supabase
            .from('opotunidade')
            .insert([newOpportunityPayload]) 
            .select(`
              *,
              lead:lead (
                id,
                nome,
                telefone,
                email,
                Origem,
                idUsuario,
                created_at,
                session_id_whatsaap,
                session_id_olx
              )
            `);

        if (error) throw error;

        if (data && Array.isArray(data) && data.length > 0) {
            const newOpData = data[0];
            // Only process if the returned data isn't an error
            if (typeof newOpData === 'object' && !('error' in newOpData)) {
                const newOp = newOpData as OpportunityData;
                
                // If no lead was included but we have an id_lead, fetch the lead
                if (newOp.id_lead && (!newOp.lead || 'error' in newOp.lead)) { 
                    const { data: leadData, error: leadError } = await supabase
                        .from('lead')
                        .select('id, nome, telefone, email, Origem, idUsuario, created_at, session_id_whatsaap, session_id_olx')
                        .eq('id', newOp.id_lead)
                        .single();
                    
                    if (leadError) {
                        console.error("Error fetching lead details for new opportunity:", leadError);
                    } else if (leadData && typeof leadData === 'object' && !('error' in leadData)) {
                        newOp.lead = leadData as LeadData;
                    }
                }
                
                // Update opportunities state
                setOpportunities(prev => {
                    const validNewOp = {
                        ...newOp,
                        lead: newOp.lead && typeof newOp.lead === 'object' && !('error' in newOp.lead) 
                            ? newOp.lead as LeadData 
                            : undefined
                    };
                    return [validNewOp, ...prev];
                });
                
                toast({
                    title: 'Sucesso!',
                    description: 'Nova oportunidade adicionada.',
                });
                
                return newOp;
            }
        }
    } catch (error: any) {
        console.error('Error adding opportunity:', error);
        toast({
            title: 'Erro ao adicionar oportunidade',
            description: error.message,
            variant: 'destructive',
        });
    }
  };

  type AddLeadHookInput = Pick<LeadData, 'nome' | 'telefone' | 'email' | 'Origem'>;

  const addLead = async (leadFormData: AddLeadHookInput): Promise<LeadData | undefined> => {
    if (!profile?.id) {
      toast({ title: 'Erro', description: 'Usuário não autenticado para criar lead.', variant: 'destructive' });
      return undefined;
    }

    const newLeadPayload = {
      ...leadFormData,
      idUsuario: profile.id,
    };

    try {
      const { data, error } = await supabase
        .from('lead')
        .insert([newLeadPayload])
        .select('id, nome, telefone, email, Origem, created_at, idUsuario, session_id_whatsaap, session_id_olx')
        .single();

      if (error) throw error;

      if (data && typeof data === 'object' && !('error' in data)) {
        const newLead = data as LeadData;
        setLeads(prevLeads => [...prevLeads, newLead].sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));
        toast({
          title: 'Sucesso!',
          description: 'Novo lead adicionado.',
        });
        return newLead;
      }
    } catch (error: any) {
      console.error('Error adding lead:', error);
      toast({
        title: 'Erro ao adicionar lead',
        description: error.message,
        variant: 'destructive',
      });
    }
    return undefined;
  };

  // Get opportunity details by ID
  const getOpportunityById = async (opportunityId: number): Promise<OpportunityData | null> => {
    try {
      const { data, error } = await supabase
        .from('opotunidade')
        .select(`
          id,
          id_usuario,
          id_lead,
          idEstoque,
          titulo,
          valor,
          obs,
          resumo,
          id_kanban,
          data_criacao,
          ultima_interacao,
          status,
          created_at,
          session_id_olx,
          lead:lead (
            id,
            nome,
            telefone,
            email,
            Origem,
            idUsuario,
            created_at,
            session_id_whatsaap,
            session_id_olx
          )
        `)
        .eq('id', opportunityId)
        .single();

      if (error) {
        console.error('Error fetching opportunity:', error);
        toast({
          title: 'Erro ao carregar oportunidade',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      }

      if (!data) return null;

      // Ensure lead is properly typed if it exists
      const opportunity = {
        ...data,
        lead: data.lead && typeof data.lead === 'object' && !('error' in data.lead) 
          ? data.lead as LeadData 
          : undefined
      } as OpportunityData;

      return opportunity;
    } catch (error: any) {
      console.error('Error in getOpportunityById:', error);
      toast({
        title: 'Erro ao carregar oportunidade',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update opportunity
  const updateOpportunity = async (opportunityId: number, updates: Partial<OpportunityData>): Promise<boolean> => {
    try {
      // Remove lead from updates if present, as it needs to be updated separately
      const { lead, ...opportunityUpdates } = updates;

      const { error } = await supabase
        .from('opotunidade')
        .update(opportunityUpdates)
        .eq('id', opportunityId);

      if (error) throw error;

      // If lead updates are provided and lead_id exists, update the lead as well
      if (lead && updates.id_lead) {
        const { error: leadError } = await supabase
          .from('lead')
          .update({
            nome: lead.nome,
            telefone: lead.telefone,
            email: lead.email,
            Origem: lead.Origem
          })
          .eq('id', updates.id_lead);

        if (leadError) throw leadError;
      }

      // Update local state
      setOpportunities(prevOpportunities => 
        prevOpportunities.map(op => 
          op.id === opportunityId 
            ? { ...op, ...opportunityUpdates, lead: lead || op.lead } 
            : op
        )
      );

      toast({
        title: 'Sucesso',
        description: 'Oportunidade atualizada com sucesso.',
      });

      return true;
    } catch (error: any) {
      console.error('Error updating opportunity:', error);
      toast({
        title: 'Erro ao atualizar oportunidade',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Delete opportunity
  const deleteOpportunity = async (opportunityId: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('opotunidade')
        .delete()
        .eq('id', opportunityId);

      if (error) throw error;

      // Update local state by removing the deleted opportunity
      setOpportunities(prevOpportunities => 
        prevOpportunities.filter(op => op.id !== opportunityId)
      );

      toast({
        title: 'Sucesso',
        description: 'Oportunidade excluída com sucesso.',
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting opportunity:', error);
      toast({
        title: 'Erro ao excluir oportunidade',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Get activities for opportunity
  const getActivitiesForOpportunity = async (opportunityId: number): Promise<ActivityData[]> => {
    try {
      const { data, error } = await supabase
        .from('atividade')
        .select('*')
        .eq('id_oportunidade', opportunityId)
        .order('data_hora', { ascending: false });

      if (error) throw error;

      return data as ActivityData[] || [];
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      toast({
        title: 'Erro ao carregar atividades',
        description: error.message,
        variant: 'destructive',
      });
      return [];
    }
  };

  // Add activity
  const addActivity = async (activity: Omit<ActivityData, 'id' | 'created_at'>): Promise<ActivityData | null> => {
    try {
      const { data, error } = await supabase
        .from('atividade')
        .insert([activity])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: 'Sucesso',
        description: 'Atividade adicionada com sucesso.',
      });

      return data as ActivityData;
    } catch (error: any) {
      console.error('Error adding activity:', error);
      toast({
        title: 'Erro ao adicionar atividade',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update activity
  const updateActivity = async (activityId: number, updates: Partial<ActivityData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('atividade')
        .update(updates)
        .eq('id', activityId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Atividade atualizada com sucesso.',
      });

      return true;
    } catch (error: any) {
      console.error('Error updating activity:', error);
      toast({
        title: 'Erro ao atualizar atividade',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Delete activity
  const deleteActivity = async (activityId: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('atividade')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Atividade excluída com sucesso.',
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting activity:', error);
      toast({
        title: 'Erro ao excluir atividade',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const refetchOpportunities = () => {
    fetchCrmData();
  };

  return { 
    opportunities, 
    kanbanColumns, 
    leads, 
    userStockVehicles, 
    isUserStockLoading, 
    isLoading, 
    updateOpportunityKanbanStatus,
    addOpportunity, 
    addLead,
    refetchOpportunities,
    getOpportunityById,
    updateOpportunity,
    deleteOpportunity,
    getActivitiesForOpportunity,
    addActivity,
    updateActivity,
    deleteActivity
  };
};
