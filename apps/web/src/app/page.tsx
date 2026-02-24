import { Badge } from "@saas/ui/badge";
import { Button } from "@saas/ui/button";
import {
  Activity,
  ArrowRight,
  Check,
  Code,
  CreditCard,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Users,
    title: "Multi-Tenant",
    description:
      "Shared database with row-level isolation. AsyncLocalStorage context propagation ensures zero data leaks between tenants.",
  },
  {
    icon: CreditCard,
    title: "Stripe Billing",
    description:
      "Subscription management, metered billing, dunning flow, and self-service portal. Webhook idempotency built in.",
  },
  {
    icon: Shield,
    title: "Security First",
    description:
      "SHA-256 API key hashing, rate limiting, CSRF protection, scoped access control, and immutable audit logging.",
  },
  {
    icon: Code,
    title: "Public API",
    description:
      "RESTful API with versioning, Bearer token auth, rate limit headers, cursor pagination, and scoped permissions.",
  },
  {
    icon: Zap,
    title: "Background Jobs",
    description:
      "Job queue with exponential backoff, dead letter queue, and structured logging for reliable async processing.",
  },
  {
    icon: Activity,
    title: "Observability",
    description:
      "Health endpoints, structured logging with secret redaction, request duration tracking, and incident runbooks.",
  },
];

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    description: "For individuals and small teams",
    features: ["3 projects", "2 team members", "1,000 API calls/mo", "Community support"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For growing teams",
    features: [
      "50 projects",
      "20 team members",
      "100K API calls/mo",
      "Custom domains",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations",
    features: [
      "Unlimited everything",
      "SSO/SAML",
      "Dedicated support",
      "SLA guarantee",
      "Custom integrations",
      "On-premise option",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">
                S
              </span>
            </div>
            <span className="text-lg font-semibold">SaaS Platform</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-24 text-center md:py-32">
        <Badge variant="secondary" className="mb-4">
          Now in Public Beta
        </Badge>
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
          The platform for building{" "}
          <span className="text-primary">production-grade SaaS</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Multi-tenant architecture, Stripe billing, team management, and
          everything you need to ship your SaaS product. Built with Next.js 15,
          TypeScript, and Drizzle ORM.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/auth/register">
            <Button size="lg">
              Start Building
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Everything you need
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Production-ready features built with senior engineering practices
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <feature.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free, scale as you grow
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-lg border p-8 ${
                  tier.highlighted
                    ? "border-primary bg-primary/5 shadow-lg"
                    : ""
                }`}
              >
                {tier.highlighted && (
                  <Badge className="mb-4">Most Popular</Badge>
                )}
                <h3 className="text-xl font-semibold">{tier.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  {tier.period && (
                    <span className="text-muted-foreground">{tier.period}</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {tier.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-8 w-full"
                  variant={tier.highlighted ? "default" : "outline"}
                >
                  {tier.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <span className="text-xs font-bold text-primary-foreground">
                  S
                </span>
              </div>
              <span className="text-sm font-medium">SaaS Platform</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with Next.js 15, TypeScript, Drizzle ORM, and Stripe
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
