
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { recentPatients } from '@/lib/data';

export function RecentPatients() {
  return (
    <div className="space-y-6">
      {recentPatients.map((patient, index) => (
        <div key={index} className="flex items-center">
          <Avatar className="h-9 w-9">
             {patient.image && (
                <AvatarImage src={patient.image.imageUrl} alt={patient.name} />
             )}
            <AvatarFallback>{patient.avatarFallback}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{patient.name}</p>
            <p className="text-xs text-muted-foreground">{patient.email}</p>
          </div>
          <div className="ml-auto font-medium">
             <Badge variant={patient.status === 'New Patient' ? 'default' : 'secondary'}>
                {patient.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
