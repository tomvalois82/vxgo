
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KanbanColumnDb, OpportunityDb } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext'; // To get current user info

// Fetch Kanban Columns
const fetchKanbanColumns = async (): Promise<KanbanColumnDb[]> => {
  const { data, error } = await supabase
    .from('kanban')
    .select('*')
    .order('posicao', { ascending: true });

  if (error) {
    console.error('Error fetching Kanban columns:', error);
    throw new Error(error.message);
  }
  return data || [];
};

export const useKanbanColumns = () => {
  return useQuery<KanbanColumnDb[], Error>({
    queryKey: ['kanbanColumns'],
    queryFn: fetchKanbanColumns,
  });
};

// Fetch Opportunities for the current user
const fetchOpportunities = async (userId: number | undefined): Promise<OpportunityDb[]> => {
  if (!userId) return []; // Or handle appropriately if userId is essential

  const { data, error } = await supabase
    .from('opotunidade')
    .select('*')
    .eq('id_usuario', userId); // RLS should also enforce this, but good to be explicit

  if (error) {
    console.error('Error fetching opportunities:', error);
    throw new Error(error.message);
  }
  return data || [];
};

export const useOpportunities = () => {
  const { profile } = useAuth(); // Assuming profile contains the user's database id (e.g., profile.id or similar)
  // IMPORTANT: Adjust `profile.id` if your user profile structure from AuthContext is different
  // and `opotunidade.id_usuario` expects the `id` from your `public.usuario` table.
  // The RLS policies use `(SELECT id FROM public.usuario WHERE uid = auth.uid())`.
  // So we need the `id` from `public.usuario` table that corresponds to `auth.uid()`.
  // If `profile.id` is not this, we might need another query to get the user's internal ID.
  // For now, I'm assuming `profile.id` is the correct one for the `id_usuario` foreign key.
  // Let's log profile to check.
  console.log('Current user profile for opportunities:', profile);

  // A robust way would be to fetch the user's internal ID based on auth.uid() if not directly available.
  // However, AuthContext profile usually stores such useful IDs.
  const userId = profile?.id; // This needs to be the ID from your 'usuario' table.

  return useQuery<OpportunityDb[], Error>({
    queryKey: ['opportunities', userId],
    queryFn: () => fetchOpportunities(userId),
    enabled: !!userId, // Only run query if userId is available
  });
};

// Update Opportunity's Kanban Column
const updateOpportunityKanbanColumn = async ({ opportunityId, newKanbanId }: { opportunityId: number; newKanbanId: number | null }) => {
  const { data, error } = await supabase
    .from('opotunidade')
    .update({ id_kanban: newKanbanId })
    .eq('id', opportunityId)
    .select();

  if (error) {
    console.error('Error updating opportunity column:', error);
    throw new Error(error.message);
  }
  return data;
};

export const useUpdateOpportunityKanban = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOpportunityKanbanColumn,
    onSuccess: () => {
      // Invalidate and refetch opportunities to reflect the change
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
    // Add onError handling if needed
  });
};
