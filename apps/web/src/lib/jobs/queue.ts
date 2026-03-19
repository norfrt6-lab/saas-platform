export type JobStatus = "pending" | "running" | "done" | "failed" | "retrying";

export interface Job<T = unknown> {
  id: string;
  name: string;
  payload: T;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  nextRunAt: Date;
  createdAt: Date;
  completedAt: Date | null;
}

export type JobHandler<T = unknown> = (payload: T, job: Job<T>) => Promise<void>;

interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

function computeBackoff(attempt: number, baseMs: number, maxMs: number): number {
  // Exponential backoff with jitter: 2^attempt * base + random jitter
  const exp = Math.min(Math.pow(2, attempt) * baseMs, maxMs);
  const jitter = Math.random() * exp * 0.2;
  return Math.floor(exp + jitter);
}

const jobStore = new Map<string, Job>();
const handlers = new Map<string, JobHandler>();

export function registerHandler<T>(name: string, handler: JobHandler<T>): void {
  handlers.set(name, handler as JobHandler);
}

export async function enqueue<T>(
  name: string,
  payload: T,
  opts: RetryOptions & { runAt?: Date } = {},
): Promise<Job<T>> {
  const job: Job<T> = {
    id: crypto.randomUUID(),
    name,
    payload,
    status: "pending",
    attempts: 0,
    maxAttempts: opts.maxAttempts ?? 3,
    lastError: null,
    nextRunAt: opts.runAt ?? new Date(),
    createdAt: new Date(),
    completedAt: null,
  };

  jobStore.set(job.id, job as Job);
  return job;
}

export async function processJob(jobId: string): Promise<void> {
  const job = jobStore.get(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);
  if (job.status === "done" || job.status === "running") return;

  const handler = handlers.get(job.name);
  if (!handler) throw new Error(`No handler registered for job type '${job.name}'`);

  const baseDelayMs = 1000;
  const maxDelayMs = 60000;

  jobStore.set(jobId, { ...job, status: "running", attempts: job.attempts + 1 });

  try {
    await handler(job.payload, { ...job, status: "running", attempts: job.attempts + 1 });
    jobStore.set(jobId, {
      ...job,
      status: "done",
      completedAt: new Date(),
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const updatedAttempts = job.attempts + 1;

    if (updatedAttempts >= job.maxAttempts) {
      jobStore.set(jobId, { ...job, status: "failed", attempts: updatedAttempts, lastError: errorMessage });
      console.error(`Job ${jobId} (${job.name}) permanently failed after ${updatedAttempts} attempts: ${errorMessage}`);
    } else {
      const delayMs = computeBackoff(updatedAttempts, baseDelayMs, maxDelayMs);
      const nextRunAt = new Date(Date.now() + delayMs);
      jobStore.set(jobId, {
        ...job,
        status: "retrying",
        attempts: updatedAttempts,
        lastError: errorMessage,
        nextRunAt,
      });
      console.warn(`Job ${jobId} failed, retrying in ${delayMs}ms (attempt ${updatedAttempts}/${job.maxAttempts})`);
    }
  }
}

export function getJob(jobId: string): Job | null {
  return jobStore.get(jobId) ?? null;
}

export function getPendingJobs(): Job[] {
  const now = new Date();
  return Array.from(jobStore.values()).filter(
    (j) => (j.status === "pending" || j.status === "retrying") && j.nextRunAt <= now,
  );
}
