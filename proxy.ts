import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import authConfig from '@/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  return NextResponse.next();
});

export const config = {
  matcher: ['/profile/:path*', '/admin/:path*'],
};
