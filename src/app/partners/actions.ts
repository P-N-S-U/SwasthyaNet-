
'use server';

import { z } from 'zod';
import { adminDb, initializeFirebaseAdmin } from '@/lib/firebase/server-auth';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const partnerSignUpSchema = z.object({
  businessName: z.string().min(3, 'Business name is required.'),
  personalName: z.string().min(3, 'Your full name is required.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  partnerType: z.enum(['pharmacy', 'diagnostic_lab', 'home_care']),
  street: z.string().min(3, 'Street address is required.'),
  city: z.string().min(2, 'City is required.'),
  state: z.string().min(2, 'State or province is required.'),
  postalCode: z.string().min(3, 'Postal code is required.'),
  country: z.string().min(2, 'Country is required.'),
});

async function createServerSessionCookie(idToken: string) {
    const auth = getAuth(initializeFirebaseAdmin());
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    cookies().set('__session', sessionCookie, {
        maxAge: expiresIn / 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
    });
}


export async function signUpPartner(prevState: any, formData: FormData) {
  
  const validatedFields = partnerSignUpSchema.safeParse(
    Object.fromEntries(formData.entries())
  );
  
  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Invalid form data. Please check your entries and try again.',
    };
  }

  const {
    email,
    password,
    personalName,
    businessName,
    partnerType,
    street,
    city,
    state,
    postalCode,
    country,
  } = validatedFields.data;

  const auth = getAuth(initializeFirebaseAdmin());
  
  try {
    // 1. Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: personalName,
    });
    
    // Set a custom claim for the partner role
    await auth.setCustomUserClaims(userRecord.uid, { role: 'partner' });

    // 2. Create partner document in Firestore
    const partnerRef = adminDb.collection('partners').doc(userRecord.uid);
    const fullAddress = `${street}, ${city}, ${state} ${postalCode}, ${country}`;

    await partnerRef.set({
        name: businessName,
        partnerType: partnerType,
        address: fullAddress,
        ownerUID: userRecord.uid,
        status: 'pending',
        contact: '',
        licenseNumber: '',
        location: null,
        email: email,
        uid: userRecord.uid,
        createdAt: FieldValue.serverTimestamp(),
    });

    // We don't create a session here anymore. The client-side will handle sign-in.
    // The user needs to sign in after creating an account.
    
  } catch (error: any) {
    console.error('[actions.ts] Partner signup failed:', error);
    // Provide a more user-friendly error message
    let errorMessage = 'An unexpected error occurred.';
    if (error.code === 'auth/email-already-exists') {
        errorMessage = 'This email is already in use by another account.';
    } else if (error.code === 'auth/invalid-password') {
        errorMessage = 'The password must be at least 6 characters long.';
    }
    return { success: false, error: errorMessage };
  }

  // Redirect to the sign-in tab after a successful signup
  redirect('/partners/signup?action=signin');
}

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function partnerSignIn(prevState: any, formData: FormData) {
     const validatedFields = signInSchema.safeParse(
        Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
        return { success: false, error: 'Invalid email or password.' };
    }

    try {
        const { email, password } = validatedFields.data;
        // This is a placeholder for a more secure custom token exchange.
        // For this app, we will rely on the client to sign in and post the ID token.
        // A full server-side flow would involve exchanging the email/password for a token here.
        // This action will therefore not complete the sign in.
        return { success: false, error: "Server-side sign-in is not implemented. Please use the client for sign-in."};

    } catch (error: any) {
        return { success: false, error: 'An unexpected error occurred during sign-in.' };
    }
}
