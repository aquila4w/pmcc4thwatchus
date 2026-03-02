import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";
import { getPayload } from "payload";
import config from "@payload-config";

export const authOptions: NextAuthOptions = {
  providers: [
    // Email/Password
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const payload = await getPayload({ config });
          const result = await payload.login({
            collection: "users",
            data: {
              email: credentials.email,
              password: credentials.password,
            },
          });

          if (result.user) {
            return {
              id: String(result.user.id),
              email: result.user.email,
              name: result.user.name,
              role: result.user.role || "member",
              status: result.user.status || "pending",
              inviteCode: result.user.inviteCode || "",
              payloadToken: result.token,
            };
          }
        } catch (error) {
          console.error("Auth error:", error);
        }
        return null;
      },
    }),

    // Google OAuth
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // Facebook OAuth
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [
          FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
          }),
        ]
      : []),

    // Apple OAuth
    ...(process.env.APPLE_ID && process.env.APPLE_SECRET
      ? [
          AppleProvider({
            clientId: process.env.APPLE_ID,
            clientSecret: process.env.APPLE_SECRET,
          }),
        ]
      : []),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, create or update user in Payload
      if (account?.provider && account.provider !== "credentials") {
        try {
          const payload = await getPayload({ config });

          // Check if user exists with this provider ID
          const existingUsers = await payload.find({
            collection: "users",
            where: {
              authProviderId: { equals: account.providerAccountId },
              authProvider: { equals: account.provider },
            },
            limit: 1,
          });

          if (existingUsers.docs.length > 0) {
            // User exists, update their info
            const existingUser = existingUsers.docs[0];
            user.id = String(existingUser.id);
            user.role = existingUser.role || "member";
            user.status = existingUser.status || "pending";
            user.inviteCode = existingUser.inviteCode || "";
            return true;
          }

          // Check if email already exists
          const emailUsers = await payload.find({
            collection: "users",
            where: {
              email: { equals: user.email },
            },
            limit: 1,
          });

          if (emailUsers.docs.length > 0) {
            // Link OAuth to existing account
            const existingUser = emailUsers.docs[0];
            await payload.update({
              collection: "users",
              id: existingUser.id,
              data: {
                authProvider: account.provider,
                authProviderId: account.providerAccountId,
              },
            });
            user.id = String(existingUser.id);
            user.role = existingUser.role || "member";
            user.status = existingUser.status || "pending";
            user.inviteCode = existingUser.inviteCode || "";
            return true;
          }

          // Create new user
          const newUser = await payload.create({
            collection: "users",
            data: {
              email: user.email!,
              name: user.name || user.email!.split("@")[0],
              password: Math.random().toString(36).slice(-12), // Random password for OAuth users
              authProvider: account.provider,
              authProviderId: account.providerAccountId,
              role: "member",
              status: "pending", // New registrations start as pending
            },
          });

          user.id = String(newUser.id);
          user.role = newUser.role || "member";
          user.status = newUser.status || "pending";
          user.inviteCode = newUser.inviteCode || "";
        } catch (error) {
          console.error("OAuth user creation error:", error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "member";
        token.status = user.status || "pending";
        token.inviteCode = user.inviteCode || "";
        if (user.payloadToken) {
          token.payloadToken = user.payloadToken;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.status = token.status as string;
        session.user.inviteCode = token.inviteCode as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/member/login",
    error: "/member/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
};
