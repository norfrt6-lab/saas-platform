import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";

export const twoFactorSecrets = pgTable("two_factor_secrets", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  // AES-GCM encrypted TOTP secret — never stored in plaintext
  encryptedSecret: text("encrypted_secret").notNull(),
  // Hashed backup codes (sha256) — one-time use
  backupCodes: text("backup_codes").array().notNull().default([]),
  enabled: boolean("enabled").default(false).notNull(),
  verifiedAt: timestamp("verified_at"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const twoFactorRelations = relations(twoFactorSecrets, ({ one }) => ({
  user: one(users, {
    fields: [twoFactorSecrets.userId],
    references: [users.id],
  }),
}));

export type TwoFactorSecret = typeof twoFactorSecrets.$inferSelect;
