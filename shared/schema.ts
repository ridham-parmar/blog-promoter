import { z } from "zod";

export const mergeLogSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  branchName: z.string(),
  prNumber: z.number(),
  status: z.enum(["success", "failed", "skipped"]),
  message: z.string(),
  stagingMerged: z.boolean(),
  mainMerged: z.boolean(),
});

export type MergeLog = z.infer<typeof mergeLogSchema>;

export const configurationSchema = z.object({
  owner: z.string().min(1, "Repository owner is required"),
  repo: z.string().min(1, "Repository name is required"),
  branchPrefix: z.string().default("blog/"),
  stagingBranch: z.string().default("staging"),
  mainBranch: z.string().default("main"),
  cronSchedule: z.string().default("0 9 * * *"),
  autoMerge: z.boolean().default(true),
});

export type Configuration = z.infer<typeof configurationSchema>;

export const automationStatusSchema = z.object({
  isRunning: z.boolean(),
  lastRun: z.string().nullable(),
  nextRun: z.string().nullable(),
  currentOperation: z.string().nullable(),
});

export type AutomationStatus = z.infer<typeof automationStatusSchema>;

export const pullRequestSchema = z.object({
  number: z.number(),
  title: z.string(),
  branch: z.string(),
  targetBranch: z.string(),
  mergeable: z.boolean().nullable(),
  state: z.string(),
  url: z.string(),
  createdAt: z.string(),
});

export type PullRequest = z.infer<typeof pullRequestSchema>;

export const manualTriggerResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  logsGenerated: z.number(),
});

export type ManualTriggerResponse = z.infer<typeof manualTriggerResponseSchema>;
