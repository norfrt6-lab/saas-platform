import { createChildLogger } from "@saas/logger";

const log = createChildLogger({ module: "jobs" });

export interface Job<T = unknown> {
  id: string;
  name: string;
  payload: T;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledAt: Date;
  status: "pending" | "processing" | "completed" | "failed" | "dead";
  error?: string;
}

export interface JobOptions {
  maxAttempts?: number;
  delay?: number;
  priority?: number;
}

export type JobHandler<T = unknown> = (payload: T) => Promise<void>;

const handlers = new Map<string, JobHandler>();
const jobs: Job[] = [];
let processing = false;

export class JobQueue {
  static register<T>(name: string, handler: JobHandler<T>) {
    handlers.set(name, handler as JobHandler);
    log.info({ job: name }, "Job handler registered");
  }

  static async enqueue<T>(
    name: string,
    payload: T,
    options: JobOptions = {},
  ): Promise<string> {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const job: Job<T> = {
      id,
      name,
      payload,
      attempts: 0,
      maxAttempts: options.maxAttempts ?? 3,
      createdAt: new Date(),
      scheduledAt: new Date(Date.now() + (options.delay ?? 0)),
      status: "pending",
    };

    jobs.push(job as Job);
    log.info({ jobId: id, name, payload }, "Job enqueued");

    // Process in next tick
    if (!processing) {
      setImmediate(() => JobQueue.process());
    }

    return id;
  }

  static async process() {
    if (processing) return;
    processing = true;

    try {
      const now = new Date();
      const pendingJobs = jobs.filter(
        (j) => j.status === "pending" && j.scheduledAt <= now,
      );

      for (const job of pendingJobs) {
        const handler = handlers.get(job.name);
        if (!handler) {
          log.error({ jobId: job.id, name: job.name }, "No handler found");
          job.status = "dead";
          continue;
        }

        job.status = "processing";
        job.attempts++;

        try {
          await handler(job.payload);
          job.status = "completed";
          log.info(
            { jobId: job.id, name: job.name, attempts: job.attempts },
            "Job completed",
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          job.error = message;

          if (job.attempts >= job.maxAttempts) {
            job.status = "dead";
            log.error(
              { jobId: job.id, name: job.name, error: message, attempts: job.attempts },
              "Job moved to dead letter queue",
            );
          } else {
            // Exponential backoff
            const delay = Math.pow(2, job.attempts) * 1000;
            job.scheduledAt = new Date(Date.now() + delay);
            job.status = "pending";
            log.warn(
              { jobId: job.id, name: job.name, retryIn: delay, attempts: job.attempts },
              "Job failed, retrying",
            );
          }
        }
      }
    } finally {
      processing = false;
    }
  }

  static getStats() {
    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === "pending").length,
      processing: jobs.filter((j) => j.status === "processing").length,
      completed: jobs.filter((j) => j.status === "completed").length,
      failed: jobs.filter((j) => j.status === "failed").length,
      dead: jobs.filter((j) => j.status === "dead").length,
    };
  }
}
