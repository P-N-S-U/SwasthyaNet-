'use server';

import {
  recommendDoctors,
  DoctorRecommendationInput,
} from '@/ai/flows/doctor-recommendation-engine';

export async function getDoctorRecommendations(
  prevState: any,
  formData: FormData
) {
  const specialization = formData.get('specialization') as string;

  if (!specialization || specialization.trim().length < 3) {
    return {
      data: null,
      error: 'Please enter a valid medical specialization.',
    };
  }

  try {
    const input: DoctorRecommendationInput = { specialization };
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
