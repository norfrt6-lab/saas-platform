import { getSession } from "@saas/auth";
import { Button } from "@saas/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@saas/ui/card";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { acceptInvitation } from "@/lib/api/invitations";

export const metadata: Metadata = {
  title: "Accept Invitation",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/auth/login?callbackUrl=/invite/${token}`);
  }

  let error: string | null = null;

  try {
    await acceptInvitation(token, session.user.id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to accept invitation";
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  redirect("/dashboard");
}
