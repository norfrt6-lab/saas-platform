import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
      <div className="hidden bg-muted lg:flex lg:flex-1 lg:items-center lg:justify-center">
        <div className="max-w-md space-y-4 px-8">
          <h2 className="text-3xl font-bold tracking-tight">
            Build faster with our platform
          </h2>
          <p className="text-muted-foreground">
            Multi-tenant SaaS infrastructure so you can focus on what matters —
            shipping your product.
          </p>
        </div>
      </div>
    </div>
  );
}
