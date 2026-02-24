export type Plan = "free" | "pro" | "enterprise";

export interface PlanLimits {
  maxProjects: number;
  maxMembers: number;
  maxApiCallsPerMonth: number;
  maxFileUploadMB: number;
  maxApiKeys: number;
  features: string[];
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxProjects: 3,
    maxMembers: 2,
    maxApiCallsPerMonth: 1_000,
    maxFileUploadMB: 10,
    maxApiKeys: 1,
    features: ["basic_analytics"],
  },
  pro: {
    maxProjects: 50,
    maxMembers: 20,
    maxApiCallsPerMonth: 100_000,
    maxFileUploadMB: 100,
    maxApiKeys: 10,
    features: [
      "basic_analytics",
      "advanced_analytics",
      "custom_domain",
      "priority_support",
      "api_access",
      "audit_log",
      "data_export",
    ],
  },
  enterprise: {
    maxProjects: Infinity,
    maxMembers: Infinity,
    maxApiCallsPerMonth: Infinity,
    maxFileUploadMB: 1000,
    maxApiKeys: 100,
    features: ["*"],
  },
};

export function hasFeature(plan: Plan, feature: string): boolean {
  const limits = PLAN_LIMITS[plan];
  return limits.features.includes("*") || limits.features.includes(feature);
}

export function isWithinLimit(
  plan: Plan,
  resource: keyof Omit<PlanLimits, "features">,
  current: number,
): boolean {
  return current < PLAN_LIMITS[plan][resource];
}
