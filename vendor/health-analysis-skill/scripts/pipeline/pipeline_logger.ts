/**
 * Pipeline Run Logger
 *
 * Writes a JSON-lines log file per pipeline run so failures can be
 * reconstructed. Each line is a JSON object with: step name, duration_ms,
 * status (ok | error | skipped), and optional error message.
 *
 * Output: output/pipeline-run-{timestamp}.jsonl
 */

import * as fs from 'fs';
import * as path from 'path';

export interface StepLogEntry {
  step: string;
  duration_ms: number;
  status: 'ok' | 'error' | 'skipped';
  error?: string;
  timestamp: string;
}

export class PipelineLogger {
  private logPath: string;
  private entries: StepLogEntry[] = [];
  private writable: boolean = true;

  constructor(outputDir: string, userId: string) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    this.logPath = path.join(outputDir, `pipeline-run-${userId}-${ts}.jsonl`);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write header (machine-readable metadata line)
    const header = {
      event: 'pipeline_start',
      user_id: userId,
      started_at: new Date().toISOString(),
    };
    fs.writeFileSync(this.logPath, JSON.stringify(header) + '\n');
  }

  /**
   * Track a pipeline step, measuring its duration and catching any errors.
   * Returns the result of the step function, or undefined if it threw.
   */
  trackStep<T>(
    step: string,
    fn: () => T
  ): T | undefined {
    if (!this.writable) {
      try { return fn(); } catch { return undefined; }
    }

    const start = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - start;
      this.writeEntry({ step, duration_ms: duration, status: 'ok', timestamp: new Date().toISOString() });
      return result;
    } catch (err: any) {
      const duration = Date.now() - start;
      this.writeEntry({
        step,
        duration_ms: duration,
        status: 'error',
        error: err.message || String(err),
        timestamp: new Date().toISOString(),
      });
      throw err;
    }
  }

  /**
   * Track an async pipeline step.
   */
  async trackStepAsync<T>(
    step: string,
    fn: () => Promise<T>
  ): Promise<T | undefined> {
    if (!this.writable) {
      try { return await fn(); } catch { return undefined; }
    }

    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.writeEntry({ step, duration_ms: duration, status: 'ok', timestamp: new Date().toISOString() });
      return result;
    } catch (err: any) {
      const duration = Date.now() - start;
      this.writeEntry({
        step,
        duration_ms: duration,
        status: 'error',
        error: err.message || String(err),
        timestamp: new Date().toISOString(),
      });
      throw err;
    }
  }

  /**
   * Log a step that was skipped (e.g., because a prerequisite step failed).
   */
  logSkipped(step: string, reason: string): void {
    this.writeEntry({
      step,
      duration_ms: 0,
      status: 'skipped',
      error: reason,
      timestamp: new Date().toISOString(),
    });
  }

  close(): void {
    const footer = {
      event: 'pipeline_end',
      finished_at: new Date().toISOString(),
      total_steps: this.entries.length,
      errors: this.entries.filter(e => e.status === 'error').length,
    };
    try {
      fs.appendFileSync(this.logPath, JSON.stringify(footer) + '\n');
    } catch {}
  }

  getLogPath(): string {
    return this.logPath;
  }

  /**
   * Log an entry directly (for use when timing is tracked externally).
   */
  logEntry(entry: StepLogEntry): void {
    this.writeEntry(entry);
  }

  private writeEntry(entry: StepLogEntry): void {
    this.entries.push(entry);
    try {
      fs.appendFileSync(this.logPath, JSON.stringify(entry) + '\n');
    } catch {
      this.writable = false;
    }
  }
}
