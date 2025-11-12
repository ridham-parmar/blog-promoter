import type { MergeLog, Configuration } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getLogs(): Promise<MergeLog[]>;
  addLog(log: Omit<MergeLog, "id">): Promise<MergeLog>;
  clearLogs(): Promise<void>;
  
  getConfig(): Promise<Configuration>;
  updateConfig(config: Configuration): Promise<Configuration>;
  
  getAutomationState(): Promise<{
    isRunning: boolean;
    lastRun: string | null;
    currentOperation: string | null;
  }>;
  updateAutomationState(state: {
    isRunning?: boolean;
    lastRun?: string | null;
    currentOperation?: string | null;
  }): Promise<void>;
}

export class MemStorage implements IStorage {
  private logs: Map<string, MergeLog>;
  private config: Configuration;
  private automationState: {
    isRunning: boolean;
    lastRun: string | null;
    currentOperation: string | null;
  };

  constructor() {
    this.logs = new Map();
    this.config = {
      owner: "",
      repo: "",
      branchPrefix: "blog/",
      stagingBranch: "staging",
      mainBranch: "main",
      cronSchedule: "0 9 * * *",
      autoMerge: true,
    };
    this.automationState = {
      isRunning: false,
      lastRun: null,
      currentOperation: null,
    };
  }

  async getLogs(): Promise<MergeLog[]> {
    return Array.from(this.logs.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async addLog(log: Omit<MergeLog, "id">): Promise<MergeLog> {
    const id = randomUUID();
    const newLog: MergeLog = { ...log, id };
    this.logs.set(id, newLog);
    return newLog;
  }

  async clearLogs(): Promise<void> {
    this.logs.clear();
  }

  async getConfig(): Promise<Configuration> {
    return { ...this.config };
  }

  async updateConfig(config: Configuration): Promise<Configuration> {
    this.config = { ...config };
    return { ...this.config };
  }

  async getAutomationState() {
    return { ...this.automationState };
  }

  async updateAutomationState(state: {
    isRunning?: boolean;
    lastRun?: string | null;
    currentOperation?: string | null;
  }): Promise<void> {
    if (state.isRunning !== undefined) {
      this.automationState.isRunning = state.isRunning;
    }
    if (state.lastRun !== undefined) {
      this.automationState.lastRun = state.lastRun;
    }
    if (state.currentOperation !== undefined) {
      this.automationState.currentOperation = state.currentOperation;
    }
  }
}

export const storage = new MemStorage();
