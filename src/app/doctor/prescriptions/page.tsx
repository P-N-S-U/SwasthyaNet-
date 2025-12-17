
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import { Loader2, FileText, User, Calendar, Eye } from 'lucide-react';
import {
  collection,
  query,
  where,
  Timestamp,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';

interface Prescription {
  id: string;
  patientName: string;
  doctorName: string;
  diagnosis: string;
  createdAt: Timestamp;
}

const fetcher = async ([path, uid]) => {
  if (!uid) return [];
  const q = query(
    collection(db, path),
    where('doctorId', '==', uid),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Prescription[];
};

export default function PrescriptionsListPage() {
  const { user, loading: authLoading, role } = useAuthState();
  const router = useRouter();

  const { data: prescriptions, isLoading: pageLoading } = useSWR(
    user ? ['prescriptions', user.uid] : null,
    fetcher
  );

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/auth');
      } else if (role && role !== 'doctor') {
        router.replace('/patient/dashboard');
      }
    }
  }, [user, authLoading, role, router]);

  if (authLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Verifying access...</p>
      </div>
    );
  }

  const TableSkeleton = () =>
    [...Array(5)].map((_, i) => (
      <TableRow key={i}>
        <TableCell>
          <Skeleton className="h-5 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-48" />
        </TableCell>
        <TableCell className="text-right">
          <Skeleton className="ml-auto h-8 w-28" />
        </TableCell>
      </TableRow>
    ));

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold font-headline">My Prescriptions</h1>
        <p className="mt-2 text-lg text-foreground/70">
          A record of all prescriptions you have issued.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">
                Issued Prescriptions
              </CardTitle>
            </div>
            <Button asChild>
                <Link href="/doctor/prescriptions/new">Write New Prescription</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Issued</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageLoading ? (
                <TableSkeleton />
              ) : prescriptions && prescriptions.length > 0 ? (
                prescriptions.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">{p.patientName}</TableCell>
                    <TableCell>{p.diagnosis}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/patient/prescriptions/${p.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    You haven't issued any prescriptions yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
