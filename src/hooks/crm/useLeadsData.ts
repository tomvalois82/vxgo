
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LeadData } from '@/lib/crmTypes';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export type AddLeadHookInput = Pick<LeadData, 'nome' | 'telefone' | 'email' | 'Origem'>;

export const useLeadsData = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);

  const fetchLeads = useCallback(async () => {
    if (!profile?.id) {
        setIsLoadingLeads(false);
        return;
    }
    setIsLoadingLeads(true);
    try {
      const { data, error } = await supabase
        .from('lead')
        .select('id, nome, telefone, email, Origem, created_at, idUsuario, session_id_whatsaap, session_id_olx');
        // .eq('idUsuario', profile.id); // Assuming leads are tied to users, adjust if global

      if (error) throw error;
      
      if (data) {
        setLeads(data
          .filter(item => typeof item === 'object' && !('error' in item))
          .sort((a, b) => (a.nome || '').localeCompare(b.nome || '')) as LeadData[]);
      } else {
        setLeads([]);
      }
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Erro ao carregar leads',
        description: error.message,
        variant: 'destructive',
      });
      setLeads([]);
    } finally {
      setIsLoadingLeads(false);
    }
  }, [profile?.id, toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

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

  return {
    leads,
    isLoadingLeads,
    addLead,
    refetchLeads: fetchLeads,
  };
};
