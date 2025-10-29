
'use server';

import { Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/server-auth';
import { getSession } from '@/lib/firebase/server-auth';

export async function bookAppointment(prevState: any, formData: FormData) {
  const session = await getSession();

  if (!session) {
    return { error: 'You must be logged in to book an appointment.' };
  }

  const doctorId = formData.get('doctorId') as string;
  const patientId = session.uid;

  if (!doctorId) {
    return { error: 'Doctor ID is missing.' };
  }

  try {
    // Firestore does not allow compound queries with range filters on different fields
    // without a composite index. To avoid this, we query for confirmed appointments
    // and then filter for future ones in the code.
    const appointmentsRef = adminDb.collection('appointments');
    const q = appointmentsRef
      .where('patientId', '==', patientId)
      .where('doctorId', '==', doctorId)
      .where('status', '==', 'Confirmed');

    const existingAppointmentsSnapshot = await q.get();

    const now = Timestamp.now();
    const hasFutureAppointment = !existingAppointmentsSnapshot.empty && 
      existingAppointmentsSnapshot.docs.some(doc => doc.data().appointmentDate >= now);

    if (hasFutureAppointment) {
      return { error: 'You already have a future confirmed appointment with this doctor.' };
    }

    const patientDocRef = adminDb.collection('users').doc(patientId);
    const doctorDocRef = adminDb.collection('users').doc(doctorId);

    const [patientSnap, doctorSnap] = await Promise.all([
      patientDocRef.get(),
      doctorDocRef.get(),
    ]);

    if (!patientSnap.exists || !doctorSnap.exists) {
      return { error: 'Invalid patient or doctor.' };
    }

    const patientData = patientSnap.data()!;
    const doctorData = doctorSnap.data()!;

    // Schedule for a random time between 40 and 90 minutes from now.
    const randomMinutes = Math.floor(Math.random() * (90 - 40 + 1)) + 40;
    const appointmentDate = new Date();
    appointmentDate.setMinutes(appointmentDate.getMinutes() + randomMinutes);

    const newAppointment = {
      patientId,
      patientName: patientData.displayName || 'Anonymous Patient',
      patientPhotoURL: patientData.photoURL || null,
      doctorId,
      doctorName: doctorData.displayName || 'Anonymous Doctor',
      doctorSpecialization: doctorData.specialization || 'Not Specified',
      appointmentDate: Timestamp.fromDate(appointmentDate),
      status: 'Confirmed',
      createdAt: Timestamp.now(),
    };

    const appointmentRef = await appointmentsRef.add(newAppointment);

    // Revalidate paths to refresh data on the respective pages
    revalidatePath('/patient/appointments');
    revalidatePath('/doctor/schedule');
    revalidatePath('/patient/dashboard');

    return { data: { appointmentId: appointmentRef.id } };
  } catch (error) {
    console.error('Error booking appointment:', error);
    return { error: 'An unexpected error occurred while booking the appointment.' };
  }
}
