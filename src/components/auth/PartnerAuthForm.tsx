'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';

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
import React, { useEffect, useState, useActionState } from 'react';
import { signInWithEmail } from '@/lib/firebase/auth';
import { auth } from '@/lib/firebase/firebase';
import { signUpPartner, partnerSignIn } from '@/app/partners/actions';

const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const partnerSignUpSchema = z.object({
  businessName: z.string().min(3, { message: 'Business name is required.' }),
  personalName: z.string().min(3, { message: 'Your full name is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
  partnerType: z.enum(['pharmacy', 'diagnostic_lab', 'home_care'], {
    required_error: 'You need to select a business type.',
  }),
  street: z.string().min(3, { message: 'Street address is required.' }),
  city: z.string().min(2, { message: 'City is required.' }),
  state: z.string().min(2, { message: 'State or province is required.' }),
  postalCode: z.string().min(3, { message: 'Postal code is required.' }),
  country: z.string().min(2, { message: 'Country is required.' }),
});

const initialActionState = {
  error: null,
  success: false,
};

export function PartnerAuthForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(
    searchParams.get('action') || 'signin'
  );

  const [signInState, signInAction, isSignInPending] = useActionState(partnerSignIn, initialActionState);
  const [signUpState, signUpAction, isSignUpPending] = useActionState(signUpPartner, initialActionState);

  const isLoading = isSignInPending || isSignUpPending;

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'signup' || action === 'signin') {
      setActiveTab(action);
    }
  }, [searchParams]);

  // Effect for Sign-In Action
  useEffect(() => {
    if (signInState.error) {
      toast({
        title: 'Sign In Failed',
        description: signInState.error,
        variant: 'destructive',
      });
    }
    if (signInState.success) {
      toast({
        title: 'Signed In Successfully',
        description: 'Welcome back!',
      });
      router.push('/dashboard');
    }
  }, [signInState, router, toast]);

  // Effect for Sign-Up Action
  useEffect(() => {
    if (signUpState.error) {
      toast({
        title: 'Sign Up Failed',
        description: signUpState.error,
        variant: 'destructive',
      });
    }
    if (signUpState.success) {
      toast({
        title: 'Account Created',
        description: 'Welcome! Your account is pending approval.',
      });
      router.push('/dashboard');
    }
  }, [signUpState, router, toast]);


  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<z.infer<typeof partnerSignUpSchema>>({
    resolver: zodResolver(partnerSignUpSchema),
    defaultValues: {
      businessName: '',
      personalName: '',
      email: '',
      password: '',
      partnerType: 'pharmacy',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
  });

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            <form action={signInAction}>
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
                          name="email"
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
                          name="password"
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
                  {isSignInPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
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
            <CardTitle className="font-headline">
              Create a Partner Account
            </CardTitle>
            <CardDescription>
              Join the SwasthyaNet network to reach more patients.
            </CardDescription>
          </CardHeader>
          <Form {...signUpForm}>
             <form action={signUpAction}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                            name="businessName"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="personalName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Ravi Kumar"
                            {...field}
                            disabled={isLoading}
                            name="personalName"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                           name="email"
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
                          name="password"
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                        name="partnerType"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your business type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pharmacy">Pharmacy</SelectItem>
                          <SelectItem value="diagnostic_lab">
                            Diagnostic Lab
                          </SelectItem>
                          <SelectItem value="home_care">
                            Home Care Service
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2 rounded-lg border border-border bg-background/30 p-4">
                  <h4 className="text-sm font-medium">Business Address</h4>
                  <FormField
                    control={signUpForm.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Main St"
                            {...field}
                            disabled={isLoading}
                            name="street"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={signUpForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Mumbai"
                              {...field}
                              disabled={isLoading}
                              name="city"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State / Province</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Maharashtra"
                              {...field}
                              disabled={isLoading}
                              name="state"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={signUpForm.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="400001"
                              {...field}
                              disabled={isLoading}
                              name="postalCode"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="India"
                              {...field}
                              disabled={isLoading}
                              name="country"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  type="submit"
                  disabled={isLoading}
                >
                  {isSignUpPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
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
