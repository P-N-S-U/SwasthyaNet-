// src/ai/flows/doctor-recommendation-engine.ts
'use server';

/**
 * @fileOverview An AI agent for recommending doctors based on specialization.
 *
 * - recommendDoctors - A function that recommends doctors based on a given medical specialization.
 * - DoctorRecommendationInput - The input type for the recommendDoctors function.
 * - DoctorRecommendationOutput - The return type for the recommendDoctors function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DoctorRecommendationInputSchema = z.object({
  specialization: z
    .string()
    .describe('The medical specialization for which to recommend doctors.'),
});
export type DoctorRecommendationInput = z.infer<typeof DoctorRecommendationInputSchema>;

const DoctorRecommendationOutputSchema = z.object({
  doctors: z
    .array(z.string())
    .describe(
      'A list of recommended doctors specializing in the specified medical area.'
    ),
});
export type DoctorRecommendationOutput = z.infer<typeof DoctorRecommendationOutputSchema>;

export async function recommendDoctors(
  input: DoctorRecommendationInput
): Promise<DoctorRecommendationOutput> {
  return doctorRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'doctorRecommendationPrompt',
  input: {schema: DoctorRecommendationInputSchema},
  output: {schema: DoctorRecommendationOutputSchema},
  prompt: `You are an AI assistant designed to recommend doctors based on their specialization.

  Given the medical specialization: {{{specialization}}}
  Recommend a list of doctors who specialize in this area.
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
