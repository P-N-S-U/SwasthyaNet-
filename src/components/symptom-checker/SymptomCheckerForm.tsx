'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { getSymptomAnalysis } from '@/app/symptom-checker/actions';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, HeartPulse, ShieldAlert, AlertCircle, ShieldCheck, Shield, FileText } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

const initialState = {
  data: null,
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
    >
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      Analyze Symptoms
    </Button>
  );
}

const SeverityBadge = ({ severity }: { severity: 'Low' | 'Medium' | 'High' }) => {
    const severityMap = {
        Low: {
            icon: <ShieldCheck className="h-4 w-4" />,
            label: "Low",
            className: "bg-green-500/10 text-green-400 border-green-500/20"
        },
        Medium: {
            icon: <ShieldAlert className="h-4 w-4" />,
            label: "Medium",
            className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
        },
        High: {
            icon: <AlertCircle className="h-4 w-4" />,
            label: "High",
            className: "bg-red-500/10 text-red-400 border-red-500/20"
        }
    }
    const currentSeverity = severityMap[severity];

    return (
        <Badge variant="outline" className={cn("gap-1 pl-1.5", currentSeverity.className)}>
            {currentSeverity.icon}
            {currentSeverity.label}
        </Badge>
    )
}

export function SymptomCheckerForm() {
  const [state, formAction] = useActionState(getSymptomAnalysis, initialState);

  return (
    <div>
      <form action={formAction}>
        <Textarea
          name="symptoms"
          placeholder="e.g., I have a persistent headache, slight fever, and a runny nose for the past 3 days..."
          rows={6}
          className="bg-secondary/50 focus:border-accent"
          required
          minLength={10}
          // The key ensures the component is re-rendered with its default value if there's no state data
          key={state.data ? 'form-submitted' : 'form-initial'}
        />
        <div className="mt-4">
          <SubmitButton />
        </div>
      </form>

      {state.error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.data && (
        <Card className="mt-8 border-primary/20 bg-secondary/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <HeartPulse className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">
                Analysis Results
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
             <div>
              <h3 className="mb-4 text-lg font-bold text-primary/90">
                Your Described Symptoms
              </h3>
               <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                  <p className="text-sm text-muted-foreground italic">"{state.data.originalSymptoms}"</p>
               </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-bold text-primary/90">
                Potential Conditions
              </h3>
              <div className="space-y-4">
                {state.data.potentialConditions.map((condition) => (
                    <div key={condition.name} className="rounded-lg border border-border/50 bg-background/50 p-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{condition.name}</h4>
                            <SeverityBadge severity={condition.severity} />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{condition.description}</p>
                    </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-bold text-primary/90">
                Recommended Actions
              </h3>
              <ol className="list-decimal space-y-2 pl-5 text-foreground/80">
                {state.data.recommendedActions.map((action, index) => (
                    <li key={index}>{action}</li>
                ))}
              </ol>
            </div>
            <Alert
              variant="default"
              className="border-amber-500/50 text-amber-500 [&>svg]:text-amber-500"
            >
              <Shield className="h-4 w-4" />
              <AlertTitle>Important Disclaimer</AlertTitle>
              <AlertDescription>
                {state.data.disclaimer}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
