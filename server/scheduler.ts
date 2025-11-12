import cron from "node-cron";
import { storage } from "./storage";
import { runAutomation } from "./automation-service";

let scheduledTask: cron.ScheduledTask | null = null;

export function startScheduler() {
  storage.getConfig().then(config => {
    if (scheduledTask) {
      scheduledTask.stop();
    }

    scheduledTask = cron.schedule(config.cronSchedule, async () => {
      console.log(`[Scheduler] Running automated blog PR merge at ${new Date().toISOString()}`);
      try {
        const logs = await runAutomation();
        console.log(`[Scheduler] Automation completed. Generated ${logs.length} log entries`);
      } catch (error) {
        console.error(`[Scheduler] Automation failed:`, error);
      }
    });

    console.log(`[Scheduler] Started with schedule: ${config.cronSchedule}`);
  });
}

export function restartScheduler() {
  console.log("[Scheduler] Restarting scheduler with new configuration...");
  startScheduler();
}

export function getNextScheduledRun(cronSchedule: string): Date | null {
  try {
    const task = cron.schedule(cronSchedule, () => {});
    const now = new Date();
    
    const parts = cronSchedule.split(' ');
    if (parts.length !== 5) return null;
    
    const [minute, hour] = parts;
    const nextRun = new Date(now);
    nextRun.setHours(parseInt(hour), parseInt(minute), 0, 0);
    
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    task.stop();
    return nextRun;
  } catch (error) {
    console.error("[Scheduler] Failed to calculate next run:", error);
    return null;
  }
}
