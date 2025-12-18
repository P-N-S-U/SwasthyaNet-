'use server';
/**
 * @fileOverview An AI flow for generating prescription suggestions.
 *
 * - generatePrescription - A function that suggests medications based on a diagnosis.
 * - PrescriptionGeneratorInput - The input type for the function.
 * - PrescriptionGeneratorOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MedicationSchema = z.object({
  name: z.string().describe('The name of the medication.'),
  dosage: z
    .string()
    .describe('The dosage of the medication, e.g., "500mg", "1 tablet".'),
  frequency: z
    .string()
    .describe('How often the medication should be taken, e.g., "Twice a day".'),
  duration: z
    .string()
    .describe(
      'For how long the medication should be taken, e.g., "7 days", "As needed".'
    ),
  notes: z
    .string()
    .optional()
    .describe('Additional notes, e.g., "Take after meals".'),
});

const PrescriptionGeneratorInputSchema = z.object({
  diagnosis: z
    .string()
    .describe("The doctor's diagnosis or chief complaint of the patient."),
  notes: z
    .string()
    .optional()
    .describe('Any additional notes about the patient or their symptoms.'),
});
export type PrescriptionGeneratorInput = z.infer<
  typeof PrescriptionGeneratorInputSchema
>;

const PrescriptionGeneratorOutputSchema = z.object({
  medications: z
    .array(MedicationSchema)
    .describe('A list of suggested medications.'),
  advice: z
    .string()
    .describe('General advice for the patient, e.g., "Rest and drink fluids".'),
  followUp: z
    .string()
    .describe('When the patient should follow up, e.g., "In 3 days if no improvement".'),
});
export type PrescriptionGeneratorOutput = z.infer<
  typeof PrescriptionGeneratorOutputSchema
>;

export async function generatePrescription(
  input: PrescriptionGeneratorInput
): Promise<PrescriptionGeneratorOutput> {
  return prescriptionGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'prescriptionGeneratorPrompt',
  input: { schema: PrescriptionGeneratorInputSchema },
  output: { schema: PrescriptionGeneratorOutputSchema },
  prompt: `You are an expert medical AI assisting a qualified doctor in writing a prescription.
  
  Based on the doctor's diagnosis and notes, suggest a standard course of treatment.
  Provide a list of common medications, general advice, and a follow-up recommendation.

  IMPORTANT: This is a tool for a professional. Use standard medical terminology. Do not include any disclaimers or warnings in your output.

  Diagnosis: {{{diagnosis}}}
  Notes: {{{notes}}}
  `,
});

const prescriptionGeneratorFlow = ai.defineFlow(
  {
    name: 'prescriptionGeneratorFlow',
    inputSchema: PrescriptionGeneratorInputSchema,
    outputSchema: PrescriptionGeneratorOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
