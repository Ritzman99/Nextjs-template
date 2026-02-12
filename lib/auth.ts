import type { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { compare } from 'bcryptjs';
import { clientPromise } from '@/lib/db';
import connect from '@/lib/mongoose';
import UserModel, { type IUser } from '@/models/User';

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise) as NextAuthOptions['adapter'],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connect();
        const profile = await UserModel.findOne({ email: credentials.email }).lean() as (IUser & { _id: { toString(): string } }) | null;
        if (!profile?.password) return null;
        const ok = await compare(credentials.password, profile.password);
        if (!ok) return null;
        const userId = profile.userId ?? profile._id.toString();
        const name = profile.name ?? (profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}`.trim() : null) ?? profile.email;
        return {
          id: userId,
          email: profile.email,
          name,
          image: profile.avatar ?? profile.image ?? null,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') return true;
      if (account?.provider === 'google' && user.id) {
        await connect();
        const existing = await UserModel.findOne({ userId: user.id }).lean();
        if (existing) return true;
        await UserModel.create({
          userId: user.id,
          email: user.email ?? '',
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          avatar: user.image ?? undefined,
          role: 'user',
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? null;
        token.name = user.name ?? null;
        token.picture = user.image ?? null;
        await connect();
        const profile = await UserModel.findOne({ userId: user.id }).lean();
        if (profile) {
          const role = (profile as { role?: string }).role ?? 'user';
          const avatar =
            (profile as { avatar?: string; image?: string }).avatar ??
            (profile as { image?: string }).image ??
            null;
          token.role = role;
          token.avatar = avatar;
          token.companyId = (profile as { companyId?: { toString(): string } | null }).companyId?.toString() ?? null;
          token.locationId = (profile as { locationId?: { toString(): string } | null }).locationId?.toString() ?? null;
          token.teamId = (profile as { teamId?: { toString(): string } | null }).teamId?.toString() ?? null;
          token.securityRoleId = (profile as { securityRoleId?: { toString(): string } | null }).securityRoleId?.toString() ?? null;
        } else {
          token.role = 'user';
          token.avatar = token.picture ?? null;
          token.companyId = null;
          token.locationId = null;
          token.teamId = null;
          token.securityRoleId = null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub) as string;
        session.user.role = (token.role as string) ?? 'user';
        session.user.avatar = (token.avatar as string | null) ?? (token.picture as string | null) ?? null;
        session.user.companyId = (token.companyId as string | null) ?? null;
        session.user.locationId = (token.locationId as string | null) ?? null;
        session.user.teamId = (token.teamId as string | null) ?? null;
        session.user.securityRoleId = (token.securityRoleId as string | null) ?? null;
      }
      return session;
    },
  },
};

export const authHandler = NextAuth(authOptions);
