import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import type { Session } from "./auth";

export async function getSession(): Promise<Session | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  return session as Session;
}

export async function requireSession(
  redirectTo: string = "/auth/login",
): Promise<Session> {
  const session = await getSession();

  if (!session) {
    redirect(redirectTo);
  }

  return session;
}
