import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OpportunityData, KanbanColumnData, LeadData, StockVehicle, AddLeadFormInput } from '@/lib/crmTypes';
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
  const [isOpportunityLoading, setIsOpportunityLoading] = useState(false);

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
        .select('id, nome, telefone, email, Origem, created_at, idUsuario'); 

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
      const tableName = profile.tbEstoque as string;

      // Using the Supabase dynamic table query
      const { data, error: stockError } = await supabase
        .from(tableName as any) 
        .select('id, modelo, fabricante')
        .eq('status', 'Em estoque');

      if (stockError) {
        console.error(`Error fetching stock vehicles from ${tableName}:`, stockError);
        toast({
          title: `Erro ao buscar estoque de ${tableName}`,
          description: stockError.message,
          variant: 'destructive',
        });
        setUserStockVehicles([]);
      } else {
        // Ensure data is an array before processing
        if (data && Array.isArray(data)) {
          // Use type guards to ensure we only process valid items
          const validVehicles: StockVehicle[] = [];
          
          for (const item of data) {
            // Check if item has the required properties with correct types
            if (
              item && 
              typeof item === 'object' &&
              'id' in item && 
              typeof item.id === 'number' &&
              ('modelo' in item || item.modelo === null) &&
              (item.modelo === null || typeof item.modelo === 'string') &&
              ('fabricante' in item || item.fabricante === null) &&
              (item.fabricante === null || typeof item.fabricante === 'string')
            ) {
              validVehicles.push({
                id: item.id,
                modelo: item.modelo,
                fabricante: item.fabricante
              });
            }
          }
          
          setUserStockVehicles(validVehicles);

          if (validVehicles.length !== data.length) {
            const invalidCount = data.length - validVehicles.length;
            console.warn(`Filtered out ${invalidCount} invalid vehicle data items from ${tableName}.`);
          }
        } else {
          setUserStockVehicles([]);
          if (data !== null) {
             console.warn(`Received non-array data for stock vehicles from ${tableName}:`, data);
          }
        }
      }
    } catch (error: any) {
      const currentTable = profile?.tbEstoque || "unknown table";
      console.error(`Error fetching stock vehicles from ${currentTable}:`, error);
      setUserStockVehicles([]);
      toast({
        title: 'Erro ao carregar veículos do estoque',
        description: `Não foi possível carregar veículos da tabela ${currentTable}.`,
        variant: 'destructive',
      });
    } finally {
      setIsUserStockLoading(false);
    }
  }, [profile?.tbEstoque, toast]);

  const fetchOpportunityById = useCallback(async (opportunityId: number) => {
    setIsOpportunityLoading(true);
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
        .eq('id', opportunityId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { 
          console.warn(`Opportunity with ID ${opportunityId} not found.`);
          return null;
        }
        throw error;
      }
      return data as OpportunityData | null;
    } catch (error: any) {
      console.error(`Error fetching opportunity ${opportunityId}:`, error);
      toast({
        title: 'Erro ao carregar oportunidade',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsOpportunityLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCrmData();
  }, [fetchCrmData]);

  useEffect(() => {
    if (profile?.tbEstoque) {
      fetchUserStockVehicles();
    } else {
      setUserStockVehicles([]);
      setIsUserStockLoading(false); // Ensure loading state is reset if tbEstoque is not available
    }
  }, [profile?.tbEstoque, fetchUserStockVehicles]);
  
  const updateOpportunityKanbanStatus = async (opportunityId: number, newKanbanId: number) => {
    try {
      const opportunityIndex = opportunities.findIndex(op => op.id === opportunityId);
      if (opportunityIndex === -1) {
        console.error(`Opportunity with ID ${opportunityId} not found`);
        return;
      }
      
      const opportunityToUpdate = opportunities[opportunityIndex];
      
      const updatedOpportunity = { 
        ...opportunityToUpdate, 
        id_kanban: newKanbanId,
        ultima_interacao: new Date().toISOString()
      };
      
      const updatedOpportunities = [...opportunities];
      updatedOpportunities[opportunityIndex] = updatedOpportunity;
      setOpportunities(updatedOpportunities);

      const { error } = await supabase
        .from('opotunidade')
        .update({ 
          id_kanban: newKanbanId, 
          ultima_interacao: new Date().toISOString() 
        })
        .eq('id', opportunityId);

      if (error) {
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
        const newOpportunityPayload = {
            ...opportunityFormData,
            id_usuario: profile.id,
        };

        if (newOpportunityPayload.valor && typeof newOpportunityPayload.valor === 'number') {
          // @ts-ignore TODO: fix this type error by ensuring valor is string | null in OpportunityData
          newOpportunityPayload.valor = String(newOpportunityPayload.valor);
        } else if (newOpportunityPayload.valor === '') {
          // @ts-ignore
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
    isOpportunityLoading,
    fetchOpportunityById,
    updateOpportunityKanbanStatus,
    addOpportunity, 
    addLead, 
    refetchOpportunities
  };
};
