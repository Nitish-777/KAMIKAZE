/**
 * Shared NextAuth configuration.
 * Extracted from the API route so Server Components (Navbar, pages)
 * can import authOptions without pulling in the entire route module
 * and its heavy dependencies.
 */
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { consumeOtpToken } from "@/lib/otpTokenStore";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otpToken: { label: "OTP Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const email = credentials.email.toLowerCase().trim();

        // --- OTP Token Flow ---
        // After Supabase verifies the OTP, verify-otp API issues a short-lived
        // one-time token. The client passes it here to establish a NextAuth session.
        if (credentials.otpToken) {
          const isValid = consumeOtpToken(email, credentials.otpToken);
          if (!isValid) return null;

          // Find or create user in Prisma
          let user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                name: email.split("@")[0],
                role: "RETAIL",
                emailVerified: new Date(),
              },
            });
          } else if (!user.emailVerified) {
            // Mark email as verified since OTP was confirmed
            await prisma.user.update({
              where: { id: user.id },
              data: { emailVerified: new Date() },
            });
          }

          return {
            id: user.id + "",
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }

        // --- Password Flow ---
        if (!credentials.password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isPasswordValid) return null;

        return {
          id: user.id + "",
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};
