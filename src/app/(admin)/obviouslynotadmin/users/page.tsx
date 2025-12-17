
import { adminDb } from '@/lib/firebase/server-auth';
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
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Timestamp } from 'firebase-admin/firestore';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface User {
  id: string;
  displayName: string;
  email: string;
  role: 'patient' | 'doctor' | 'partner';
  photoURL?: string;
  createdAt: Timestamp;
}

async function getUsers(): Promise<User[]> {
  const snapshot = await adminDb
    .collection('users')
    .orderBy('createdAt', 'desc')
    .get();
  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<User, 'id'>),
  }));
}

const getInitials = (name: string | null | undefined) => {
  if (!name) return 'U';
  const names = name.split(' ');
  if (names.length > 1) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const UserTable = ({ users }: { users: User[] }) => (
  <Table>
    <TableHeader>
      <TableRow className="border-red-500/30 hover:bg-gray-700/50">
        <TableHead>User</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Member Since</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {users.length > 0 ? (
        users.map(user => (
          <TableRow
            key={user.id}
            className="border-red-500/30 hover:bg-gray-700/50"
          >
            <TableCell className="font-medium">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.photoURL} alt={user.displayName} />
                  <AvatarFallback>
                    {getInitials(user.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span>{user.displayName || 'N/A'}</span>
              </div>
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              {user.createdAt
                ? user.createdAt.toDate().toLocaleDateString()
                : 'N/A'}
            </TableCell>
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={3} className="h-24 text-center">
            No users found in this category.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
);

export default async function UsersPage() {
  const users = await getUsers();
  const patients = users.filter(user => user.role === 'patient');
  const doctors = users.filter(user => user.role === 'doctor');

  return (
    <div className="space-y-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold font-headline text-red-400">
          User Management
        </h1>
        <p className="mt-2 text-lg text-gray-400">
          A list of all users registered on the SwasthyaNet platform.
        </p>
      </div>

      <Card className="border-red-500/20 bg-gray-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-red-400" />
            <CardTitle>All Users</CardTitle>
          </div>
          <CardDescription>
            Browse and manage all registered accounts, separated by role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="patients" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2 md:w-fit">
              <TabsTrigger value="patients">Patients</TabsTrigger>
              <TabsTrigger value="doctors">Doctors</TabsTrigger>
            </TabsList>
            <TabsContent value="patients">
              <UserTable users={patients} />
            </TabsContent>
            <TabsContent value="doctors">
              <UserTable users={doctors} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
