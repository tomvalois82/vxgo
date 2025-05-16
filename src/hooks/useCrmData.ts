import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OpportunityData, KanbanColumnData, LeadData } from '@/lib/crmTypes';
import { useToast } from '@/components/ui/use-toast';

export const useCrm = () => {
  const { profile, user } = useAuth(); // Added user for id_usuario
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<OpportunityData[]>([]);
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumnData[]>([]);
  const [leads, setLeads] = useState<LeadData[]>([]); // State for leads
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
        .select('id, nome, telefone, email, Origem, created_at'); // Add fields as needed

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

  useEffect(() => {
    fetchCrmData();
  }, [fetchCrmData]);

  const updateOpportunityKanbanStatus = async (opportunityId: number, newKanbanId: number) => {
    try {
      const { error } = await supabase
        .from('opotunidade')
        .update({ id_kanban: newKanbanId, ultima_interacao: new Date().toISOString() })
        .eq('id', opportunityId);

      if (error) throw error;

      setOpportunities(prev =>
        prev.map(op =>
          op.id === opportunityId ? { ...op, id_kanban: newKanbanId } : op
        )
      );
      toast({
        title: 'Oportunidade atualizada',
        description: 'Status da oportunidade movido com sucesso.',
      });
    } catch (error: any) {
      console.error('Error updating opportunity status:', error);
      toast({
        title: 'Erro ao atualizar oportunidade',
        description: error.message,
        variant: 'destructive',
      });
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
            ultima_interacao: opportunityData.ultima_interacao ? new Date(opportunityData.ultima_interacao).toISOString() : new Date().toISOString(),
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
            .select();

        if (error) throw error;

        if (data) {
            // Manually construct the lead object if id_lead is present
            // This is a simplification; in a real app, you might want to fetch the full lead object
            // or ensure the form provides enough data to construct it.
            const newOpWithLead = data[0].id_lead 
              ? { ...data[0], lead: leads.find(l => l.id === data[0].id_lead) || null }
              : data[0];

            setOpportunities(prev => [newOpWithLead as OpportunityData, ...prev]);
            toast({
                title: 'Sucesso!',
                description: 'Nova oportunidade adicionada.',
            });
            return data[0];
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
    leads, // Expose leads
    isLoading, 
    updateOpportunityKanbanStatus,
    addOpportunity, // Expose addOpportunity
    refetchOpportunities
  };
};
