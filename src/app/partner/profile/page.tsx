'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@/hooks/use-auth-state';
import {
  Loader2,
  User,
  Mail,
  Edit,
  Building,
  FileBadge,
  Phone,
  MapPin,
  UploadCloud,
  Map,
  CheckCircle,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PartnerProfileForm } from '@/components/partner/PartnerProfileForm';
import { UpdateProfileForm } from '@/components/profile/UpdateProfileForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { savePartnerLocation, saveDocumentUrl } from '@/app/profile/actions';
import { useToast } from '@/hooks/use-toast';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from '@/lib/firebase/firebase';
import { usePartnerProfile } from '@/hooks/use-partner-profile';


const ProfileDetailItem = ({ icon, label, value, loading = false }) => {
  if (!value && !loading) return null;

  return (
    <div className="flex items-start gap-4 rounded-lg bg-secondary/50 p-4">
      <div className="mt-1 text-primary">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-1 h-6 w-32" />
        ) : (
          <p className="font-medium">
            {value || 'Not provided'}
          </p>
        )}
      </div>
    </div>
  );
};

const VerificationCard = ({ user, profile, mutate }) => {
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const handleVerifyLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: "Your browser doesn't support location services.",
        variant: 'destructive',
      });
      return;
    }
    
    setIsVerifying(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const result = await savePartnerLocation({ lat: latitude, lng: longitude });

        if (result.error) {
          toast({
            title: 'Failed to save location',
            description: result.error,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Location Verified!',
            description: 'Your shop location has been saved.',
          });
          mutate(); // Re-fetch user profile
        }
        setIsVerifying(false);
      },
      (error) => {
        toast({
          title: 'Location Error',
          description: `Could not get your location: ${error.message}. Please ensure you have enabled location services for this site.`,
          variant: 'destructive',
        });
        setIsVerifying(false);
      }
    );
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
        toast({ title: "No file selected", description: "Please select a file to upload.", variant: "destructive" });
        return;
    }
    if (!user?.uid) {
        toast({ title: "Authentication Error", description: "Could not identify user.", variant: "destructive" });
        return;
    }
    
    setIsUploading(true);

    try {
        const fileRef = ref(storage, `partner-verification/${user.uid}/${selectedFile.name}`);
        
        await uploadBytes(fileRef, selectedFile);
        const downloadURL = await getDownloadURL(fileRef);

        const result = await saveDocumentUrl(downloadURL);

        if (result.error) {
           throw new Error(result.error);
        }

        toast({
            title: 'Upload Successful',
            description: 'Your verification document has been uploaded.',
        });
        mutate();
        setSelectedFile(null);
    } catch (err: any) {
        toast({
            title: 'Upload Failed',
            description: err.message || "An error occurred during file upload.",
            variant: 'destructive'
        });
    } finally {
        setIsUploading(false);
    }
  };

  const hasLocation = profile?.partnerProfile?.location;
  const hasDocument = profile?.partnerProfile?.documents?.verification;
  
  return (
    <Card className="border-border/30 bg-background">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
          Verification
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Verify your business by uploading documents and confirming your physical location.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border bg-secondary/30 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="font-semibold">Business Location</h4>
                  <p className="text-sm text-muted-foreground">Capture your shop's GPS coordinates to appear on the map for patients.</p>
                </div>
                 <Button onClick={handleVerifyLocation} disabled={isVerifying} className="mt-3 sm:mt-0">
                    {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                    {hasLocation ? "Re-verify Location" : "Verify My Location"}
                 </Button>
            </div>
             {hasLocation && (
              <Alert className="mt-4 border-green-500/50 text-green-400 [&>svg]:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle className="font-bold">Location Saved</AlertTitle>
                <AlertDescription>
                  Your business location is saved and will appear on the map for patients.
                </AlertDescription>
              </Alert>
            )}
        </div>
        
         <div className="rounded-lg border bg-secondary/30 p-4">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                 <div>
                    <h4 className="font-semibold">Business Documents</h4>
                    <p className="text-sm text-muted-foreground">Upload a photo of your business license or shop front.</p>
                </div>
                <div className="mt-3 sm:mt-0 flex items-center gap-2">
                    <Input id="picture" type="file" onChange={handleFileChange} disabled={isUploading} className="w-full sm:w-auto" />
                    <Button onClick={handleUpload} disabled={isUploading || !selectedFile}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                        Upload
                    </Button>
                 </div>
            </div>
             {hasDocument && (
              <Alert className="mt-4 border-green-500/50 text-green-400 [&>svg]:text-green-400">
                <FileText className="h-4 w-4" />
                <AlertTitle className="font-bold">Document Uploaded</AlertTitle>
                <AlertDescription>
                  <a href={hasDocument} target="_blank" rel="noopener noreferrer" className="underline">View your uploaded document.</a>
                  <p>Your document is submitted for review.</p>
                </AlertDescription>
              </Alert>
            )}
        </div>
        
      </CardContent>
    </Card>
  )
}

