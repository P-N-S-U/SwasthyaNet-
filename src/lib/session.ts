'use server';

import { sign, verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const secret = process.env.ADMIN_SESSION_SECRET || 'fallback-secret-for-admin-session-dev';
if (process.env.NODE_ENV === 'production' && secret === 'fallback-secret-for-admin-session-dev') {
  console.error('Warning: ADMIN_SESSION_SECRET is not set for production. Using a default, insecure secret.');
}

const cookieName = 'admin_session';

type SessionPayload = {
  isAdmin: boolean;
  expires: number;
};

export async function createAdminSession() {
  const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  const payload: SessionPayload = { isAdmin: true, expires };

  const token = await new Promise<string>((resolve, reject) => {
    sign(payload, secret, { expiresIn: '24h' }, (err, token) => {
      if (err || !token) return reject(err);
      resolve(token);
    });
  });

  cookies().set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(expires),
    path: '/',
    sameSite: 'lax',
  });
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const token = cookies().get(cookieName)?.value;
  if (!token) return null;

  try {
    const payload = await new Promise<SessionPayload>((resolve, reject) => {
      verify(token, secret, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded as SessionPayload);
      });
    });
    
    if (payload.expires < Date.now()) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

export async function destroyAdminSession() {
  cookies().delete(cookieName);
}
