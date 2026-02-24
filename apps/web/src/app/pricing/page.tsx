import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@saas/ui/button";
import { Badge } from "@saas/ui/badge";
import { Check, X } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Choose the plan that fits your needs",
};

const features = [
  { name: "Projects", free: "3", pro: "50", enterprise: "Unlimited" },
  { name: "Team members", free: "2", pro: "20", enterprise: "Unlimited" },
  { name: "API calls/month", free: "1,000", pro: "100,000", enterprise: "Unlimited" },
  { name: "File storage", free: "10 MB", pro: "100 MB", enterprise: "1 GB" },
  { name: "API keys", free: "1", pro: "10", enterprise: "100" },
  { name: "Custom domains", free: false, pro: true, enterprise: true },
  { name: "Advanced analytics", free: false, pro: true, enterprise: true },
  { name: "Priority support", free: false, pro: true, enterprise: true },
  { name: "Audit logs", free: false, pro: true, enterprise: true },
  { name: "Data export", free: false, pro: true, enterprise: true },
  { name: "SSO/SAML", free: false, pro: false, enterprise: true },
  { name: "SLA guarantee", free: false, pro: false, enterprise: true },
  { name: "Dedicated support", free: false, pro: false, enterprise: true },
];

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-4 w-4 text-primary" />
    ) : (
      <X className="h-4 w-4 text-muted-foreground/30" />
    );
  }
  return <span className="text-sm">{value}</span>;
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Compare plans and choose what works best for you
        </p>
      </div>

      <div className="mt-16 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="pb-4 text-left text-sm font-medium">Features</th>
              <th className="pb-4 text-center">
                <div className="space-y-1">
                  <p className="font-semibold">Free</p>
                  <p className="text-2xl font-bold">$0</p>
                </div>
              </th>
              <th className="pb-4 text-center">
                <div className="space-y-1">
                  <Badge>Most Popular</Badge>
                  <p className="font-semibold">Pro</p>
                  <p className="text-2xl font-bold">$29/mo</p>
                </div>
              </th>
              <th className="pb-4 text-center">
                <div className="space-y-1">
                  <p className="font-semibold">Enterprise</p>
                  <p className="text-2xl font-bold">Custom</p>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => (
              <tr key={feature.name} className="border-t">
                <td className="py-3 text-sm">{feature.name}</td>
                <td className="py-3 text-center">
                  <div className="flex justify-center">
                    <FeatureValue value={feature.free} />
                  </div>
                </td>
                <td className="py-3 text-center">
                  <div className="flex justify-center">
                    <FeatureValue value={feature.pro} />
                  </div>
                </td>
                <td className="py-3 text-center">
                  <div className="flex justify-center">
                    <FeatureValue value={feature.enterprise} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td className="pt-6" />
              <td className="pt-6 text-center">
                <Button variant="outline" asChild>
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </td>
              <td className="pt-6 text-center">
                <Button asChild>
                  <Link href="/auth/register">Start Free Trial</Link>
                </Button>
              </td>
              <td className="pt-6 text-center">
                <Button variant="outline">Contact Sales</Button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
