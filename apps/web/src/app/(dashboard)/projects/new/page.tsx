import type { Metadata } from "next";

import { CreateProjectForm } from "@/components/projects/create-project-form";
import { requireAuth } from "@/lib/auth-guard";

export const metadata: Metadata = {
  title: "Create Project",
};

export default async function NewProjectPage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Project</h1>
        <p className="text-muted-foreground">
          Set up a new project for your team
        </p>
      </div>
      <CreateProjectForm />
    </div>
  );
}
