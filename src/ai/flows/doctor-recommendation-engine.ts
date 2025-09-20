
// src/ai/flows/doctor-recommendation-engine.ts
'use server';

/**
 * @fileOverview An AI agent for recommending doctors based on specialization or name.
 *
 * - recommendDoctors - A function that recommends doctors based on a given query.
 * - DoctorRecommendationInput - The input type for the recommendDoctors function.
 * - DoctorRecommendationOutput - The return type for the recommendDoctors function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DoctorRecommendationInputSchema = z.object({
  query: z
    .string()
    .describe(
      'The medical specialization or name of the doctor to search for.'
    ),
});
export type DoctorRecommendationInput = z.infer<
  typeof DoctorRecommendationInputSchema
>;

const DoctorRecommendationOutputSchema = z.object({
  doctors: z
    .array(z.string())
    .describe(
      'A list of recommended doctors based on the provided query.'
    ),
});
export type DoctorRecommendationOutput = z.infer<
  typeof DoctorRecommendationOutputSchema
>;

export async function recommendDoctors(
  input: DoctorRecommendationInput
): Promise<DoctorRecommendationOutput> {
  return doctorRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'doctorRecommendationPrompt',
  input: {schema: DoctorRecommendationInputSchema},
  output: {schema: DoctorRecommendationOutputSchema},
  prompt: `You are an AI assistant designed to recommend doctors based on their specialization or name.

  Given the search query: {{{query}}}
  
  Recommend a list of doctors who match this query. The query could be a medical specialization or a doctor's name.
  Return a JSON array of doctor names.`,
});

const doctorRecommendationFlow = ai.defineFlow(
  {
    name: 'doctorRecommendationFlow',
    inputSchema: DoctorRecommendationInputSchema,
    outputSchema: DoctorRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
