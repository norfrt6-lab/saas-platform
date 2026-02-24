import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PasswordResetEmailProps {
  resetUrl: string;
}

export function PasswordResetEmail({ resetUrl }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Password Reset</Heading>
          <Text style={text}>
            We received a request to reset your password. Click the button below
            to choose a new password.
          </Text>
          <Section style={buttonSection}>
            <Link href={resetUrl} style={button}>
              Reset Password
            </Link>
          </Section>
          <Text style={footer}>
            This link expires in 1 hour. If you did not request a password
            reset, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: "#f6f9fc", fontFamily: "system-ui, sans-serif" };
const container = { margin: "40px auto", padding: "20px", maxWidth: "480px", backgroundColor: "#ffffff", borderRadius: "8px" };
const heading = { fontSize: "24px", fontWeight: "bold" as const, marginBottom: "16px" };
const text = { fontSize: "14px", lineHeight: "24px", color: "#333" };
const buttonSection = { textAlign: "center" as const, margin: "32px 0" };
const button = { backgroundColor: "#000", color: "#fff", padding: "12px 24px", borderRadius: "6px", textDecoration: "none", fontSize: "14px", fontWeight: "600" as const };
const footer = { fontSize: "12px", color: "#666", marginTop: "32px" };
