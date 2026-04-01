import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.provider = account?.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        // Save user to D1 database via Cloudflare Worker
        try {
          const response = await fetch(`${process.env.WORKER_URL}/api/user/create-or-update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              googleId: account.providerAccountId || user.id,
              email: user.email,
              name: user.name,
              avatarUrl: user.image,
            }),
          });

          if (!response.ok) {
            console.error('Failed to save user to database');
          }
        } catch (error) {
          console.error('Error saving user to database:', error);
        }
      }
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
