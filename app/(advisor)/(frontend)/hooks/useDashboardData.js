/**
 * Dashboard Data Hooks
 * Custom hooks for fetching dashboard data with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '@/lib/api';
import { 
  queryKeys, 
  getCacheStrategy, 
  cacheInvalidation,
  optimisticUpdates 
} from '@/lib/query-client-config';

/**
 * Fetch dashboard KPIs
 */
export function useDashboardKPIs() {
  return useQuery({
    queryKey: queryKeys.dashboard.kpis(),
    queryFn: async () => {
      const response = await apiCall('/advisor/kpis');
      return response.data || response;
    },
    ...getCacheStrategy('quick-stats')
  });
}

/**
 * Fetch dashboard counters
 */
export function useDashboardCounters() {
  return useQuery({
    queryKey: queryKeys.dashboard.counters(),
    queryFn: async () => {
      const response = await apiCall('/advisor/dashboard-counters');
      return response.data || response;
    },
    ...getCacheStrategy('quick-stats')
  });
}

/**
 * Fetch today's appointments
 */
export function useTodayAppointments() {
  return useQuery({
    queryKey: queryKeys.appointments.today(),
    queryFn: async () => {
      const response = await apiCall('/advisor/appointments?date=today');
      return response.data || response;
    },
    ...getCacheStrategy('today')
  });
}

/**
 * Fetch appointments with filters
 */
export function useAppointments(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  
  return useQuery({
    queryKey: queryKeys.appointments.list(filters),
    queryFn: async () => {
      const response = await apiCall(`/advisor/appointments?${queryParams}`);
      return response.data || response;
    },
    ...getCacheStrategy('calendar')
  });
}

/**
 * Create appointment with optimistic update
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (appointmentData) => {
      const response = await apiCall('/advisor/appointments', {
        method: 'POST',
        body: JSON.stringify(appointmentData)
      });
      return response.data || response;
    },
    onMutate: async (newAppointment) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.appointments.all });
      
      // Snapshot previous value
      const previousAppointments = queryClient.getQueryData(queryKeys.appointments.list({}));
      
      // Optimistically update
      optimisticUpdates.createAppointment(queryClient, {
        ...newAppointment,
        _id: 'temp-' + Date.now(),
        createdAt: new Date()
      });
      
      return { previousAppointments };
    },
    onError: (err, newAppointment, context) => {
      // Rollback on error
      if (context?.previousAppointments) {
        queryClient.setQueryData(
          queryKeys.appointments.list({}),
          context.previousAppointments
        );
      }
    },
    onSuccess: () => {
      // Invalidate related queries
      cacheInvalidation.invalidateAfterAppointmentChange(queryClient);
    }
  });
}

/**
 * Update appointment with optimistic update
 */
export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const response = await apiCall(`/advisor/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      return response.data || response;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.appointments.all });
      
      const previousAppointments = queryClient.getQueryData(queryKeys.appointments.list({}));
      
      optimisticUpdates.updateAppointment(queryClient, id, updates);
      
      return { previousAppointments };
    },
    onError: (err, variables, context) => {
      if (context?.previousAppointments) {
        queryClient.setQueryData(
          queryKeys.appointments.list({}),
          context.previousAppointments
        );
      }
    },
    onSuccess: () => {
      cacheInvalidation.invalidateAfterAppointmentChange(queryClient);
    }
  });
}

/**
 * Delete appointment with optimistic update
 */
export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      await apiCall(`/advisor/appointments/${id}`, {
        method: 'DELETE'
      });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.appointments.all });
      
      const previousAppointments = queryClient.getQueryData(queryKeys.appointments.list({}));
      
      optimisticUpdates.deleteAppointment(queryClient, id);
      
      return { previousAppointments };
    },
    onError: (err, id, context) => {
      if (context?.previousAppointments) {
        queryClient.setQueryData(
          queryKeys.appointments.list({}),
          context.previousAppointments
        );
      }
    },
    onSuccess: () => {
      cacheInvalidation.invalidateAfterAppointmentChange(queryClient);
    }
  });
}

/**
 * Fetch priority tasks
 */
export function usePriorityTasks(limit = 5) {
  return useQuery({
    queryKey: queryKeys.tasks.priority(),
    queryFn: async () => {
      const response = await apiCall(`/advisor/tasks?limit=${limit}&status=TODO,IN_PROGRESS`);
      return response.data || response;
    },
    ...getCacheStrategy('tasks')
  });
}

/**
 * Update task status with optimistic update
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await apiCall(`/advisor/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      return response.data || response;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });
      
      const previousTasks = queryClient.getQueryData(queryKeys.tasks.priority());
      
      optimisticUpdates.updateTaskStatus(queryClient, id, status);
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          queryKeys.tasks.priority(),
          context.previousTasks
        );
      }
    },
    onSuccess: () => {
      cacheInvalidation.invalidateAfterTaskChange(queryClient);
    }
  });
}

