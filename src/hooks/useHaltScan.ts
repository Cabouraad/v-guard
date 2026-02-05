import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HaltAudit {
  halted_by: string;
  halted_at: string;
  reason: string;
  stage_when_halted: string;
  tasks_canceled: number;
  tasks_completed_before_halt: number;
}

interface UseHaltScanReturn {
  halt: (scanRunId: string, reason: string) => Promise<HaltAudit | null>;
  isHalting: boolean;
}

export function useHaltScan(): UseHaltScanReturn {
  const [isHalting, setIsHalting] = useState(false);

  const halt = async (scanRunId: string, reason: string): Promise<HaltAudit | null> => {
    setIsHalting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Authentication required');
        return null;
      }

      const response = await supabase.functions.invoke('halt-scan', {
        body: { scan_run_id: scanRunId, reason },
      });

      if (response.error) {
        const msg = response.error.message || 'Failed to halt scan';
        toast.error('Halt failed', { description: msg });
        return null;
      }

      const result = response.data as { success: boolean; audit?: HaltAudit; error?: string };

      if (!result.success) {
        toast.error('Halt failed', { description: result.error });
        return null;
      }

      toast.success('Scan halted safely', {
        description: `Stopped at: ${result.audit?.stage_when_halted}`,
      });

      return result.audit || null;
    } catch (err) {
      toast.error('Halt failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
      return null;
    } finally {
      setIsHalting(false);
    }
  };

  return { halt, isHalting };
}
