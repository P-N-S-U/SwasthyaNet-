
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RecentPatient } from '@/app/doctor/dashboard/page';
import { User } from 'lucide-react';

const getInitials = (name: string | null | undefined) => {
  if (!name) return 'U';
  const names = name.split(' ');
  if (names.length > 1) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export function RecentPatients({ patients }: { patients: RecentPatient[] }) {

  if (patients.length === 0) {
    return <p className="text-sm text-muted-foreground">No recent patients found.</p>
  }
  
  return (
    <div className="space-y-6">
      {patients.map((patient) => (
        <div key={patient.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={patient.photoURL || undefined} alt={patient.name} />
            <AvatarFallback>
              {getInitials(patient.name)}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{patient.name}</p>
          </div>
          <div className="ml-auto font-medium">
             <User className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      ))}
    </div>
  );
}

    