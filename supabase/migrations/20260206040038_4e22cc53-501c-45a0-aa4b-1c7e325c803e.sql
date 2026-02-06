
-- Create onboarding_progress table for per-user checklist persistence
CREATE TABLE public.onboarding_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  step_confirmed_safety boolean NOT NULL DEFAULT false,
  step_add_application boolean NOT NULL DEFAULT false,
  step_authorize_scan boolean NOT NULL DEFAULT false,
  step_review_findings boolean NOT NULL DEFAULT false,
  step_adjust_controls boolean NOT NULL DEFAULT false,
  completed boolean NOT NULL DEFAULT false,
  dismissed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT onboarding_progress_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own onboarding progress
CREATE POLICY "Users can view their own onboarding progress"
ON public.onboarding_progress
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own onboarding progress
CREATE POLICY "Users can insert their own onboarding progress"
ON public.onboarding_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own onboarding progress
CREATE POLICY "Users can update their own onboarding progress"
ON public.onboarding_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_onboarding_progress_updated_at
BEFORE UPDATE ON public.onboarding_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
