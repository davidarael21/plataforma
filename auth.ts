import type { NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { verifyPassword } from "@/lib/password"

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async signIn({ user }) {
      return Boolean((user as any)?.id)
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = (user as any).id
        ;(token as unknown as { role?: unknown }).role = (user as any).role
        ;(token as unknown as { username?: unknown }).username = (user as any).username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.sub
        ;(session.user as any).role = (token as any).role
        ;(session.user as any).username = (token as any).username
      }
      return session
    }
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        const username = credentials?.username?.trim().toLowerCase()
        const password = credentials?.password ?? ""

        if (!username || !password) return null

        const user = await prisma.user.findUnique({ where: { username } })
        if (!user?.passwordHash) return null

        const ok = await verifyPassword(password, user.passwordHash)
        if (!ok) return null

        return {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role
        } as any
      }
    })
  ]
}