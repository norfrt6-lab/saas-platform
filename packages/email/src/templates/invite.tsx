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

interface InviteEmailProps {
  teamName: string;
  inviterName: string;
  inviteUrl: string;
  role: string;
}

export function InviteEmail({
  teamName,
  inviterName,
  inviteUrl,
  role,
}: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} invited you to join {teamName}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Team Invitation</Heading>
          <Text style={text}>
            <strong>{inviterName}</strong> has invited you to join{" "}
            <strong>{teamName}</strong> as a <strong>{role}</strong>.
          </Text>
          <Section style={buttonSection}>
            <Link href={inviteUrl} style={button}>
              Accept Invitation
            </Link>
          </Section>
          <Text style={footer}>
            This invitation expires in 7 days. If you did not expect this
            invitation, you can safely ignore this email.
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
