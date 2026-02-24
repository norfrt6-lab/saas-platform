export const APP_NAME = "SaaS Platform";
export const APP_DESCRIPTION =
  "Production-grade, multi-tenant SaaS platform with revenue-safe billing, tenant isolation, and observability.";

export const NAV_ITEMS = {
  main: [
    { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
    { label: "Projects", href: "/projects", icon: "FolderKanban" },
    { label: "Analytics", href: "/analytics", icon: "BarChart3" },
  ],
  settings: [
    { label: "General", href: "/settings", icon: "Settings" },
    { label: "Team", href: "/settings/team", icon: "Users" },
    { label: "Billing", href: "/settings/billing", icon: "CreditCard" },
    { label: "API Keys", href: "/settings/api-keys", icon: "Key" },
    { label: "Notifications", href: "/settings/notifications", icon: "Bell" },
    { label: "Audit Log", href: "/settings/audit-log", icon: "ScrollText" },
  ],
  admin: [
    { label: "Overview", href: "/admin", icon: "Shield" },
    { label: "Users", href: "/admin/users", icon: "Users" },
    { label: "Teams", href: "/admin/teams", icon: "Building2" },
    { label: "Subscriptions", href: "/admin/subscriptions", icon: "Receipt" },
    { label: "System", href: "/admin/system", icon: "Activity" },
  ],
} as const;

export const PRICING_TIERS = [
  {
    name: "Free",
    description: "For individuals and small projects",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "3 projects",
      "2 team members",
      "1,000 API calls/month",
      "10 MB file uploads",
      "Community support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    description: "For growing teams and businesses",
    monthlyPrice: 29,
    annualPrice: 23,
    features: [
      "50 projects",
      "20 team members",
      "100,000 API calls/month",
      "100 MB file uploads",
      "Priority support",
      "Advanced analytics",
      "Custom domain",
      "API access",
      "Audit log",
      "Data export",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    description: "For large organizations with custom needs",
    monthlyPrice: null,
    annualPrice: null,
    features: [
      "Unlimited projects",
      "Unlimited team members",
      "Unlimited API calls",
      "1 GB file uploads",
      "Dedicated support",
      "SSO/SAML",
      "99.9% SLA",
      "Dedicated schema isolation",
      "Custom integrations",
      "On-boarding assistance",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
] as const;
