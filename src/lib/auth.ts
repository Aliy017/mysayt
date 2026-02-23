import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "Login",
            credentials: {
                login: { label: "Login", type: "text" },
                password: { label: "Parol", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.login || !credentials?.password) return null;

                const user = await prisma.user.findUnique({
                    where: { login: credentials.login as string },
                });

                if (!user || !user.isActive) return null;

                const valid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!valid) return null;

                // Activity log
                await prisma.activityLog.create({
                    data: {
                        userId: user.id,
                        action: "login",
                        details: `${user.role} login`,
                    },
                });

                return {
                    id: user.id,
                    name: user.name,
                    email: user.login, // NextAuth requires email field
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as { role: string }).role;
                token.userId = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { role: string; userId: string }).role =
                    token.role as string;
                (session.user as { role: string; userId: string }).userId =
                    token.userId as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 soat
    },
    trustHost: true,
});
