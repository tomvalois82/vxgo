import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OpportunityData, KanbanColumnData, LeadData, StockVehicle, AddLeadFormInput } from '@/lib/crmTypes';
import { useToast } from '@/components/ui/use-toast';

// Remove the local StockVehicle interface definition from here as it's now in crmTypes.ts
// interface StockVehicle {
//   id: number;
//   modelo: string | null;
//   fabricante: string | null;
// }

export const useCrm = () => {
  const { profile, user } = useAuth(); // Added user for id_usuario
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<OpportunityData[]>([]);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumnData[]>([]);
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [userStockVehicles, setUserStockVehicles] = useState<StockVehicle[]>([]); // New state for user's stock vehicles
  const [isUserStockLoading, setIsUserStockLoading] = useState(false); // Loading state for stock vehicles
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
          session_id_whatsapp,
          session_id_olx,
          lead:lead (
            id,
            nome,
            telefone,
            email,
            Origem,
            created_at,
            session_id_whatsaap,
            session_id_olx
          )
        `)
        .order('created_at', { ascending: false });

      if (opportunitiesError) throw opportunitiesError;
      setOpportunities(opportunitiesData || []);

      // Fetch Leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('lead')
        .select('id, nome, telefone, email, Origem, created_at, idUsuario'); // Added idUsuario

      if (leadsError) throw leadsError;
      setLeads(leadsData || []);

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
        toast({
          title: `Erro ao buscar estoque de ${profile.tbEstoque}`,
          description: stockError.message,
          variant: 'destructive',
        });
        setUserStockVehicles([]);
      } else {
        if (Array.isArray(stockData)) {
          const validVehicles = stockData.filter(
            (item: any): item is StockVehicle =>
              typeof item === 'object' &&
              item !== null &&
              typeof item.id === 'number' &&
              ('modelo' in item) && // Allows null
              ('fabricante' in item) // Allows null
          );
          setUserStockVehicles(validVehicles);
          if (validVehicles.length !== stockData.length) {
            console.warn(`Filtered out some invalid vehicle data from ${profile.tbEstoque}. Original count: ${stockData.length}, Filtered count: ${validVehicles.length}`);
            const invalidItems = stockData.filter(item => !validVehicles.includes(item));
            console.warn('Invalid items:', invalidItems);
          }
        } else {
          setUserStockVehicles([]);
          if (stockData !== null) { // Log if it was non-null but also not an array
             console.warn(`Received non-array data for stock vehicles from ${profile.tbEstoque}:`, stockData);
          }
        }
      }
    } catch (error: any) {
      console.error(`Error fetching stock vehicles from ${profile.tbEstoque}:`, error);
      setUserStockVehicles([]);
      toast({
        title: 'Erro ao carregar veículos do estoque',
        description: `Não foi possível carregar veículos da tabela ${profile.tbEstoque}.`,
        variant: 'destructive',
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
      // If tbEstoque is not set, ensure vehicles list is empty and not loading.
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
  
  // Define the type for the data expected by addOpportunity directly
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
        // ultima_interacao is intentionally not set here based on new requirements for this form.
        // It will be NULL in the DB unless a DB default sets it. It's updated by other processes.
        const newOpportunityPayload = {
            ...opportunityFormData, // This includes data_criacao from the form
            id_usuario: profile.id,
            // ultima_interacao is not set here
        };

        // Ensure 'valor' is either a string representation of a number or null
        if (newOpportunityPayload.valor && typeof newOpportunityPayload.valor === 'number') {
          // This case should ideally not happen if form sends string, but as a safeguard:
          newOpportunityPayload.valor = String(newOpportunityPayload.valor);
        } else if (newOpportunityPayload.valor === '') {
          newOpportunityPayload.valor = null;
        }
        
        // data_criacao is already expected as string | null from opportunityFormData

        const { data, error } = await supabase
            .from('opotunidade')
            .insert([newOpportunityPayload]) // newOpportunityPayload matches subset of OpportunityData
            .select(`
              *,
              lead:lead (
                id,
                nome,
                telefone,
                email,
                Origem,
                created_at,
                session_id_whatsaap,
                session_id_olx,
                idUsuario
              )
            `);

        if (error) throw error;

        if (data) {
            const newOp = data[0] as OpportunityData; 
            if (newOp.id_lead && !newOp.lead) {
              const { data: leadData, error: leadError } = await supabase
                .from('lead')
                .select('*')
                .eq('id', newOp.id_lead)
                .single();
              if (leadError) console.error("Error fetching lead details for new opportunity:", leadError);
              else newOp.lead = leadData as LeadData;
            }

            setOpportunities(prev => [newOp, ...prev]);
            toast({
                title: 'Sucesso!',
                description: 'Nova oportunidade adicionada.',
            });
            return newOp;
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

  const addLead = async (leadFormData: AddLeadFormInput): Promise<LeadData | undefined> => {
    if (!profile?.id) {
      toast({ title: 'Erro', description: 'Usuário não autenticado para criar lead.', variant: 'destructive' });
      return;
    }
    try {
      const newLeadPayload = {
        ...leadFormData,
        idUsuario: profile.id,
      };

      const { data, error } = await supabase
        .from('lead')
        .insert([newLeadPayload])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newLead = data as LeadData;
        setLeads(prevLeads => [newLead, ...prevLeads].sort((a, b) => (a.nome || "").localeCompare(b.nome || "")));
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
    refetchOpportunities
  };
};
