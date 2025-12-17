'use server';

import { z } from 'zod';
import { adminDb } from '@/lib/firebase/server-auth';
import { getSession } from '@/lib/firebase/server-auth';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import {
  generatePrescription as generatePrescriptionFlow,
  PrescriptionGeneratorInputSchema,
  PrescriptionGeneratorOutputSchema
} from '@/ai/flows/prescription-generator';


const MedicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required.'),
  dosage: z.string().min(1, 'Dosage is required.'),
  frequency: z.string().min(1, 'Frequency is required.'),
  duration: z.string().min(1, 'Duration is required.'),
  notes: z.string().optional(),
});

const CreatePrescriptionSchema = z.object({
  appointmentId: z.string(),
  patientId: z.string(),
  patientName: z.string(),
  doctorId: z.string(),
  doctorName: z.string(),
  diagnosis: z.string().min(3, 'Diagnosis is required.'),
  medications: z.array(MedicationSchema).min(1, 'At least one medication is required.'),
  advice: z.string().optional(),
  followUp: z.string().optional(),
});

export async function savePrescription(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'Authentication required.' };
  }

  const medicationsData = JSON.parse(formData.get('medications') as string);

  const validatedFields = CreatePrescriptionSchema.safeParse({
    appointmentId: formData.get('appointmentId'),
    patientId: formData.get('patientId'),
    patientName: formData.get('patientName'),
    doctorId: session.uid,
    doctorName: session.name,
    diagnosis: formData.get('diagnosis'),
    medications: medicationsData,
    advice: formData.get('advice'),
    followUp: formData.get('followUp'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const prescriptionRef = adminDb.collection('prescriptions').doc(validatedFields.data.appointmentId);
    
    await prescriptionRef.set({
      ...validatedFields.data,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Also update the appointment to note that a prescription has been issued.
    const appointmentRef = adminDb.collection('appointments').doc(validatedFields.data.appointmentId);
    await appointmentRef.update({ hasPrescription: true });

    revalidatePath(`/patient/appointments`);
    revalidatePath(`/doctor/prescriptions/${validatedFields.data.appointmentId}`);

    return { success: true, message: 'Prescription saved successfully.' };
  } catch (error) {
    console.error("Error saving prescription:", error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}


export async function generatePrescription(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { data: null, error: 'Authentication required.' };
  }

  const validatedFields = PrescriptionGeneratorInputSchema.safeParse({
    diagnosis: formData.get('diagnosis'),
    notes: formData.get('notes'),
  });

  if (!validatedFields.success) {
    return {
      data: null,
      error: 'Invalid input for AI generation.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await generatePrescriptionFlow(validatedFields.data);
    return { data: result, error: null };
  } catch(e) {
    console.error("Error generating prescription with AI:", e);
    return { data: null, error: 'Failed to generate AI suggestion. Please try again.' };
  }
}
