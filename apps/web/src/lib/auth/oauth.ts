import { socialProvider } from "better-auth/plugins";

export const googleProvider = socialProvider({
  providerId: "google",
  clientId: process.env.GOOGLE_CLIENT_ID ?? "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  scopes: ["openid", "email", "profile"],
  redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`,
});

export const githubProvider = socialProvider({
  providerId: "github",
  clientId: process.env.GITHUB_CLIENT_ID ?? "",
  clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
  scopes: ["user:email", "read:user"],
  redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/github`,
});

export const oauthProviders = [googleProvider, githubProvider];

/** Returns true if the given provider is configured (env vars present). */
export function isProviderEnabled(provider: "google" | "github"): boolean {
  if (provider === "google") {
    return Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
    );
  }
  if (provider === "github") {
    return Boolean(
      process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
    );
  }
  return false;
}

export const enabledProviders = (
  ["google", "github"] as const
).filter(isProviderEnabled);
