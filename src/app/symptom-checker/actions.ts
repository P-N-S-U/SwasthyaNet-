'use server';

import {
  checkSymptoms,
  SymptomCheckerInput,
} from '@/ai/flows/ai-symptom-checker';

export async function getSymptomAnalysis(prevState: any, formData: FormData) {
  const symptoms = formData.get('symptoms') as string;

  if (!symptoms || symptoms.trim().length < 10) {
    return {
      data: null,
      error: 'Please provide a more detailed description of your symptoms.',
    };
  }

  try {
    const input: SymptomCheckerInput = { symptoms };
    const result = await checkSymptoms(input);
    return { data: { ...result, originalSymptoms: symptoms }, error: null };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      error: 'An unexpected error occurred. Please try again later.',
    };
  }
}
