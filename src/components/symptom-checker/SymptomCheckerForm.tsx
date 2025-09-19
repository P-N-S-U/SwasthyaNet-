'use client';

import { useActionState, useFormStatus } from 'react-dom';
import { getSymptomAnalysis } from '@/app/symptom-checker/actions';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, HeartPulse, ShieldAlert } from 'lucide-react';

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
              <h3 className="mb-2 text-lg font-bold text-primary/90">
                Potential Conditions
              </h3>
              <p className="whitespace-pre-wrap text-foreground/80">
                {state.data.conditions}
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-bold text-primary/90">
                Recommended Actions
              </h3>
              <p className="whitespace-pre-wrap text-foreground/80">
                {state.data.actions}
              </p>
            </div>
            <Alert
              variant="default"
              className="border-amber-500/50 text-amber-500 [&>svg]:text-amber-500"
            >
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Important Disclaimer</AlertTitle>
              <AlertDescription>
                This AI-powered analysis is for informational purposes only and
                is not a substitute for professional medical advice, diagnosis,
                or treatment. Always seek the advice of your physician or other
                qualified health provider with any questions you may have

                regarding a medical condition.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
