import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
          if (!user) return null;
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyName: user.companyName,
            organizationId: user.organizationId,
          };
        } catch (error: any) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user?.id;
        token.role = user?.role;
        token.companyName = user?.companyName;
        token.organizationId = user?.organizationId;
      } else if (token?.id) {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: { role: true, companyName: true, organizationId: true },
          });
          if (freshUser) {
            token.role = freshUser.role;
            token.companyName = freshUser.companyName;
            token.organizationId = freshUser.organizationId;
          }
        } catch (error: any) {
          console.error("Session refresh error:", error);
        }
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session?.user) {
        (session.user as any).id = token?.id;
        (session.user as any).role = token?.role;
        (session.user as any).companyName = token?.companyName;
        (session.user as any).organizationId = token?.organizationId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
