import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OpportunityData, KanbanColumnData, LeadData, StockVehicle } from '@/lib/crmTypes';
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
          session_id_whatsaap, // Corrected field name
          session_id_olx,
          lead:lead (
            id,
            nome,
            telefone,
            email,
            Origem,
            idUsuario, 
            created_at,
            session_id_whatsaap, // Corrected field name
            session_id_olx
          )
        `)
        .order('created_at', { ascending: false });

      if (opportunitiesError) throw opportunitiesError;
      const typedOpportunitiesData = (opportunitiesData || []).map(op => ({
        ...op,
        lead: op.lead ? (op.lead as LeadData) : undefined
      })) as OpportunityData[];
      setOpportunities(typedOpportunitiesData);

      // Fetch Leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('lead')
        .select('id, nome, telefone, email, Origem, created_at, idUsuario, session_id_whatsaap, session_id_olx'); // Corrected field name

      if (leadsError) throw leadsError;
      setLeads((leadsData as LeadData[] || []).sort((a, b) => (a.nome || '').localeCompare(b.nome || '')));

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
      setIsUserStockLoading(false); // Ensure loading state is reset
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
          const validVehicles = stockData.filter(
            (item: any): item is StockVehicle => {
              if (!item || typeof item !== 'object' || item.error) {
                return false;
              }
              const hasId = typeof item.id === 'number';
              const hasModelo = Object.prototype.hasOwnProperty.call(item, 'modelo');
              const hasFabricante = Object.prototype.hasOwnProperty.call(item, 'fabricante');
              return hasId && hasModelo && hasFabricante;
            }
          );
          setUserStockVehicles(validVehicles);
          if (validVehicles.length !== stockData.length) {
            console.warn(`Filtered out some invalid vehicle data from ${profile.tbEstoque}. Original count: ${stockData.length}, Filtered count: ${validVehicles.length}`);
          }
      } else if (stockData && typeof stockData === 'object' && 'error' in stockData) {
        console.warn(`Received error object in stock data from ${profile.tbEstoque}:`, stockData);
        setUserStockVehicles([]);
      }
       else {
        setUserStockVehicles([]); // Default to empty array if data is not as expected
        if (stockData !== null) { // Log if stockData is not null but also not an array or known error object
             console.warn(`Received unexpected data type for stock vehicles from ${profile.tbEstoque}:`, stockData);
        }
      }
    } catch (error: any) {
      console.error(`Error fetching stock vehicles from ${profile.tbEstoque}:`, error);
      setUserStockVehicles([]);
      toast({
        title: 'Erro ao carregar veículos do estoque',
        description: `Não foi possível carregar veículos da tabela ${profile.tbEstoque}. Detalhe: ${error.message}`,
        variant: 'default', // Changed to default as it's a common scenario if table name is wrong in profile
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
                session_id_whatsaap, // Corrected field name
                session_id_olx
              )
            `);

        if (error) throw error;

        if (data) {
            const newOp = data[0] as OpportunityData; 
            if (newOp.id_lead && !newOp.lead) { 
              const { data: leadData, error: leadError } = await supabase
                .from('lead')
                .select('id, nome, telefone, email, Origem, idUsuario, created_at, session_id_whatsaap, session_id_olx') // Corrected field name
                .eq('id', newOp.id_lead)
                .single();
              if (leadError) console.error("Error fetching lead details for new opportunity:", leadError);
              else newOp.lead = leadData as LeadData; 
            }
            
            setOpportunities(prev => [newOp, ...prev].map(op => ({
              ...op,
              lead: op.lead ? op.lead as LeadData : undefined 
            })) as OpportunityData[]);
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
        .select('id, nome, telefone, email, Origem, created_at, idUsuario, session_id_whatsaap, session_id_olx') // Corrected field name
        .single();

      if (error) throw error;

      if (data) {
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
