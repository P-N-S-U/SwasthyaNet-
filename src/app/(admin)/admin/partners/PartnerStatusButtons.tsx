'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import { updatePartnerStatus } from './actions';
import { useToast } from '@/hooks/use-toast';

interface PartnerStatusButtonsProps {
  partnerId: string;
  currentStatus: 'pending' | 'approved' | 'rejected';
}

export function PartnerStatusButtons({
  partnerId,
  currentStatus,
}: PartnerStatusButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async (status: 'approved' | 'rejected') => {
    setIsLoading(true);
    const result = await updatePartnerStatus(partnerId, status);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Status Updated',
        description: `Partner has been ${status}.`,
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update partner status.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-end pr-4">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (currentStatus === 'pending') {
    return (
      <div className="flex gap-2 justify-end">
        <Button
          size="sm"
          variant="outline"
          className="text-green-500 border-green-500/50 hover:bg-green-500/10 hover:text-green-400"
          onClick={() => handleUpdate('approved')}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-red-500 border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
          onClick={() => handleUpdate('rejected')}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Reject
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {currentStatus !== 'approved' && (
            <DropdownMenuItem
              className="text-green-500 focus:bg-green-500/10 focus:text-green-400"
              onSelect={() => handleUpdate('approved')}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </DropdownMenuItem>
          )}
          {currentStatus !== 'rejected' && (
            <DropdownMenuItem
              className="text-red-500 focus:bg-red-500/10 focus:text-red-400"
              onSelect={() => handleUpdate('rejected')}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
