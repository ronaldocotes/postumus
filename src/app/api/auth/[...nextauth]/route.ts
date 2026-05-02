import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma-fixed";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        console.log('🔐 Tentativa de login:', credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Credenciais faltando');
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
          console.log('👤 Usuário encontrado:', user ? 'sim' : 'não');

          if (!user || !user.active) {
            console.log('❌ Usuário inativo ou não encontrado');
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          console.log('🔑 Senha válida:', isValid);

          if (!isValid) {
            console.log('❌ Senha inválida');
            return null;
          }

          console.log('✅ Login bem-sucedido para:', user.email);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error('❌ Erro no authorize:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export const dynamic = 'force-dynamic';

export { handler as GET, handler as POST };
