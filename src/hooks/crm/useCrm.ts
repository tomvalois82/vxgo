
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext'; // Keep for profile check
import { useKanbanColumns } from './useKanbanColumns';
import { useUserStockVehicles } from './useUserStockVehicles';
import { useLeadsData } from './useLeadsData';
import { useOpportunitiesData } from './useOpportunitiesData';
import { useActivitiesData } from './useActivitiesData';

export const useCrm = () => {
  const { profile } = useAuth(); // Used to gate initial fetches

  const { 
    kanbanColumns, 
    isLoadingKanbanColumns, 
    refetchKanbanColumns 
  } = useKanbanColumns();
  
  const { 
    userStockVehicles, 
    isUserStockLoading, 
    refetchUserStockVehicles 
  } = useUserStockVehicles();
  
  const { 
    leads, 
    isLoadingLeads, 
    addLead: addLeadHook, // Renamed to avoid conflict if we have a local addLead
    refetchLeads 
  } = useLeadsData();

  // useOpportunitiesData depends on leads for embedding, so we pass it.
  const {
    opportunities,
    isLoadingOpportunities,
    addOpportunity: addOpportunityHook, // Renamed
    updateOpportunityKanbanStatus,
    getOpportunityById,
    updateOpportunity,
    deleteOpportunity,
    refetchOpportunities,
    setOpportunities
  } = useOpportunitiesData({ initialLeads: leads });

  const activitiesHook = useActivitiesData();

  // Combine loading states for a general CRM loading indicator
  const isLoading = useMemo(() => {
    // Considered loaded if profile exists and sub-hooks have finished their initial load.
    // For a true "initial CRM load", we might only care about a subset.
    // For now, let's say CRM is loading if any of the core data pieces are loading.
    return !profile || isLoadingKanbanColumns || isLoadingLeads || isLoadingOpportunities || isUserStockLoading;
  }, [profile, isLoadingKanbanColumns, isLoadingLeads, isLoadingOpportunities, isUserStockLoading]);
  
  const refetchAllCrmData = () => {
    refetchKanbanColumns();
    refetchUserStockVehicles();
    refetchLeads();
    refetchOpportunities();
    // Activities are fetched on demand, so no global refetch here
  };

  // Ensure `addOpportunity` correctly updates leads in opportunities if a new lead was part of it.
  // The current `useOpportunitiesData` handles embedding leads.
  
  // The `addOpportunity` from `useOpportunitiesData` and `addLead` from `useLeadsData`
  // already handle updating their respective states (`opportunities` and `leads`).
  // When a new lead is added, `useOpportunitiesData` has a useEffect to update its
  // opportunities if they reference that lead.

  return {
    // Data
    opportunities,
    kanbanColumns,
    leads,
    userStockVehicles,

    // Loading States
    isLoading, // Combined loading state
    isUserStockLoading, // Specific loading for stock
    isLoadingOpportunities, // Specific for ops
    isLoadingLeads, // Specific for leads
    isLoadingKanbanColumns, // Specific for kanban

    // Functions - Opportunities
    addOpportunity: addOpportunityHook,
    updateOpportunityKanbanStatus,
    getOpportunityById,
    updateOpportunity,
    deleteOpportunity,
    
    // Functions - Leads
    addLead: addLeadHook,
    
    // Functions - Activities
    ...activitiesHook,

    // Refetching
    refetchOpportunities, // This now specifically refetches opportunities
    refetchAllCrmData, // New function to refetch all core CRM data
    
    // Direct Setters (use with caution, primarily for optimistic updates if needed)
    setOpportunities, 
  };
};
