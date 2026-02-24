const COMMON_PASSWORDS = new Set([
  "password",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty123",
  "password1",
  "iloveyou",
  "abc12345",
  "admin123",
  "letmein12",
  "welcome1",
  "monkey123",
  "dragon12",
  "master12",
  "qwerty12",
]);

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Cap at 4
  score = Math.min(score, 4);

  if (password.length < 8) {
    feedback.push("Use at least 8 characters");
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push("Add an uppercase letter");
  }

  if (!/\d/.test(password)) {
    feedback.push("Add a number");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push("Add a special character");
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    score = 0;
    feedback.unshift("This password is too common");
  }

  return { score, feedback };
}

export function isPasswordStrong(password: string): boolean {
  return checkPasswordStrength(password).score >= 2;
}
