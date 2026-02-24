import { db } from "./client";
import { users, teams, teamMembers, projects } from "./schema";
import { createId } from "@paralleldrive/cuid2";

async function seed() {
  console.log("Seeding database...");

  // Create admin user
  const adminId = createId();
  await db.insert(users).values({
    id: adminId,
    name: "Admin User",
    email: "admin@saas-platform.com",
    emailVerified: true,
    role: "admin",
  });

  // Create demo user
  const userId = createId();
  await db.insert(users).values({
    id: userId,
    name: "John Doe",
    email: "john@example.com",
    emailVerified: true,
    role: "user",
  });

  // Create demo team
  const teamId = createId();
  await db.insert(teams).values({
    id: teamId,
    name: "Acme Inc",
    slug: "acme",
    plan: "pro",
    billingStatus: "active",
  });

  // Add members
  await db.insert(teamMembers).values([
    { userId: adminId, teamId, role: "owner" },
    { userId, teamId, role: "member" },
  ]);

  // Create demo projects
  await db.insert(projects).values([
    {
      name: "API Gateway",
      slug: "api-gateway",
      description: "Core API gateway service",
      teamId,
      status: "active",
    },
    {
      name: "Mobile App",
      slug: "mobile-app",
      description: "React Native mobile application",
      teamId,
      status: "active",
    },
    {
      name: "Marketing Site",
      slug: "marketing-site",
      description: "Public marketing website",
      teamId,
      status: "active",
    },
  ]);

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
