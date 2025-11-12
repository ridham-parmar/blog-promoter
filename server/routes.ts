import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { runAutomation } from "./automation-service";
import { restartScheduler, getNextScheduledRun } from "./scheduler";
import { configurationSchema, type Configuration, type AutomationStatus, type MergeLog } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/status", async (req, res) => {
    try {
      const state = await storage.getAutomationState();
      const config = await storage.getConfig();
      const nextRun = getNextScheduledRun(config.cronSchedule);

      const status: AutomationStatus = {
        isRunning: state.isRunning,
        lastRun: state.lastRun,
        nextRun: nextRun ? nextRun.toISOString() : null,
        currentOperation: state.currentOperation,
      };

      res.json(status);
    } catch (error) {
      console.error("Failed to get status:", error);
      res.status(500).json({ error: "Failed to get automation status" });
    }
  });

  app.get("/api/logs", async (req, res) => {
    try {
      const logs = await storage.getLogs();
      res.json(logs);
    } catch (error) {
      console.error("Failed to get logs:", error);
      res.status(500).json({ error: "Failed to get logs" });
    }
  });

  app.delete("/api/logs", async (req, res) => {
    try {
      await storage.clearLogs();
      res.json({ success: true, message: "Logs cleared successfully" });
    } catch (error) {
      console.error("Failed to clear logs:", error);
      res.status(500).json({ error: "Failed to clear logs" });
    }
  });

  app.get("/api/config", async (req, res) => {
    try {
      const config = await storage.getConfig();
      res.json(config);
    } catch (error) {
      console.error("Failed to get config:", error);
      res.status(500).json({ error: "Failed to get configuration" });
    }
  });

  app.post("/api/config", async (req, res) => {
    try {
      const validated = configurationSchema.parse(req.body);
      const updated = await storage.updateConfig(validated);
      restartScheduler();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update config:", error);
      if (error instanceof Error && 'errors' in error) {
        res.status(400).json({ error: "Invalid configuration", details: error });
      } else {
        res.status(500).json({ error: "Failed to update configuration" });
      }
    }
  });

  app.post("/api/trigger", async (req, res) => {
    try {
      const state = await storage.getAutomationState();
      if (state.isRunning) {
        return res.status(409).json({ 
          success: false,
          message: "Automation is already running",
          logsGenerated: 0,
        });
      }

      const logs = await runAutomation();
      
      res.json({
        success: true,
        message: `Automation completed. Processed ${logs.length} operation(s)`,
        logsGenerated: logs.length,
      });
    } catch (error) {
      console.error("Failed to trigger automation:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to run automation",
        logsGenerated: 0,
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
