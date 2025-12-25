
import { adminDb } from '@/lib/firebase/server-auth';
import type { Timestamp } from 'firebase-admin/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Building,
  Check,
  X,
  Eye,
  FileText,
  BadgeCheck,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { approvePartner, rejectPartner } from './actions';
import Link from 'next/link';

interface Partner {
  id: string;
  name: string;
  email: string;
  partnerType: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  address?: string;
  contact?: string;
  licenseNumber?: string;
  location?: { lat: number; lng: number };
  documents?: { verification?: string };
}

async function getPartners(): Promise<Partner[]> {
  const snapshot = await adminDb
    .collection('partners')
    .orderBy('createdAt', 'desc')
    .get();
  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Partner, 'id'>),
  }));
}

function ActionButtons({ partner }: { partner: Partner }) {
  if (partner.status !== 'pending') {
    return null;
  }

  return (
    <div className="flex gap-2">
      <form action={approvePartner.bind(null, partner.id)}>
        <Button
          size="sm"
          variant="outline"
          className="text-green-500 hover:bg-green-500/10 hover:text-green-400"
        >
          <Check className="mr-2 h-4 w-4" />
          Approve
        </Button>
      </form>
      <form action={rejectPartner.bind(null, partner.id)}>
        <Button
          size="sm"
          variant="outline"
          className="text-red-500 hover:bg-red-500/10 hover:text-red-400"
        >
          <X className="mr-2 h-4 w-4" />
          Reject
        </Button>
      </form>
    </div>
  );
}

const DetailItem = ({ label, value }) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
};

export default async function PartnersPage() {
  const partners = await getPartners();

  const getBadgeVariant = (status: Partner['status']) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold font-headline text-red-400">
          Partner Management
        </h1>
        <p className="mt-2 text-lg text-gray-400">
          Approve or reject new healthcare partner registrations.
        </p>
      </div>

      <Card className="border-red-500/20 bg-gray-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building className="h-6 w-6 text-red-400" />
            <CardTitle>Partner Applications</CardTitle>
          </div>
          <CardDescription>
            A list of all businesses that have registered on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-red-500/30 hover:bg-gray-700/50">
                <TableHead>Business Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.length > 0 ? (
                partners.map(partner => (
                  <TableRow
                    key={partner.id}
                    className="border-red-500/30 hover:bg-gray-700/50"
                  >
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell>{partner.email}</TableCell>
                    <TableCell>
                      {partner.createdAt.toDate().toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(partner.status)}>
                        {partner.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2 text-right">
                      <ActionButtons partner={partner} />
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Eye className="mr-2 h-4 w-4" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-gray-800 text-gray-100">
                          <DialogHeader>
                            <DialogTitle className="font-headline text-2xl text-red-400">
                              {partner.name}
                            </DialogTitle>
                            <DialogDescription className="capitalize">
                              {partner.partnerType.replace('_', ' ')}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-2">
                            <DetailItem label="Contact Email" value={partner.email} />
                            <DetailItem label="Contact Number" value={partner.contact} />
                            <DetailItem label="License Number" value={partner.licenseNumber} />
                            <DetailItem label="Full Address" value={partner.address} />
                          </div>
                          <div className="space-y-4">
                            {partner.location && (
                                <Badge variant="default" className="gap-2 bg-green-600/80">
                                    <MapPin className="h-4 w-4" /> GPS Location Verified
                                </Badge>
                            )}
                            {partner.documents?.verification && (
                              <Button asChild variant="secondary">
                                <Link
                                  href={partner.documents.verification}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <FileText className="mr-2 h-4 w-4" /> View
                                  Uploaded Document
                                </Link>
                              </Button>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No partner applications found.
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
