
'use server';

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export async function getDoctorRecommendations(
  prevState: any,
  formData: FormData
) {
  const searchQuery = formData.get('query') as string;

  if (!searchQuery || searchQuery.trim().length < 3) {
    return {
      data: null,
      error: 'Please enter a valid search query (e.g., a name or specialization).',
    };
  }

  try {
    const usersRef = collection(db, 'users');
    // Query for all documents where the user is a doctor
    const q = query(usersRef, where('role', '==', 'doctor'));

    const querySnapshot = await getDocs(q);
    const doctors = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.displayName || 'No Name',
        specialization: data.specialization || 'Not specified',
        bio: data.bio || '',
        qualifications: data.qualifications || '',
        experience: data.experience || null,
        clinic: data.clinic || '',
        consultationFee: data.consultationFee || null,
        photoURL: data.photoURL || null,
      };
    });

    // Perform a case-insensitive manual filter on the results
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filteredDoctors = doctors.filter(
      doctor =>
        doctor.name.toLowerCase().includes(lowerCaseQuery) ||
        doctor.specialization.toLowerCase().includes(lowerCaseQuery)
    );

    return { data: { doctors: filteredDoctors }, error: null };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      error:
        'An unexpected error occurred while fetching doctors. Please try again.',
    };
  }
}
