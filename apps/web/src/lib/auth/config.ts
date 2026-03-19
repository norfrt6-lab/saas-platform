import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { multiSession, organization } from "better-auth/plugins";

// db would be imported from @saas/db in a real setup
// import { db } from "@saas/db";

export const auth = betterAuth({
  database: drizzleAdapter(
    // db,
    {} as never,
    {
      provider: "pg",
      usePlural: true,
    },
  ),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minute client-side cache
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  plugins: [
    multiSession({ maximumSessions: 5 }),
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 3,
      membershipLimit: 100,
    }),
  ],

  rateLimit: {
    window: 60,
    max: 20,
    storage: "memory",
  },

  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ],
});

export type Auth = typeof auth;
