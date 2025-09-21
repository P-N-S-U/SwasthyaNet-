'use server';
/**
 * @fileOverview A flow to generate doctor search suggestions.
 *
 * - getDoctorSearchSuggestions - A function that returns a list of suggestions.
 * - DoctorSuggestionsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DoctorSuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe(
      'A list of 4 creative and varied search suggestions for finding a doctor. Include a mix of specializations (e.g., "Pediatrician", "Oncology") and example doctor names (e.g., "Dr. Priya Sharma").'
    ),
});

export type DoctorSuggestionsOutput = z.infer<
  typeof DoctorSuggestionsOutputSchema
>;

export async function getDoctorSearchSuggestions(): Promise<DoctorSuggestionsOutput> {
  return doctorSuggestionFlow();
}

const suggestionPrompt = ai.definePrompt({
  name: 'doctorSuggestionPrompt',
  output: { schema: DoctorSuggestionsOutputSchema },
  prompt: `You are an AI assistant for a healthcare app. Your task is to generate a list of 4 creative and varied search suggestions for a user looking to find a doctor.

  The suggestions should be a mix of:
  1.  Common medical specializations.
  2.  More niche medical specializations.
  3.  Plausible Indian doctor names as examples.

  Return the suggestions in the 'suggestions' array.`,
});

const doctorSuggestionFlow = ai.defineFlow(
  {
    name: 'doctorSuggestionFlow',
    outputSchema: DoctorSuggestionsOutputSchema,
  },
  async () => {
    const { output } = await suggestionPrompt();
    return output!;
  }
);
