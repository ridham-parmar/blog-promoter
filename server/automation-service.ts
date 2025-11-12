import { storage } from "./storage";
import type { MergeLog } from "@shared/schema";
import {
  listBlogPRs,
  mergePR,
  createPR,
  checkPRMergeable,
  checkStagingToMainPRExists,
} from "./github-service";

export async function runAutomation(): Promise<MergeLog[]> {
  const config = await storage.getConfig();
  const logs: MergeLog[] = [];

  if (!config.owner || !config.repo) {
    const errorLog = await storage.addLog({
      timestamp: new Date().toISOString(),
      branchName: "N/A",
      prNumber: 0,
      status: "failed",
      message: "Configuration incomplete: owner and repo must be set",
      stagingMerged: false,
      mainMerged: false,
    });
    logs.push(errorLog);
    return logs;
  }

  await storage.updateAutomationState({
    isRunning: true,
    currentOperation: "Scanning for blog PRs...",
  });

  try {
    const blogPRs = await listBlogPRs(
      config.owner,
      config.repo,
      config.branchPrefix,
      config.stagingBranch
    );

    if (blogPRs.length === 0) {
      const log = await storage.addLog({
        timestamp: new Date().toISOString(),
        branchName: "N/A",
        prNumber: 0,
        status: "skipped",
        message: `No open PRs found with prefix "${config.branchPrefix}"`,
        stagingMerged: false,
        mainMerged: false,
      });
      logs.push(log);
      await storage.updateAutomationState({
        isRunning: false,
        lastRun: new Date().toISOString(),
        currentOperation: null,
      });
      return logs;
    }

    for (const pr of blogPRs) {
      await storage.updateAutomationState({
        currentOperation: `Processing ${pr.head.ref} (PR #${pr.number})...`,
      });

      const isMergeable = await checkPRMergeable(config.owner, config.repo, pr.number);

      if (!isMergeable) {
        const log = await storage.addLog({
          timestamp: new Date().toISOString(),
          branchName: pr.head.ref,
          prNumber: pr.number,
          status: "skipped",
          message: "PR has conflicts or checks have not passed",
          stagingMerged: false,
          mainMerged: false,
        });
        logs.push(log);
        continue;
      }

      if (!config.autoMerge) {
        const log = await storage.addLog({
          timestamp: new Date().toISOString(),
          branchName: pr.head.ref,
          prNumber: pr.number,
          status: "skipped",
          message: "Auto-merge is disabled in configuration",
          stagingMerged: false,
          mainMerged: false,
        });
        logs.push(log);
        continue;
      }

      try {
        await mergePR(
          config.owner,
          config.repo,
          pr.number,
          `Merge ${pr.head.ref} into ${config.stagingBranch}`
        );

        await storage.updateAutomationState({
          currentOperation: `Creating PR from ${config.stagingBranch} to ${config.mainBranch}...`,
        });

        const existingPR = await checkStagingToMainPRExists(
          config.owner,
          config.repo,
          config.stagingBranch,
          config.mainBranch
        );

        let mainPRNumber: number;

        if (existingPR) {
          mainPRNumber = existingPR;
        } else {
          const today = new Date().toISOString().split("T")[0];
          const newPR = await createPR(
            config.owner,
            config.repo,
            `Promote blog to production - ${today}`,
            config.stagingBranch,
            config.mainBranch,
            `Automated promotion of blog content from ${config.stagingBranch} to ${config.mainBranch}`
          );
          mainPRNumber = newPR.number;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        const isMainMergeable = await checkPRMergeable(config.owner, config.repo, mainPRNumber);

        if (isMainMergeable) {
          await mergePR(
            config.owner,
            config.repo,
            mainPRNumber,
            `Merge ${config.stagingBranch} into ${config.mainBranch}`
          );

          const log = await storage.addLog({
            timestamp: new Date().toISOString(),
            branchName: pr.head.ref,
            prNumber: pr.number,
            status: "success",
            message: `Successfully merged to ${config.stagingBranch} and ${config.mainBranch}`,
            stagingMerged: true,
            mainMerged: true,
          });
          logs.push(log);
        } else {
          const log = await storage.addLog({
            timestamp: new Date().toISOString(),
            branchName: pr.head.ref,
            prNumber: pr.number,
            status: "success",
            message: `Merged to ${config.stagingBranch}, but ${config.mainBranch} PR #${mainPRNumber} needs manual review`,
            stagingMerged: true,
            mainMerged: false,
          });
          logs.push(log);
        }
      } catch (error) {
        const log = await storage.addLog({
          timestamp: new Date().toISOString(),
          branchName: pr.head.ref,
          prNumber: pr.number,
          status: "failed",
          message: `Failed to merge: ${error instanceof Error ? error.message : "Unknown error"}`,
          stagingMerged: false,
          mainMerged: false,
        });
        logs.push(log);
      }
    }
  } catch (error) {
    const log = await storage.addLog({
      timestamp: new Date().toISOString(),
      branchName: "N/A",
      prNumber: 0,
      status: "failed",
      message: `Automation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      stagingMerged: false,
      mainMerged: false,
    });
    logs.push(log);
  } finally {
    await storage.updateAutomationState({
      isRunning: false,
      lastRun: new Date().toISOString(),
      currentOperation: null,
    });
  }

  return logs;
}
