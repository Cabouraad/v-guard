import { ChevronRight, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ScanFinding } from '@/types/database';
import { useState } from 'react';
import { toast } from 'sonner';

interface FindingCardProps {
  finding: ScanFinding;
  className?: string;
}

export function FindingCard({ finding, className }: FindingCardProps) {
  const [expanded, setExpanded] = useState(false);

  const copyLovablePrompt = () => {
    if (finding.lovable_fix_prompt) {
      navigator.clipboard.writeText(finding.lovable_fix_prompt);
      toast.success('Fix prompt copied to clipboard!');
    }
  };

  // Helper to render evidence - handle both string and object types
  const renderEvidence = () => {
    if (!finding.evidence_redacted) return null;
    
    if (typeof finding.evidence_redacted === 'string') {
      return finding.evidence_redacted;
    }
    
    return JSON.stringify(finding.evidence_redacted, null, 2);
  };

  // Get affected endpoint from endpoint or first affected_targets entry
  const affectedEndpoint = finding.endpoint || 
    (finding.affected_targets && finding.affected_targets.length > 0 ? finding.affected_targets[0] : null);

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md border-l-4",
      finding.severity === 'critical' && "border-l-severity-critical",
      finding.severity === 'high' && "border-l-severity-high",
      finding.severity === 'medium' && "border-l-severity-medium",
      finding.severity === 'low' && "border-l-severity-low",
      finding.severity === 'info' && "border-l-severity-info",
      finding.severity === 'not_tested' && "border-l-muted",
      className
    )}>
      <CardHeader 
        className="cursor-pointer py-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <SeverityBadge severity={finding.severity} />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                {finding.category}
              </span>
            </div>
            <h3 className="font-semibold text-foreground">{finding.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {finding.description}
            </p>
          </div>
          <ChevronRight className={cn(
            "w-5 h-5 text-muted-foreground transition-transform",
            expanded && "rotate-90"
          )} />
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {affectedEndpoint && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Affected Endpoint
              </h4>
              <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                {affectedEndpoint}
              </code>
            </div>
          )}

          {finding.affected_targets && finding.affected_targets.length > 1 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                All Affected Targets
              </h4>
              <ul className="space-y-1">
                {finding.affected_targets.map((target, i) => (
                  <li key={i}>
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                      {target}
                    </code>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {finding.evidence_redacted && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Evidence (Redacted)
              </h4>
              <pre className="text-sm bg-muted p-3 rounded-lg overflow-x-auto font-mono">
                {renderEvidence()}
              </pre>
            </div>
          )}

          {finding.impact && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Impact
              </h4>
              <p className="text-sm text-foreground">{finding.impact}</p>
            </div>
          )}

          {finding.repro_steps && finding.repro_steps.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Reproduction Steps
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {finding.repro_steps.map((step, i) => (
                  <li key={i} className="text-muted-foreground">{step}</li>
                ))}
              </ol>
            </div>
          )}

          {finding.fix_recommendation && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Recommended Fix
              </h4>
              <p className="text-sm text-foreground">{finding.fix_recommendation}</p>
            </div>
          )}

          {finding.lovable_fix_prompt && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-primary uppercase tracking-wider">
                  Lovable Fix Prompt
                </h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={copyLovablePrompt}
                  className="gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </Button>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-sm text-foreground font-mono">
                  {finding.lovable_fix_prompt}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}