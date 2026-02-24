import { getSession } from "@saas/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login");
  }
  return session;
}

/**
 * Require platform-level admin role (not team role).
 * Use requireTeamRole from teams.ts for team-scoped authorization.
 */
export async function requireAdmin() {
  const session = await requireAuth();
  if ((session.user as { role?: string }).role !== "admin") {
    redirect("/dashboard");
  }
  return session;
}

export async function optionalAuth() {
  return await getSession();
}
