import cron from "node-cron";
import { storage } from "./storage";
import { runAutomation } from "./automation-service";

let scheduledTask: cron.ScheduledTask | null = null;

export function startScheduler() {
  storage.getConfig().then(config => {
    if (scheduledTask) {
      scheduledTask.stop();
    }

    try {
      if (!cron.validate(config.cronSchedule)) {
        console.error(`[Scheduler] Invalid cron schedule: ${config.cronSchedule}`);
        return;
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
    } catch (error) {
      console.error(`[Scheduler] Failed to start scheduler:`, error);
    }
  }).catch(error => {
    console.error(`[Scheduler] Failed to get config:`, error);
  });
}

export function restartScheduler() {
  console.log("[Scheduler] Restarting scheduler with new configuration...");
  startScheduler();
}

export async function getNextScheduledRun(cronSchedule: string): Promise<Date | null> {
  try {
    const parser = require("cron-parser");
    const interval = parser.parseExpression(cronSchedule);
    const next = interval.next();
    return next.toDate();
  } catch (error) {
    console.error("[Scheduler] Failed to parse cron schedule:", error);
    return null;
  }
}
