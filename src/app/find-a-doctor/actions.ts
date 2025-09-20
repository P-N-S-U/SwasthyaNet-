
'use server';

import {
  recommendDoctors,
  DoctorRecommendationInput,
} from '@/ai/flows/doctor-recommendation-engine';

export async function getDoctorRecommendations(
  prevState: any,
  formData: FormData
) {
  const query = formData.get('query') as string;

  if (!query || query.trim().length < 3) {
    return {
      data: null,
      error: 'Please enter a valid search query (e.g., a name or specialization).',
    };
  }

  try {
    const input: DoctorRecommendationInput = { query };
    const result = await recommendDoctors(input);
    return { data: result, error: null };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      error:
        'An unexpected error occurred while fetching recommendations. Please try again.',
    };
  }
}
