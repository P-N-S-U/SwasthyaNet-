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
  conditions: z
    .string()
    .describe('A list of potential medical conditions related to the symptoms.'),
  actions: z
    .string()
    .describe(
      'Recommended actions based on the symptoms, such as seeking medical advice.'
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

  Please provide a list of potential medical conditions and recommended actions. Be sure to disclaim that this is not medical advice and they should consult a doctor.
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
