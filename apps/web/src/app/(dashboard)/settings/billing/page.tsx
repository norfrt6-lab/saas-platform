import { getTeamUsageSummary } from "@saas/billing/feature-gate";
import { db } from "@saas/db";
import { teams } from "@saas/db/schema";
import { Badge } from "@saas/ui/badge";
import { Button } from "@saas/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@saas/ui/card";
import { Separator } from "@saas/ui/separator";
import { eq } from "drizzle-orm";
import { CreditCard, ExternalLink } from "lucide-react";
import type { Metadata } from "next";

import { UsageMeter } from "@/components/billing/usage-meter";
import { requireAuth } from "@/lib/auth-guard";
import { getActiveTeamId } from "@/lib/tenant-middleware";

export const metadata: Metadata = {
  title: "Billing",
};

export default async function BillingPage() {
  await requireAuth();
  const teamId = await getActiveTeamId();

  if (!teamId) {
    return <div>No team selected</div>;
  }

  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  const usage = await getTeamUsageSummary(teamId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and usage
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your team&apos;s subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge
                variant={team.plan === "free" ? "secondary" : "default"}
                className="text-base px-3 py-1"
              >
                {team.plan.charAt(0).toUpperCase() + team.plan.slice(1)}
              </Badge>
              <Badge
                variant={
                  team.billingStatus === "active"
                    ? "outline"
                    : "destructive"
                }
              >
                {team.billingStatus}
              </Badge>
            </div>
            {team.plan === "free" ? (
              <Button className="w-full">
                Upgrade to Pro
              </Button>
            ) : (
              <Button variant="outline" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Subscription
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Your billing information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {team.stripeCustomerId ? (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Card on file</p>
                  <p className="text-xs text-muted-foreground">
                    Managed via Stripe
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No payment method on file
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>
            Current usage against your plan limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageMeter
            label="Projects"
            current={usage.usage.projects.current}
            limit={usage.usage.projects.limit}
          />
          <Separator />
          <UsageMeter
            label="Team Members"
            current={usage.usage.members.current}
            limit={usage.usage.members.limit}
          />
          <Separator />
          <UsageMeter
            label="API Requests (this month)"
            current={usage.usage.apiCalls.current}
            limit={usage.usage.apiCalls.limit}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                name: "Free",
                price: "$0",
                features: ["3 projects", "2 team members", "1,000 API calls/mo"],
              },
              {
                name: "Pro",
                price: "$29/mo",
                features: ["50 projects", "20 team members", "100K API calls/mo", "Custom domains", "Priority support"],
              },
              {
                name: "Enterprise",
                price: "Custom",
                features: ["Unlimited projects", "Unlimited members", "Unlimited API calls", "SSO/SAML", "Dedicated support"],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg border p-4 ${
                  plan.name.toLowerCase() === team.plan
                    ? "border-primary bg-primary/5"
                    : ""
                }`}
              >
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="text-2xl font-bold mt-1">{plan.price}</p>
                <ul className="mt-3 space-y-1.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="text-sm text-muted-foreground">
                      &bull; {feature}
                    </li>
                  ))}
                </ul>
                {plan.name.toLowerCase() === team.plan ? (
                  <Badge variant="outline" className="mt-3">
                    Current Plan
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                  >
                    {plan.name === "Enterprise" ? "Contact Sales" : "Upgrade"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
