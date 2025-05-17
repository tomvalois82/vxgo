
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OpportunityData, KanbanColumnData, LeadData, StockVehicle } from '@/lib/crmTypes';
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
  const [leads, setLeads] = useState<LeadData[]>([]); // State for leads
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
        .select('id, nome, telefone, email, Origem, created_at');

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
      // Using `as any` here tells TypeScript to trust that profile.tbEstoque is a valid table name string.
      // This resolves the type instantiation and overload errors.
      const { data: stockData, error: stockError } = await supabase
        .from(profile.tbEstoque as any) 
        .select('id, modelo, fabricante')
        .eq('status', 'Em estoque');

      if (stockError) {
        console.error(`Error fetching stock vehicles from ${profile.tbEstoque}:`, stockError);
        setUserStockVehicles([]);
      } else {
        // Ensure stockData is treated as StockVehicle[] or an empty array.
        // The `as any` on `from()` should lead to stockData being correctly typed based on the select,
        // or null if there's an error handled by the stockError check.
        setUserStockVehicles(stockData || []);
      }
    } catch (error: any) {
      console.error(`Error fetching stock vehicles from ${profile.tbEstoque}:`, error);
      setUserStockVehicles([]);
      toast({
        title: 'Erro ao carregar veículos do estoque',
        description: `Não foi possível carregar veículos da tabela ${profile.tbEstoque}.`,
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
  
  const addOpportunity = async (opportunityData: Omit<OpportunityData, 'id' | 'created_at' | 'id_usuario' | 'data_criacao'> & { id_kanban: number }) => {
    if (!user?.id || !profile?.id) { // Ensure user and profile IDs are available
        toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });
        return;
    }
    try {
        const newOpportunity = {
            ...opportunityData,
            id_usuario: profile.id, // Use profile.id which refers to public.usuario.id
            data_criacao: new Date().toISOString(),
            ultima_interacao: opportunityData.ultima_interacao ? opportunityData.ultima_interacao : new Date().toISOString(),
            // idEstoque is already part of opportunityData from the form
        };

        // Ensure 'valor' is either a string representation of a number or null
        if (newOpportunity.valor && typeof newOpportunity.valor === 'number') {
          newOpportunity.valor = String(newOpportunity.valor);
        } else if (newOpportunity.valor === '') {
          newOpportunity.valor = null;
        }

        const { data, error } = await supabase
            .from('opotunidade')
            .insert([newOpportunity])
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
                session_id_olx
              )
            `); // Ensure the select fetches the lead details for consistency

        if (error) throw error;

        if (data) {
            // The select already includes the lead details if id_lead is present.
            // The returned data[0] from insert().select() should be OpportunityData compatible.
            const newOp = data[0] as OpportunityData; // Explicitly cast here
            // Fetch lead details separately if not included or if lead is null but id_lead exists
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
    refetchOpportunities
  };
};

