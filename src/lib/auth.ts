import { v4 as uuid } from "uuid";
import { encode as defaultEncode } from "next-auth/jwt";

import db from "@/lib/db/db";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { schema } from "@/schemas/schema";
import bcrypt from "bcryptjs";

const adapter = PrismaAdapter(db);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const validatedCredentials = schema.parse(credentials);
        console.log("credentials received at sign-in", validatedCredentials);

        const user = await db.user.findFirst({
          where: {
            email: validatedCredentials.email,
          },
        });
        if (
          !user ||
          !(await bcrypt.compare(validatedCredentials.password, user.password))
        ) {
          throw new Error("Invalid credentials.");
        }
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "credentials") {
        token.credentials = true;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback - url:", url, "baseUrl:", baseUrl);
      try {
        const parsedUrl = new URL(url, baseUrl);
        const callbackUrl = parsedUrl.searchParams.get("callbackUrl");

        if (callbackUrl) {
          console.log("Found callbackUrl in query params:", callbackUrl);
          if (callbackUrl.startsWith("/")) {
            const finalUrl = `${baseUrl}${callbackUrl}`;
            console.log("Redirecting to extracted callbackUrl:", finalUrl);
            return finalUrl;
          } else if (new URL(callbackUrl, baseUrl).origin === baseUrl) {
            console.log("Redirecting to absolute callbackUrl:", callbackUrl);
            return callbackUrl;
          }
        }
      } catch (error) {
        console.error("Error parsing URL in redirect callback:", error);
      }

      if (url.startsWith("/")) {
        console.log("Redirecting to relative path:", `${baseUrl}${url}`);
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        console.log("Redirecting to same origin:", url);
        return url;
      }

      console.log("Defaulting to baseUrl:", baseUrl);
      return baseUrl;
    },
  },
  jwt: {
    encode: async function (params) {
      if (params.token?.credentials) {
        const sessionToken = uuid();

        if (!params.token.sub) {
          throw new Error("No user ID found in token");
        }

        const createdSession = await adapter?.createSession?.({
          sessionToken: sessionToken,
          userId: params.token.sub,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        if (!createdSession) {
          throw new Error("Failed to create session");
        }

        return sessionToken;
      }
      return defaultEncode(params);
    },
  },
});