/**
 * Fetch emails
 */
export function useEmails(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  
  return useQuery({
    queryKey: queryKeys.emails.list(filters),
    queryFn: async () => {
      const response = await apiCall(`/advisor/emails?${queryParams}`);
      return response.data || response;
    },
    ...getCacheStrategy('emails')
  });
}

/**
 * Mark email as read with optimistic update
 */
export function useMarkEmailAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      await apiCall(`/advisor/emails/${id}/read`, {
        method: 'PUT'
      });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.emails.all });
      
      const previousEmails = queryClient.getQueryData(queryKeys.emails.list({}));
      
      optimisticUpdates.markEmailAsRead(queryClient, id);
      
      return { previousEmails };
    },
    onError: (err, id, context) => {
      if (context?.previousEmails) {
        queryClient.setQueryData(
          queryKeys.emails.list({}),
          context.previousEmails
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emails.unread() });
    }
  });
}

/**
 * Fetch KYC alerts
 */
export function useKYCAlerts(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  
  return useQuery({
    queryKey: queryKeys.alerts.kyc(filters),
    queryFn: async () => {
      const response = await apiCall(`/advisor/kyc/alerts?${queryParams}`);
      return response.data || response;
    },
    ...getCacheStrategy('alerts-kyc')
  });
}

/**
 * Fetch system alerts
 */
export function useSystemAlerts(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  
  return useQuery({
    queryKey: queryKeys.alerts.system(filters),
    queryFn: async () => {
      const response = await apiCall(`/advisor/alerts?${queryParams}`);
      return response.data || response;
    },
    ...getCacheStrategy('alerts-system')
  });
}

/**
 * Dismiss alert with optimistic update
 */
export function useDismissAlert(alertType = 'system') {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      await apiCall(`/advisor/alerts/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ read: true })
      });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.alerts.all });
      
      const queryKey = alertType === 'kyc' 
        ? queryKeys.alerts.kyc({})
        : queryKeys.alerts.system({});
      
      const previousAlerts = queryClient.getQueryData(queryKey);
      
      optimisticUpdates.dismissAlert(queryClient, id, alertType);
      
      return { previousAlerts, queryKey };
    },
    onError: (err, id, context) => {
      if (context?.previousAlerts && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousAlerts);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.unread() });
    }
  });
}

/**
 * Fetch opportunities
 */
export function useOpportunities(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  
  return useQuery({
    queryKey: queryKeys.opportunities.list(filters),
    queryFn: async () => {
      const response = await apiCall(`/advisor/opportunities?${queryParams}`);
      return response.data || response;
    },
    ...getCacheStrategy('opportunities')
  });
}

/**
 * Fetch documents
 */
export function useDocuments(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  
  return useQuery({
    queryKey: queryKeys.documents.list(filters),
    queryFn: async () => {
      const response = await apiCall(`/advisor/documents?${queryParams}`);
      return response.data || response;
    },
    ...getCacheStrategy('documents')
  });
}

/**
 * Fetch campaigns
 */
export function useCampaigns(filters = {}) {
  const queryParams = new URLSearchParams(filters).toString();
  
  return useQuery({
    queryKey: queryKeys.campaigns.list(filters),
    queryFn: async () => {
      const response = await apiCall(`/advisor/campaigns?${queryParams}`);
      return response.data || response;
    },
    ...getCacheStrategy('campaigns')
  });
}

/**
 * Fetch team KPIs (for managers)
 */
export function useTeamKPIs() {
  return useQuery({
    queryKey: queryKeys.management.teamKpi(),
    queryFn: async () => {
      const response = await apiCall('/management/team/kpi');
      return response.data || response;
    },
    ...getCacheStrategy('management')
  });
}

/**
 * Fetch team advisors (for managers)
 */
export function useTeamAdvisors() {
  return useQuery({
    queryKey: queryKeys.management.advisors(),
    queryFn: async () => {
      const response = await apiCall('/management/team/advisors');
      return response.data || response;
    },
    ...getCacheStrategy('management')
  });
}

/**
 * Invalidate all dashboard data
 */
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();
  
  return () => {
    cacheInvalidation.invalidateDashboard(queryClient);
  };
}
