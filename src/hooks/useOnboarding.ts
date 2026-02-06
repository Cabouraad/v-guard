import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface OnboardingStep {
  key: StepKey;
  label: string;
  description: string;
  optional?: boolean;
}

type StepKey =
  | 'step_confirmed_safety'
  | 'step_add_application'
  | 'step_authorize_scan'
  | 'step_review_findings'
  | 'step_adjust_controls';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    key: 'step_confirmed_safety',
    label: 'Confirm Safety Mode',
    description: 'Scans start in READ-ONLY mode by default to protect production systems.',
  },
  {
    key: 'step_add_application',
    label: 'Add an Application',
    description: 'Provide a URL or environment you want to analyze.',
  },
  {
    key: 'step_authorize_scan',
    label: 'Authorize a Scan',
    description: 'Scans run only after explicit authorization and within defined limits.',
  },
  {
    key: 'step_review_findings',
    label: 'Review Findings',
    description: 'Security and load results are correlated and evidence-backed.',
  },
  {
    key: 'step_adjust_controls',
    label: 'Adjust Scan Controls',
    description: 'Advanced testing is available but intentionally gated.',
    optional: true,
  },
];

interface OnboardingProgress {
  step_confirmed_safety: boolean;
  step_add_application: boolean;
  step_authorize_scan: boolean;
  step_review_findings: boolean;
  step_adjust_controls: boolean;
  completed: boolean;
  dismissed: boolean;
}

const DEFAULT_PROGRESS: OnboardingProgress = {
  step_confirmed_safety: false,
  step_add_application: false,
  step_authorize_scan: false,
  step_review_findings: false,
  step_adjust_controls: false,
  completed: false,
  dismissed: false,
};

export function useOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isVisible, setIsVisible] = useState(false);

  // Fetch onboarding progress
  const { data: progress, isLoading } = useQuery({
    queryKey: ['onboarding-progress', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('onboarding_progress' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as (OnboardingProgress & { id: string; user_id: string }) | null;
    },
    enabled: !!user,
  });

  // Check if user has any scans (to determine if truly new)
  const { data: hasScanRuns } = useQuery({
    queryKey: ['has-scan-runs', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { count, error } = await supabase
        .from('scan_runs')
        .select('id', { count: 'exact', head: true });
      if (error) return false;
      return (count ?? 0) > 0;
    },
    enabled: !!user,
  });

  // Check if user has projects
  const { data: hasProjects } = useQuery({
    queryKey: ['has-projects', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { count, error } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true });
      if (error) return false;
      return (count ?? 0) > 0;
    },
    enabled: !!user,
  });

  // Determine visibility
  useEffect(() => {
    if (!user || isLoading) return;

    // If completed onboarding, hide unless explicitly reopened
    if (progress?.completed) {
      setIsVisible(false);
      return;
    }

    // If dismissed, hide
    if (progress?.dismissed) {
      setIsVisible(false);
      return;
    }

    // Show for new users (no progress record or incomplete)
    setIsVisible(true);
  }, [user, progress, isLoading]);

  // Upsert progress mutation
  const upsertMutation = useMutation({
    mutationFn: async (updates: Partial<OnboardingProgress>) => {
      if (!user) throw new Error('No user');

      const { data: existing } = await supabase
        .from('onboarding_progress' as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('onboarding_progress' as any)
          .update(updates)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('onboarding_progress' as any)
          .insert({ user_id: user.id, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
    },
  });

  const completeStep = useCallback(
    (stepKey: StepKey) => {
      if (!user) return;
      if (progress?.[stepKey]) return; // Already done

      upsertMutation.mutate({ [stepKey]: true });
    },
    [user, progress, upsertMutation]
  );

  const dismiss = useCallback(() => {
    upsertMutation.mutate({ dismissed: true });
    setIsVisible(false);
  }, [upsertMutation]);

  const reopen = useCallback(() => {
    upsertMutation.mutate({ dismissed: false });
    setIsVisible(true);
  }, [upsertMutation]);

  const markComplete = useCallback(() => {
    upsertMutation.mutate({ completed: true });
    setIsVisible(false);
  }, [upsertMutation]);

  // Derive current step states with live data overrides
  const stepStates: Record<StepKey, boolean> = {
    step_confirmed_safety: progress?.step_confirmed_safety ?? false,
    step_add_application: progress?.step_add_application || (hasProjects ?? false),
    step_authorize_scan: progress?.step_authorize_scan || (hasScanRuns ?? false),
    step_review_findings: progress?.step_review_findings ?? false,
    step_adjust_controls: progress?.step_adjust_controls ?? false,
  };

  const completedCount = Object.values(stepStates).filter(Boolean).length;
  const totalSteps = ONBOARDING_STEPS.length;
  const allRequiredDone = stepStates.step_confirmed_safety &&
    stepStates.step_add_application &&
    stepStates.step_authorize_scan &&
    stepStates.step_review_findings;

  // Auto-complete when all required steps done
  useEffect(() => {
    if (allRequiredDone && !progress?.completed && user) {
      // Wait a beat so the UI can show the final checkmark
      const timeout = setTimeout(() => {
        markComplete();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [allRequiredDone, progress?.completed, user, markComplete]);

  // Sync live data back to DB when it changes
  useEffect(() => {
    if (!user || isLoading) return;
    if (hasProjects && !progress?.step_add_application) {
      upsertMutation.mutate({ step_add_application: true });
    }
  }, [hasProjects, progress?.step_add_application, user, isLoading]);

  useEffect(() => {
    if (!user || isLoading) return;
    if (hasScanRuns && !progress?.step_authorize_scan) {
      upsertMutation.mutate({ step_authorize_scan: true });
    }
  }, [hasScanRuns, progress?.step_authorize_scan, user, isLoading]);

  return {
    steps: ONBOARDING_STEPS,
    stepStates,
    completedCount,
    totalSteps,
    isVisible,
    isLoading,
    isCompleted: progress?.completed ?? false,
    isDismissed: progress?.dismissed ?? false,
    allRequiredDone,
    completeStep,
    dismiss,
    reopen,
    markComplete,
  };
}