export default function PartnerProfilePage() {
  const { user, loading: authLoading, role } = useAuthState();
  const { profile, loading: profileLoading, mutate } = usePartnerProfile(user?.uid, role === 'partner');
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
    if (!authLoading && role && role !== 'partner') {
      router.replace('/dashboard');
    }
  }, [user, authLoading, role, router]);
  
  const isLoading = authLoading || profileLoading;

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'P';
     const names = name.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const partnerProfile = profile?.partnerProfile || {};

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold font-headline">Partner Profile</h1>
        <p className="mt-2 text-lg text-foreground/70">
          Manage your business information and verification status.
        </p>
      </div>
      <div className="space-y-8">
        <Card className="border-border/30 bg-background">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="font-headline text-3xl font-bold">
                  {partnerProfile.name || user.displayName || 'Partner Profile'}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{partnerProfile?.partnerType}</Badge>
                    <Badge variant={partnerProfile?.status === 'approved' ? 'default' : 'destructive'}>{partnerProfile?.status}</Badge>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Name
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="font-headline">Edit Profile</DialogTitle>
                    <DialogDescription>
                      Update your name and profile picture.
                    </DialogDescription>
                  </DialogHeader>
                  <UpdateProfileForm user={user} onUpdate={mutate} />
                </DialogContent>
              </Dialog>
            </div>
             <div className="mx-auto pt-4 text-center">
              <Avatar className="mx-auto h-24 w-24 border-4 border-primary">
                <AvatarImage src={profile?.photoURL || undefined} alt={partnerProfile.name || ''} />
                <AvatarFallback className="text-3xl">
                  {getInitials(partnerProfile.name)}
                </AvatarFallback>
              </Avatar>
            </div>
          </CardHeader>
          <CardContent className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileDetailItem icon={<Mail className="h-5 w-5" />} label="Contact Email" value={profile?.email} loading={isLoading} />
            <ProfileDetailItem icon={<Building className="h-5 w-5" />} label="Business Name" value={partnerProfile.name || 'Not set'} loading={isLoading} />
          </CardContent>
        </Card>

        <Card className="border-border/30 bg-background">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-headline text-2xl">
                Business Details
              </CardTitle>
              <Dialog>
                <DialogTrigger asChild disabled={isLoading}>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                    <DialogTitle className="font-headline">
                      Business Information
                    </DialogTitle>
                    <DialogDescription>
                      This information will be used for verification and display.
                    </DialogDescription>
                  </DialogHeader>
                  <PartnerProfileForm profile={profile} onUpdate={mutate} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ProfileDetailItem
                  loading={isLoading}
                  icon={<FileBadge className="h-5 w-5" />}
                  label="License Number"
                  value={partnerProfile.licenseNumber}
                />
                <ProfileDetailItem
                  loading={isLoading}
                  icon={<Phone className="h-5 w-5" />}
                  label="Contact Number"
                  value={partnerProfile.contact}
                />
              </div>
              <ProfileDetailItem
                loading={isLoading}
                icon={<Map className="h-5 w-5" />}
                label="Full Address"
                value={partnerProfile.address}
              />
            </CardContent>
          </Card>
          
          <VerificationCard user={user} profile={profile} mutate={mutate} />
      </div>
    </div>
  );
}
