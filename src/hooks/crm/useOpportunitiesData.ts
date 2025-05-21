
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OpportunityData, LeadData } from '@/lib/crmTypes';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export type AddOpportunityHookInput = Pick<
  OpportunityData,
  'titulo' | 'id_lead' | 'idEstoque' | 'valor' | 'obs' | 'resumo' | 'status' | 'data_criacao'
> & { id_kanban: number };

interface UseOpportunitiesDataProps {
  initialLeads: LeadData[]; // Needed for embedding lead info
}

export const useOpportunitiesData = ({ initialLeads }: UseOpportunitiesDataProps) => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<OpportunityData[]>([]);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(true);

  const fetchOpportunities = useCallback(async () => {
    if (!profile?.id) {
        setIsLoadingOpportunities(false);
        return;
    }
    setIsLoadingOpportunities(true);
    try {
      const { data: opportunitiesData, error: opportunitiesError } = await supabase
        .from('opotunidade')
        .select(`
          id, id_usuario, id_lead, idEstoque, titulo, valor, obs, resumo, id_kanban,
          data_criacao, ultima_interacao, status, created_at, session_id_olx,
          lead:lead (id, nome, telefone, email, Origem, idUsuario, created_at, session_id_whatsaap, session_id_olx)
        `)
        // .eq('id_usuario', profile.id) // Filter by user if opportunities are user-specific
        .order('created_at', { ascending: false });

      if (opportunitiesError) throw opportunitiesError;
      
      if (opportunitiesData) {
        const typedOpportunitiesData = opportunitiesData
          .filter(op => typeof op === 'object' && !('error' in op))
          .map(op => ({
            ...op,
            lead: op.lead && typeof op.lead === 'object' && !('error' in op.lead) 
              ? op.lead as LeadData
              : undefined
          })) as OpportunityData[];
        setOpportunities(typedOpportunitiesData);
      } else {
        setOpportunities([]);
      }
    } catch (error: any) {
      console.error('Error fetching opportunities:', error);
      toast({
        title: 'Erro ao carregar oportunidades',
        description: error.message,
        variant: 'destructive',
      });
      setOpportunities([]);
    } finally {
      setIsLoadingOpportunities(false);
    }
  }, [profile?.id, toast]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);
  
  // Update local opportunities if initialLeads change (e.g. a new lead was added)
  useEffect(() => {
    setOpportunities(prevOps => prevOps.map(op => {
      if (op.id_lead && !op.lead) {
        const foundLead = initialLeads.find(l => l.id === op.id_lead);
        if (foundLead) {
          return { ...op, lead: foundLead };
        }
      }
      return op;
    }));
  }, [initialLeads]);


  const addOpportunity = async (opportunityFormData: AddOpportunityHookInput) => {
    if (!user?.id || !profile?.id) {
        toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });
        return;
    }
    try {
        const newOpportunityPayload: any = { // Use 'any' temporarily for valor conversion
            ...opportunityFormData, 
            id_usuario: profile.id,
        };

        if (newOpportunityPayload.valor && typeof newOpportunityPayload.valor === 'number') {
          newOpportunityPayload.valor = String(newOpportunityPayload.valor);
        } else if (newOpportunityPayload.valor === '' || newOpportunityPayload.valor === null || newOpportunityPayload.valor === undefined) {
          newOpportunityPayload.valor = null;
        }
        
        const { data, error } = await supabase
            .from('opotunidade')
            .insert([newOpportunityPayload]) 
            .select(`
              *,
              lead:lead (id, nome, telefone, email, Origem, idUsuario, created_at, session_id_whatsaap, session_id_olx)
            `);

        if (error) throw error;

        if (data && Array.isArray(data) && data.length > 0) {
            const newOpData = data[0];
            if (typeof newOpData === 'object' && !('error' in newOpData)) {
                let newOp = newOpData as OpportunityData;
                
                if (newOp.id_lead && (!newOp.lead || ('error' in newOp.lead))) { 
                    const foundLead = initialLeads.find(l => l.id === newOp.id_lead);
                    if (foundLead) newOp.lead = foundLead;
                }
                
                setOpportunities(prev => [newOp, ...prev]);
                toast({ title: 'Sucesso!', description: 'Nova oportunidade adicionada.' });
                return newOp;
            }
        }
    } catch (error: any) {
        console.error('Error adding opportunity:', error);
        toast({ title: 'Erro ao adicionar oportunidade', description: error.message, variant: 'destructive' });
    }
  };

  const updateOpportunityKanbanStatus = async (opportunityId: number, newKanbanId: number) => {
    const opportunityIndex = opportunities.findIndex(op => op.id === opportunityId);
    if (opportunityIndex === -1) return null;
    
    const originalOpportunity = opportunities[opportunityIndex];
    const updatedOpportunityLocal = { ...originalOpportunity, id_kanban: newKanbanId, ultima_interacao: new Date().toISOString() };
    
    setOpportunities(prev => prev.map(op => op.id === opportunityId ? updatedOpportunityLocal : op));

    try {
      const { error } = await supabase
        .from('opotunidade')
        .update({ id_kanban: newKanbanId, ultima_interacao: new Date().toISOString() })
        .eq('id', opportunityId);

      if (error) {
        setOpportunities(prev => prev.map(op => op.id === opportunityId ? originalOpportunity : op)); // Revert
        throw error;
      }
      toast({ title: 'Oportunidade atualizada', description: 'Status da oportunidade movido.' });
      return updatedOpportunityLocal;
    } catch (error: any) {
      console.error('Error updating opportunity status:', error);
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const getOpportunityById = async (opportunityId: number): Promise<OpportunityData | null> => {
    // Try to find in local state first for speed, then fetch if not detailed enough or not found
    const localOp = opportunities.find(op => op.id === opportunityId);
    if (localOp && localOp.lead) return localOp; // Assuming if lead is present, it's detailed enough

    try {
      const { data, error } = await supabase
        .from('opotunidade')
        .select(`*, lead:lead (*)`)
        .eq('id', opportunityId)
        .single();
      if (error) throw error;
      if (!data) return null;
      
      const opportunity = {
        ...data,
        lead: data.lead && typeof data.lead === 'object' && !('error' in data.lead) ? data.lead as LeadData : undefined
      } as OpportunityData;
      
      // Update local state with fetched details
      setOpportunities(prev => prev.map(op => op.id === opportunityId ? opportunity : op));
      return opportunity;
    } catch (error: any) {
      toast({ title: 'Erro ao carregar oportunidade', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updateOpportunity = async (opportunityId: number, updates: Partial<OpportunityData>): Promise<boolean> => {
    try {
      const { lead, ...opportunityUpdates } = updates;
      const { error } = await supabase
        .from('opotunidade')
        .update(opportunityUpdates)
        .eq('id', opportunityId);
      if (error) throw error;

      if (lead && updates.id_lead) {
        const { error: leadError } = await supabase
          .from('lead')
          .update({ nome: lead.nome, telefone: lead.telefone, email: lead.email, Origem: lead.Origem })
          .eq('id', updates.id_lead);
        if (leadError) throw leadError;
      }
      setOpportunities(prev => prev.map(op => op.id === opportunityId ? { ...op, ...opportunityUpdates, lead: lead || op.lead } : op));
      toast({ title: 'Sucesso', description: 'Oportunidade atualizada.' });
      return true;
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  const deleteOpportunity = async (opportunityId: number): Promise<boolean> => {
    try {
      const { error } = await supabase.from('opotunidade').delete().eq('id', opportunityId);
      if (error) throw error;
      setOpportunities(prev => prev.filter(op => op.id !== opportunityId));
      toast({ title: 'Sucesso', description: 'Oportunidade excluída.' });
      return true;
    } catch (error: any) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  return {
    opportunities,
    isLoadingOpportunities,
    addOpportunity,
    updateOpportunityKanbanStatus,
    getOpportunityById,
    updateOpportunity,
    deleteOpportunity,
    refetchOpportunities: fetchOpportunities,
    setOpportunities // expose setter for optimistic updates if needed by main hook
  };
};
