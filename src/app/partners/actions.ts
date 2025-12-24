'use server';

import { z } from 'zod';
import { adminDb, initializeFirebaseAdmin } from '@/lib/firebase/server-auth';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';

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

async function createServerSessionCookie(uid: string) {
    const auth = getAuth(initializeFirebaseAdmin());
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(uid, { expiresIn });

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

    // 3. Create a session cookie for the new user
    await createServerSessionCookie(userRecord.uid);

    return { success: true, error: null };
    
  } catch (error: any) {
    console.error('Partner signup failed:', error);
    // Provide a more user-friendly error message
    let errorMessage = 'An unexpected error occurred.';
    if (error.code === 'auth/email-already-exists') {
        errorMessage = 'This email is already in use by another account.';
    } else if (error.code === 'auth/invalid-password') {
        errorMessage = 'The password must be at least 6 characters long.';
    }
    return { success: false, error: errorMessage };
  }
}

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function partnerSignIn(prevState: any, formData: FormData) {
     // This function is for form actions, it will not use client-side Firebase SDK.
     // It will use the Admin SDK to verify the user and create a session.
     // For simplicity in this refactor, we'll keep the client-side sign-in logic
     // which relies on `signInWithEmail` and `createServerSession` from the client.
     // A full server-side sign-in flow is possible but more complex.
     // We will use the existing client-side flow for sign-in.
     return { success: false, error: "Sign-in via server action is not implemented. Client-side sign-in will be used." };
}