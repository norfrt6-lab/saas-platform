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
  completedAt: Date | null;
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

/**
 * Job queue with bounded in-memory buffer and proper lifecycle management.
 *
 * Architecture note: For production deployments at scale, replace this with
 * pg-boss, BullMQ+Redis, or graphile-worker. This implementation is suitable
 * for single-instance deployments and correctly handles the job lifecycle,
 * but does not persist jobs across process restarts.
 *
 * To migrate: implement the `JobStore` interface with your chosen backend.
 */

interface JobStore {
  add(job: Job): Promise<void>;
  getPending(limit: number): Promise<Job[]>;
  update(job: Job): Promise<void>;
  remove(id: string): Promise<void>;
  getStats(): Promise<JobStats>;
}

interface JobStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  dead: number;
}

const MAX_COMPLETED_RETENTION = 1000;
const COMPLETED_CLEANUP_THRESHOLD = 1500;

class InMemoryJobStore implements JobStore {
  private jobs = new Map<string, Job>();

  async add(job: Job) {
    this.jobs.set(job.id, job);
    this.cleanup();
  }

  async getPending(limit: number) {
    const now = new Date();
    const pending: Job[] = [];
    for (const job of this.jobs.values()) {
      if (job.status === "pending" && job.scheduledAt <= now) {
        pending.push(job);
        if (pending.length >= limit) break;
      }
    }
    return pending;
  }

  async update(job: Job) {
    this.jobs.set(job.id, job);
  }

  async remove(id: string) {
    this.jobs.delete(id);
  }

  async getStats(): Promise<JobStats> {
    const stats: JobStats = { total: 0, pending: 0, processing: 0, completed: 0, failed: 0, dead: 0 };
    for (const job of this.jobs.values()) {
      stats.total++;
      stats[job.status as keyof Omit<JobStats, "total">]++;
    }
    return stats;
  }

  private cleanup() {
    if (this.jobs.size < COMPLETED_CLEANUP_THRESHOLD) return;

    const completed: Job[] = [];
    for (const job of this.jobs.values()) {
      if (job.status === "completed" || job.status === "dead") {
        completed.push(job);
      }
    }

    // Remove oldest completed/dead jobs beyond retention limit
    if (completed.length > MAX_COMPLETED_RETENTION) {
      completed.sort(
        (a, b) => (a.completedAt?.getTime() ?? 0) - (b.completedAt?.getTime() ?? 0),
      );
      const toRemove = completed.slice(0, completed.length - MAX_COMPLETED_RETENTION);
      for (const job of toRemove) {
        this.jobs.delete(job.id);
      }
    }
  }
}

const store: JobStore = new InMemoryJobStore();
let processing = false;
let processTimer: ReturnType<typeof setInterval> | null = null;

export class JobQueue {
  static register<T>(name: string, handler: JobHandler<T>) {
    handlers.set(name, handler as JobHandler);
    log.info({ job: name }, "Job handler registered");

    // Start processing loop when first handler registers
    if (!processTimer) {
      processTimer = setInterval(() => JobQueue.process(), 5000);
      if (processTimer.unref) processTimer.unref();
    }
  }

  static async enqueue<T>(
    name: string,
    payload: T,
    options: JobOptions = {},
  ): Promise<string> {
    const id = `job_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const job: Job<T> = {
      id,
      name,
      payload,
      attempts: 0,
      maxAttempts: options.maxAttempts ?? 3,
      createdAt: new Date(),
      scheduledAt: new Date(Date.now() + (options.delay ?? 0)),
      completedAt: null,
      status: "pending",
    };

    await store.add(job as Job);
    log.info({ jobId: id, name }, "Job enqueued");

    // Trigger immediate processing
    if (!processing) {
      setImmediate(() => JobQueue.process());
    }

    return id;
  }

  static async process() {
    if (processing) return;
    processing = true;

    try {
      const pendingJobs = await store.getPending(10);

      for (const job of pendingJobs) {
        const handler = handlers.get(job.name);
        if (!handler) {
          log.error({ jobId: job.id, name: job.name }, "No handler found");
          job.status = "dead";
          job.completedAt = new Date();
          await store.update(job);
          continue;
        }

        job.status = "processing";
        job.attempts++;
        await store.update(job);

        try {
          await handler(job.payload);
          job.status = "completed";
          job.completedAt = new Date();
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
            job.completedAt = new Date();
            log.error(
              { jobId: job.id, name: job.name, error: message, attempts: job.attempts },
              "Job moved to dead letter queue",
            );
          } else {
            const delay = Math.pow(2, job.attempts) * 1000 + Math.random() * 1000;
            job.scheduledAt = new Date(Date.now() + delay);
            job.status = "pending";
            log.warn(
              { jobId: job.id, name: job.name, retryIn: delay, attempts: job.attempts },
              "Job failed, retrying",
            );
          }
        }

        await store.update(job);
      }
    } finally {
      processing = false;
    }
  }

  static async getStats(): Promise<JobStats> {
    return store.getStats();
  }
}
