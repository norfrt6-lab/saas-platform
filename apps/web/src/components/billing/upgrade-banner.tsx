"use client";

import Link from "next/link";
import { Button } from "@saas/ui/button";
import { Card, CardContent } from "@saas/ui/card";
import { Sparkles } from "lucide-react";

interface UpgradeBannerProps {
  feature: string;
  currentPlan: string;
}

export function UpgradeBanner({ feature, currentPlan }: UpgradeBannerProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {feature} is available on Pro and above
            </p>
            <p className="text-xs text-muted-foreground">
              You&apos;re currently on the {currentPlan} plan
            </p>
          </div>
        </div>
        <Button size="sm" asChild>
          <Link href="/settings/billing">Upgrade</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
