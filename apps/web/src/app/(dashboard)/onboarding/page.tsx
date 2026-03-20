"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

const STEPS = ["workspace", "invite", "project", "done"] as const;
type Step = (typeof STEPS)[number];

const workspaceSchema = z.object({
  name: z.string().min(2).max(64),
  slug: z.string().min(2).max(32).regex(/^[a-z0-9-]+$/),
});

const inviteSchema = z.object({
  emails: z.array(z.string().email()).min(0).max(10),
});

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

function WorkspaceStep({ onNext }: StepProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const result = workspaceSchema.safeParse({ name, slug });
    if (!result.success) {
      setError(result.error.errors[0]?.message ?? "Invalid input");
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Name your workspace</h2>
      <input
        className="border rounded px-3 py-2"
        placeholder="Acme Corp"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="border rounded px-3 py-2"
        placeholder="acme-corp"
        value={slug}
        onChange={(e) => setSlug(e.target.value.toLowerCase())}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        className="bg-blue-600 text-white rounded px-4 py-2 self-end"
        onClick={handleSubmit}
      >
        Continue
      </button>
    </div>
  );
}

function InviteStep({ onNext, onBack }: StepProps) {
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState<string[]>([]);

  const addEmail = () => {
    const result = z.string().email().safeParse(email.trim());
    if (result.success && !emails.includes(result.data)) {
      setEmails((prev) => [...prev, result.data]);
      setEmail("");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Invite teammates</h2>
      <div className="flex gap-2">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="colleague@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addEmail()}
        />
        <button className="border rounded px-3 py-2" onClick={addEmail}>
          Add
        </button>
      </div>
      <ul className="text-sm text-gray-600">
        {emails.map((e) => <li key={e}>{e}</li>)}
      </ul>
      <div className="flex justify-between">
        <button className="text-gray-500 underline" onClick={onBack}>Back</button>
        <button className="bg-blue-600 text-white rounded px-4 py-2" onClick={onNext}>
          {emails.length === 0 ? "Skip" : "Send Invites"}
        </button>
      </div>
    </div>
  );
}

function DoneStep() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="text-4xl">🎉</div>
      <h2 className="text-2xl font-bold">You're all set!</h2>
      <p className="text-gray-500">Your workspace is ready. Start building.</p>
      <button
        className="bg-blue-600 text-white rounded px-6 py-2"
        onClick={() => router.push("/dashboard")}
      >
        Go to Dashboard
      </button>
    </div>
  );
}

export default function OnboardingPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = STEPS[stepIndex];

  const next = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md">
        <div className="flex gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-blue-600" : "bg-gray-200"}`}
            />
          ))}
        </div>
        {currentStep === "workspace" && <WorkspaceStep onNext={next} />}
        {currentStep === "invite" && <InviteStep onNext={next} onBack={back} />}
        {(currentStep === "project" || currentStep === "done") && <DoneStep />}
      </div>
    </div>
  );
}
