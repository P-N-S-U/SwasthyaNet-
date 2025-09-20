
'use server';

import { collection, query, where, getDocs, or } from 'firebase/firestore';
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
    const q = query(
      usersRef,
      where('role', '==', 'doctor'),
      or(
        where('displayName', '>=', searchQuery),
        where('displayName', '<=', searchQuery + '\uf8ff'),
        where('specialization', '==', searchQuery)
      )
    );

    const querySnapshot = await getDocs(q);
    const doctors = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.displayName,
            specialization: data.specialization || 'Not specified'
        }
    });
    
    // Manual filtering for case-insensitivity on name
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filteredDoctors = doctors.filter(doctor => 
        doctor.name.toLowerCase().includes(lowerCaseQuery) || 
        doctor.specialization.toLowerCase() === lowerCaseQuery
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
