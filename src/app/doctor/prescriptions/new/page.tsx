
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import useSWR from 'swr';
import { db } from '@/lib/firebase/firebase';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PrescriptionForm } from '@/components/doctor/PrescriptionForm';
import { useAuthState } from '@/hooks/use-auth-state';

const appointmentFetcher = async ([, appointmentId]) => {
  if (!appointmentId) return null;
  const apptDocRef = doc(db, 'appointments', appointmentId);
  const apptSnap = await getDoc(apptDocRef);
  if (!apptSnap.exists()) {
    throw new Error('Appointment not found');
  }
  return { id: apptSnap.id, ...apptSnap.data() };
};

const existingPrescriptionFetcher = async ([, appointmentId, doctorId]) => {
    if (!appointmentId || !doctorId) return null;

    const prescriptionDocRef = doc(db, 'prescriptions', appointmentId);
    const prescriptionSnap = await getDoc(prescriptionDocRef);
    
    if (!prescriptionSnap.exists()) {
        return null; // No existing prescription is a valid state
    }
    
    const data = prescriptionSnap.data();

    // Client-side check to ensure we don't process data we shouldn't have access to
    if (data.doctorId !== doctorId) {
        throw new Error('You do not have permission to view this prescription.');
    }
    
    return { id: prescriptionSnap.id, ...data };
}

function NewPrescriptionPage() {
  const { user } = useAuthState();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');

  const {
    data: appointment,
    isLoading: appointmentLoading,
    error: appointmentError,
  } = useSWR(
    appointmentId ? ['appointment', appointmentId] : null,
    appointmentFetcher
  );

  const {
      data: existingPrescription,
      isLoading: prescriptionLoading,
      error: prescriptionError,
  } = useSWR(
      appointmentId && user?.uid ? ['prescription', appointmentId, user.uid] : null,
      existingPrescriptionFetcher
  );


  if (!appointmentId) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Error</h1>
        <p>No appointment specified. Please go back and select an appointment.</p>
      </div>
    );
  }

  const isLoading = appointmentLoading || prescriptionLoading;
  const error = appointmentError || prescriptionError;

  return (
    <div>
      <div className="mb-10">
        <Button asChild variant="outline" size="sm" className="mb-6">
          <Link href="/doctor/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-4xl font-bold font-headline">
          {existingPrescription ? 'Edit Prescription' : 'New Prescription'}
        </h1>
        {isLoading ? (
            <p className="mt-2 text-lg text-foreground/70 animate-pulse">Loading patient details...</p>
        ) : (
            <p className="mt-2 text-lg text-foreground/70">
              For patient: {appointment?.patientName || '...'}
            </p>
        )}
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="text-destructive">
          Error loading data: {error.message}
        </div>
      )}

      {!isLoading && !error && appointment && (
        <PrescriptionForm
          appointment={appointment}
          existingPrescription={existingPrescription}
        />
      )}
    </div>
  );
}


export default function NewPrescriptionSuspenseWrapper() {
    return (
        <Suspense fallback={
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        }>
            <NewPrescriptionPage />
        </Suspense>
    )
}
