
'use server';

import {
  collection,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/firebase';
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
    // Check for existing confirmed appointments with this doctor
    const appointmentsRef = collection(db, 'appointments');
    const q = query(
      appointmentsRef,
      where('patientId', '==', patientId),
      where('doctorId', '==', doctorId),
      where('status', '==', 'Confirmed'),
      limit(1)
    );

    const existingAppointments = await getDocs(q);

    if (!existingAppointments.empty) {
      return { error: 'You already have a confirmed appointment with this doctor.' };
    }

    const patientDocRef = doc(db, 'users', patientId);
    const doctorDocRef = doc(db, 'users', doctorId);

    const [patientSnap, doctorSnap] = await Promise.all([
      getDoc(patientDocRef),
      getDoc(doctorDocRef),
    ]);

    if (!patientSnap.exists() || !doctorSnap.exists()) {
      return { error: 'Invalid patient or doctor.' };
    }

    const patientData = patientSnap.data();
    const doctorData = doctorSnap.data();

    // For now, let's schedule it for 24 hours from now.
    // A real app would have a calendar to pick a slot.
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 1);

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

    const appointmentRef = await addDoc(collection(db, 'appointments'), newAppointment);

    // Revalidate paths to refresh data on the respective pages
    revalidatePath('/patient/appointments');
    revalidatePath('/doctor/schedule');

    return { data: { appointmentId: appointmentRef.id } };
  } catch (error) {
    console.error('Error booking appointment:', error);
    return { error: 'An unexpected error occurred while booking the appointment.' };
  }
}
