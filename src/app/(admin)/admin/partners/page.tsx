import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adminDb } from '@/lib/firebase/server-auth';
import { collection, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import {
  FileBadge,
  CheckCircle,
  XCircle,
  Clock,
  Building,
} from 'lucide-react';
import { PartnerStatusButtons } from './PartnerStatusButtons';

interface Partner {
  id: string;
  name: string;
  partnerType: string;
  status: 'pending' | 'approved' | 'rejected';
  address: string;
  licenseNumber: string;
  createdAt: Timestamp;
}

async function getPartners(): Promise<Partner[]> {
  const partnersRef = collection(adminDb, 'partners');
  const q = query(partnersRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Partner, 'id'>),
  }));
}

const statusVariantMap = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
};

const StatusIcon = ({ status }: { status: Partner['status'] }) => {
  switch (status) {
    case 'approved':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'pending':
    default:
      return <Clock className="h-4 w-4 text-yellow-500" />;
  }
};

export default async function AdminPartnersPage() {
  const partners = await getPartners();

  return (
    <div className="space-y-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold font-headline">Partner Management</h1>
        <p className="mt-2 text-lg text-foreground/70">
          Review, approve, and manage all partner accounts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline text-2xl">
              All Partners ({partners.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>License #</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.length > 0 ? (
                partners.map(partner => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell className="capitalize">
                      {partner.partnerType.replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileBadge className="h-4 w-4 text-muted-foreground" />
                        {partner.licenseNumber || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {partner.createdAt
                        ? partner.createdAt.toDate().toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariantMap[partner.status]}
                        className="capitalize"
                      >
                        <StatusIcon status={partner.status} />
                        <span className="ml-1.5">{partner.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <PartnerStatusButtons
                        partnerId={partner.id}
                        currentStatus={partner.status}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No partners have registered yet.
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
