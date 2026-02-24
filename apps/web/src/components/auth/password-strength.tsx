"use client";

import { checkPasswordStrength } from "@saas/auth/password";
import { useMemo } from "react";

const STRENGTH_LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
const STRENGTH_COLORS = [
  "bg-destructive",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-green-600",
];

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => checkPasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < strength.score
                ? STRENGTH_COLORS[strength.score]
                : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {STRENGTH_LABELS[strength.score]}
        {strength.feedback.length > 0 && ` — ${strength.feedback[0]}`}
      </p>
    </div>
  );
}
