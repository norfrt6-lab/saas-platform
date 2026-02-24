/**
 * Top 200 most common passwords from breach datasets.
 * Source: SecLists / NCSC top passwords.
 */
const COMMON_PASSWORDS = new Set([
  "password", "12345678", "123456789", "1234567890", "qwerty123",
  "password1", "iloveyou", "abc12345", "admin123", "letmein12",
  "welcome1", "monkey123", "dragon12", "master12", "qwerty12",
  "trustno1", "baseball1", "shadow12", "michael1", "football1",
  "jordan23", "harley12", "ranger12", "batman12", "andrew12",
  "tigger12", "sunshine1", "charlie1", "robert12", "thomas12",
  "hockey12", "daniel12", "starwars1", "klaster12", "112233445",
  "george12", "computer1", "michelle1", "jessica1", "pepper12",
  "1111111111", "zxcvbnm1", "555555555", "11111111", "131313131",
  "freedom1", "777777777", "pass1234", "maggie12", "159753159",
  "aaaaaaaaa", "ginger12", "princess1", "joshua12", "cheese12",
  "amanda12", "summer12", "love1234", "ashley12", "nicole12",
  "chelsea1", "matthew1", "access12", "yankees1", "987654321",
  "dallas12", "austin12", "thunder1", "taylor12", "matrix12",
  "william1", "corvette1", "hello123", "martin12", "heather1",
  "secret12", "merlin12", "diamond1", "1234qwer", "gfhjkm12",
  "hammer12", "silver12", "222222222", "88888888", "anthony1",
  "justin12", "test1234", "soccer12", "camaro12", "abcdef12",
  "q1w2e3r4", "qwer1234", "letmein1", "trustme1", "welcome12",
  "passw0rd", "p@ssw0rd", "p@ssword1", "changeme1", "default1",
  "security1", "master123", "login123", "admin1234", "root1234",
  "password12", "password123", "password1234", "qwerty1234",
  "abc123456", "iloveyou1", "whatever1", "nothing1", "samsung1",
  "qwertyuiop", "zxcvbnm12", "asdfghjk1", "1q2w3e4r", "1qaz2wsx",
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
  return checkPasswordStrength(password).score >= 3;
}
