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

interface WelcomeEmailProps {
  userName: string;
  loginUrl: string;
}

export function WelcomeEmail({ userName, loginUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to SaaS Platform</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Welcome, {userName}!</Heading>
          <Text style={text}>
            Your account has been created successfully. You&apos;re all set to
            start building with SaaS Platform.
          </Text>
          <Text style={text}>Here&apos;s what you can do next:</Text>
          <Text style={text}>
            1. Create your first team{"\n"}
            2. Invite your colleagues{"\n"}
            3. Start a new project
          </Text>
          <Section style={buttonSection}>
            <Link href={loginUrl} style={button}>
              Go to Dashboard
            </Link>
          </Section>
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
