// Symptom checker flow provides potential conditions and recommended actions based on symptoms.
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SymptomCheckerInputSchema = z.object({
  symptoms: z
    .string()
    .describe('A detailed description of the patient\'s symptoms.'),
});

export type SymptomCheckerInput = z.infer<typeof SymptomCheckerInputSchema>;

const SymptomCheckerOutputSchema = z.object({
  potentialConditions: z
    .array(
      z.object({
        name: z
          .string()
          .describe('The name of the potential medical condition.'),
        description: z
          .string()
          .describe(
            'A brief description of why this condition might be relevant to the symptoms.'
          ),
        severity: z
          .enum(['Low', 'Medium', 'High'])
          .describe('The potential severity of the condition.'),
      })
    )
    .describe(
      'A list of potential medical conditions, ranked from most to least likely.'
    ),
  recommendedActions: z
    .array(z.string())
    .describe('A list of recommended next steps for the user.'),
  disclaimer: z
    .string()
    .describe(
      'A standard disclaimer that this is not medical advice and the user should consult a doctor.'
    ),
});

export type SymptomCheckerOutput = z.infer<typeof SymptomCheckerOutputSchema>;

export async function checkSymptoms(
  input: SymptomCheckerInput
): Promise<SymptomCheckerOutput> {
  return symptomCheckerFlow(input);
}

const symptomCheckerPrompt = ai.definePrompt({
  name: 'symptomCheckerPrompt',
  input: {schema: SymptomCheckerInputSchema},
  output: {schema: SymptomCheckerOutputSchema},
  prompt: `You are an AI chatbot designed to provide preliminary information about potential medical conditions based on a patient's described symptoms.

  Based on the following symptoms: {{{symptoms}}}

  Please provide a list of potential medical conditions and recommended actions. Be sure to include the standard medical disclaimer.
  `,
});

const symptomCheckerFlow = ai.defineFlow(
  {
    name: 'symptomCheckerFlow',
    inputSchema: SymptomCheckerInputSchema,
    outputSchema: SymptomCheckerOutputSchema,
  },
  async input => {
    const {output} = await symptomCheckerPrompt(input);
    return output!;
  }
);
