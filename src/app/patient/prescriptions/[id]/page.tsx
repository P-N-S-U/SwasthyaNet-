'use client';

import { useAuthState } from '@/hooks/use-auth-state';
import useSWR from 'swr';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Loader2, ArrowLeft, Download, Stethoscope, User, Calendar, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PharmacyFinder } from '@/components/patient/PharmacyFinder';

const prescriptionFetcher = async ([, prescriptionId, userId]) => {
  if (!prescriptionId || !userId) return null;
  const docRef = doc(db, 'prescriptions', prescriptionId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Prescription not found.');
  }
  
  const data = docSnap.data();

  // Security check: allow access if the user is either the patient or the doctor on the prescription
  if (data.patientId !== userId && data.doctorId !== userId) {
      throw new Error('You do not have permission to view this prescription.');
  }

  return { id: docSnap.id, ...data };
};

export default function ViewPrescriptionPage({ params }: { params: { id: string } }) {
  const { user, role, loading: authLoading } = useAuthState();
  const router = useRouter();

  const { data: prescription, isLoading, error } = useSWR(
    user ? ['prescription', params.id, user.uid] : null,
    prescriptionFetcher
  );
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth');
    }
  }, [user, authLoading, router]);

  const getBackLink = () => {
      if (role === 'doctor') {
          return '/doctor/prescriptions';
      }
      return '/patient/appointments';
  }

  if (isLoading || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12">
        <h1 className="text-2xl font-bold text-destructive">Error</h1>
        <p>{error.message}</p>
         <Button asChild variant="outline" size="sm" className="mt-6">
            <Link href={getBackLink()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Link>
        </Button>
      </div>
    );
  }

  const apptDate = prescription.appointmentDate?.toDate()?.toLocaleDateString() || 'N/A';

  const PrescriptionSkeleton = () => (
      <div className="max-w-4xl mx-auto p-8 bg-background shadow-lg rounded-lg border">
          <Skeleton className="h-8 w-1/2 mb-2"/>
          <Skeleton className="h-4 w-1/4 mb-8"/>
          <div className="grid grid-cols-2 gap-8 mb-8">
              <Skeleton className="h-20"/>
              <Skeleton className="h-20"/>
          </div>
          <Skeleton className="h-24 mb-8"/>
          <Skeleton className="h-40 mb-8"/>
          <div className="grid grid-cols-2 gap-8">
            <Skeleton className="h-20"/>
            <Skeleton className="h-20"/>
          </div>
      </div>
  )

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="container">
        <div className="flex justify-between items-center mb-8">
          <Button asChild variant="outline" size="sm">
            <Link href={getBackLink()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                 <Button variant="default" disabled={role === 'doctor'}>
                    <Send className="mr-2 h-4 w-4" />
                    Send to Pharmacy
                 </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Forward Prescription to a Pharmacy</DialogTitle>
                </DialogHeader>
                <div className="flex-grow overflow-hidden">
                  <PharmacyFinder prescriptionId={prescription.id} />
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" disabled>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        {isLoading ? <PrescriptionSkeleton/> : (
        <Card className="w-full max-w-4xl mx-auto border-border/30 bg-background shadow-2xl">
          <CardHeader className="bg-secondary/50 p-6 rounded-t-lg">
             <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                     <FileText className="h-8 w-8 text-primary" />
                    <CardTitle className="text-3xl font-headline">Prescription</CardTitle>
                  </div>
                  <p className="text-muted-foreground">Issued on {prescription.createdAt?.toDate()?.toLocaleDateString()}</p>
                </div>
                <Badge variant="secondary">Appointment ID: {prescription.id}</Badge>
             </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg bg-secondary/50 p-4 space-y-2">
                    <h3 className="font-semibold text-muted-foreground flex items-center gap-2"><User/> Patient Details</h3>
                    <p><span className="font-bold">Name:</span> {prescription.patientName}</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4 space-y-2">
                    <h3 className="font-semibold text-muted-foreground flex items-center gap-2"><Stethoscope/> Doctor Details</h3>
                    <p><span className="font-bold">Name:</span> {prescription.doctorName}</p>
                    <p><span className="font-bold">Date:</span> {apptDate}</p>
                </div>
            </div>

            <div className="rounded-lg bg-secondary/50 p-4">
                 <h3 className="font-semibold text-muted-foreground mb-2">Diagnosis</h3>
                 <p className="font-bold text-lg">{prescription.diagnosis}</p>
            </div>

            <div>
              <h3 className="text-xl font-bold font-headline mb-4">Medications</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescription.medications.map((med, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{med.name}</TableCell>
                      <TableCell>{med.dosage}</TableCell>
                      <TableCell>{med.frequency}</TableCell>
                      <TableCell>{med.duration}</TableCell>
                      <TableCell>{med.notes || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {prescription.advice && (
                    <div className="rounded-lg bg-secondary/50 p-4">
                        <h3 className="font-semibold text-muted-foreground mb-2">General Advice</h3>
                        <p>{prescription.advice}</p>
                    </div>
                )}
                 {prescription.followUp && (
                    <div className="rounded-lg bg-secondary/50 p-4">
                        <h3 className="font-semibold text-muted-foreground mb-2">Follow-up</h3>
                        <p>{prescription.followUp}</p>
                    </div>
                )}
            </div>

          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
