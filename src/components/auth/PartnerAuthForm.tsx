
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
} from '@/lib/firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import React from 'react';

const GoogleIcon = () => (
  <svg
    className="mr-2 h-4 w-4"
    aria-hidden="true"
    focusable="false"
    data-prefix="fab"
    data-icon="google"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 488 512"
  >
    <path
      fill="currentColor"
      d="M488 261.8C488 403.3 381.5 512 244 512 111.3 512 0 400.7 0 264.1 0 127.6 111.3 16 244 16c73.4 0 135.3 30.1 181.4 78.4l-77 77.4C325.7 150.8 287.1 128 244 128c-66.2 0-120 53.8-120 120s53.8 120 120 120c72.6 0 106-44.5 110.3-66h-110.3v-91h214.1c1.9 11.2 3.1 22.8 3.1 34.9z"
    ></path>
  </svg>
);

const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z
    .string()
    .min(1, { message: 'Password is required.' }),
});

const partnerSignUpSchema = z.object({
  businessName: z.string().min(3, { message: 'Business name is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
  partnerType: z.enum(['pharmacy', 'diagnostic_lab', 'home_care'], {
    required_error: 'You need to select a business type.',
  }),
});

export function PartnerAuthForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });
  
  const signUpForm = useForm<z.infer<typeof partnerSignUpSchema>>({
    resolver: zodResolver(partnerSignUpSchema),
    defaultValues: {
      businessName: '',
      email: '',
      password: '',
      partnerType: 'pharmacy',
    },
  });

  const handleSignIn = async (values: z.infer<typeof signInSchema>) => {
    setIsLoading(true);
    const { error } = await signInWithEmail(values.email, values.password);
    if (error) {
      toast({
        title: 'Sign In Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Signed In Successfully',
        description: "Welcome back!",
      });
      router.push('/dashboard');
    }
    setIsLoading(false);
  };

  const handleSignUp = async (values: z.infer<typeof partnerSignUpSchema>) => {
    setIsLoading(true);
    const { error } = await signUpWithEmail(values.email, values.password, {
      displayName: values.businessName,
      role: 'partner',
      partnerType: values.partnerType,
      status: 'pending',
      profile: {
        name: values.businessName,
        licenseNumber: '',
        contact: '',
        address: '',
        location: null
      }
    });

    if (error) {
      toast({
        title: 'Sign Up Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account Created',
        description: "Welcome! Your account is pending approval.",
      });
      router.push('/dashboard');
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error, user } = await signInWithGoogle({
        role: 'partner',
        partnerType: 'pharmacy', // Default for Google Sign in
        status: 'pending'
    });
    if (error) {
      toast({
        title: 'Google Sign-In Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account Created',
        description: "Welcome! Your account is pending approval.",
      });
      router.push('/dashboard');
    }
    setIsLoading(false);
  };
  
  return (
    <Tabs defaultValue="signin" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      <TabsContent value="signin">
        <Card className="border-none bg-secondary/50">
          <CardHeader>
            <CardTitle className="font-headline">Partner Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your partner dashboard.
            </CardDescription>
          </CardHeader>
          <Form {...signInForm}>
            <form onSubmit={signInForm.handleSubmit(handleSignIn)}>
              <CardContent className="space-y-4">
                <FormField
                  control={signInForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contact@mypharmacy.com"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signInForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </TabsContent>
      <TabsContent value="signup">
        <Card className="border-none bg-secondary/50">
        <CardHeader>
            <CardTitle className="font-headline">Create a Partner Account</CardTitle>
            <CardDescription>Join the SwasthyaNet network to reach more patients.</CardDescription>
        </CardHeader>
        <Form {...signUpForm}>
            <form onSubmit={signUpForm.handleSubmit(handleSignUp)}>
            <CardContent className="space-y-4">
                <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                type="button"
                >
                {isLoading ? <Loader2 className="animate-spin" /> : <><GoogleIcon /> Sign up with Google</>}
                </Button>
                <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-secondary/50 px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
                </div>
                <FormField
                control={signUpForm.control}
                name="businessName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                        <Input
                        placeholder="e.g., City Pharmacy"
                        {...field}
                        disabled={isLoading}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={signUpForm.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Business Email</FormLabel>
                    <FormControl>
                        <Input
                        type="email"
                        placeholder="contact@mypharmacy.com"
                        {...field}
                        disabled={isLoading}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={signUpForm.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                        <Input
                        type="password"
                        {...field}
                        disabled={isLoading}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={signUpForm.control}
                name="partnerType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Business Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select your business type" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="pharmacy">Pharmacy</SelectItem>
                        <SelectItem value="diagnostic_lab">Diagnostic Lab</SelectItem>
                        <SelectItem value="home_care">Home Care Service</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>
            <CardFooter>
                <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                type="submit"
                disabled={isLoading}
                >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
                </Button>
            </CardFooter>
            </form>
        </Form>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
