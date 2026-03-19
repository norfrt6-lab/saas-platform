import { getTenantContext } from "@/lib/tenant/context";

type PlanTier = "free" | "pro" | "enterprise";

interface PlanLimits {
  projects: number;
  teamMembers: number;
  apiKeys: number;
  auditLog: boolean;
  customDomain: boolean;
  sso: boolean;
  prioritySupport: boolean;
}

const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: { projects: 3, teamMembers: 5, apiKeys: 2, auditLog: false, customDomain: false, sso: false, prioritySupport: false },
  pro: { projects: 50, teamMembers: 50, apiKeys: 20, auditLog: true, customDomain: true, sso: false, prioritySupport: true },
  enterprise: { projects: Infinity, teamMembers: Infinity, apiKeys: Infinity, auditLog: true, customDomain: true, sso: true, prioritySupport: true },
};

export class FeatureGateError extends Error {
  constructor(
    public readonly feature: string,
    public readonly requiredPlan: PlanTier,
    message?: string,
  ) {
    super(message ?? `Feature '${feature}' requires the ${requiredPlan} plan`);
    this.name = "FeatureGateError";
  }
}

export function getPlanLimits(plan: PlanTier): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function checkNumericLimit(
  feature: "projects" | "teamMembers" | "apiKeys",
  currentCount: number,
): void {
  const { plan } = getTenantContext();
  const limits = PLAN_LIMITS[plan as PlanTier];
  const limit = limits[feature];

  if (currentCount >= limit) {
    const requiredPlan: PlanTier = plan === "free" ? "pro" : "enterprise";
    throw new FeatureGateError(
      feature,
      requiredPlan,
      `Limit of ${limit} ${feature} reached on the ${plan} plan`,
    );
  }
}

export function checkBooleanFeature(
  feature: "auditLog" | "customDomain" | "sso" | "prioritySupport",
): void {
  const { plan } = getTenantContext();
  const limits = PLAN_LIMITS[plan as PlanTier];
  if (!limits[feature]) {
    const requiredPlan: PlanTier = plan === "free" ? "pro" : "enterprise";
    throw new FeatureGateError(feature, requiredPlan);
  }
}

export function isFeatureEnabled(
  feature: "auditLog" | "customDomain" | "sso" | "prioritySupport",
  plan: PlanTier,
): boolean {
  return Boolean(PLAN_LIMITS[plan][feature]);
}
