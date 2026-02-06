import { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronRight, X, ListChecks, Shield, CircleDot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useOnboarding, type OnboardingStep } from '@/hooks/useOnboarding';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function OnboardingChecklist() {
  const {
    steps,
    stepStates,
    completedCount,
    totalSteps,
    isVisible,
    isLoading,
    allRequiredDone,
    isCompleted,
    dismiss,
  } = useOnboarding();

  const [isOpen, setIsOpen] = useState(true);

  // Auto-collapse when all done
  useEffect(() => {
    if (allRequiredDone) {
      const timeout = setTimeout(() => setIsOpen(false), 1500);
      return () => clearTimeout(timeout);
    }
  }, [allRequiredDone]);

  if (!isVisible || isLoading) return null;

  const progressPercent = (completedCount / totalSteps) * 100;

  return (
    <div className="w-80 shrink-0">
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-xs flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-primary" />
                SETUP CHECKLIST
              </CardTitle>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                  {completedCount}/{totalSteps}
                </Badge>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    {isOpen ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={dismiss}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <Progress value={progressPercent} className="h-1 mt-2" />
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-1">
              {allRequiredDone && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-primary/10 border border-primary/20 mb-3">
                  <Shield className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-xs font-mono text-primary">
                    Initial setup complete. You're ready to operate.
                  </p>
                </div>
              )}

              {steps.map((step, index) => (
                <StepItem
                  key={step.key}
                  step={step}
                  index={index}
                  completed={stepStates[step.key]}
                />
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}

function StepItem({
  step,
  index,
  completed,
}: {
  step: OnboardingStep;
  index: number;
  completed: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <button
      onClick={() => setIsExpanded(!isExpanded)}
      className={cn(
        "w-full text-left flex items-start gap-3 p-2 rounded-md transition-colors",
        "hover:bg-muted/50",
        completed && "opacity-70"
      )}
    >
      {/* Status indicator */}
      <div className="mt-0.5 shrink-0">
        {completed ? (
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-3 h-3 text-primary-foreground" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
            <span className="text-[10px] font-mono text-muted-foreground">
              {index + 1}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-xs font-medium",
              completed ? "line-through text-muted-foreground" : "text-foreground"
            )}
          >
            {step.label}
          </span>
          {step.optional && (
            <Badge variant="outline" className="text-[8px] px-1 py-0 leading-tight">
              OPT
            </Badge>
          )}
        </div>
        {(isExpanded || !completed) && (
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            {step.description}
          </p>
        )}
      </div>
    </button>
  );
}
