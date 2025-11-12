import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Clock, Calendar, Play, CheckCircle2 } from "lucide-react";
import type { Configuration, AutomationStatus } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Scheduler() {
  const { data: config, isLoading: configLoading } = useQuery<Configuration>({
    queryKey: ["/api/config"],
  });

  const { data: status, isLoading: statusLoading } = useQuery<AutomationStatus>({
    queryKey: ["/api/status"],
    refetchInterval: 5000,
  });

  const parseCronSchedule = (cron: string) => {
    const parts = cron.split(" ");
    if (parts.length !== 5) return "Invalid schedule";
    
    const [minute, hour] = parts;
    return `Daily at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getNextRunCountdown = () => {
    if (!status?.nextRun) return null;
    const now = new Date();
    const next = new Date(status.nextRun);
    const diff = next.getTime() - now.getTime();
    
    if (diff < 0) return "Calculating...";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} days, ${hours % 24} hours`;
    }
    
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold leading-tight" data-testid="text-page-title">Scheduler</h1>
          <p className="text-sm text-muted-foreground mt-1">Automated execution schedule and timing</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card data-testid="card-schedule-info">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Schedule Configuration
              </CardTitle>
              <CardDescription>Current automation timing settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {configLoading ? (
                <>
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Cron Expression
                    </label>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="font-mono text-sm bg-muted px-3 py-2 rounded-md flex-1">
                        {config?.cronSchedule || "0 9 * * *"}
                      </code>
                      <Badge variant="outline" className="shrink-0">
                        {parseCronSchedule(config?.cronSchedule || "0 9 * * *")}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Auto-Merge Enabled
                    </label>
                    <div className="mt-2 flex items-center gap-2">
                      {config?.autoMerge ? (
                        <Badge className="bg-status-online text-white border-0">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-next-run">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Next Execution
              </CardTitle>
              <CardDescription>Upcoming scheduled run details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {statusLoading ? (
                <>
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Scheduled Time
                    </label>
                    <div className="mt-2 text-sm font-medium">
                      {formatDate(status?.nextRun || null)}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Time Remaining
                    </label>
                    <div className="mt-2 text-sm font-medium">
                      {getNextRunCountdown() || "Not scheduled"}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-execution-history">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Execution History</CardTitle>
            <CardDescription>Recent automation runs</CardDescription>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Play className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Last Execution</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(status?.lastRun || null)}
                      </div>
                    </div>
                  </div>
                  {status?.lastRun ? (
                    <Badge className="bg-status-online text-white border-0">Completed</Badge>
                  ) : (
                    <Badge variant="secondary">Never run</Badge>
                  )}
                </div>
                
                {status?.isRunning && (
                  <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <div>
                        <div className="text-sm font-medium">Current Execution</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {status.currentOperation || "Processing..."}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-primary text-primary">Running</Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-muted-foreground/20">
          <CardHeader>
            <CardTitle className="text-lg font-medium">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">1</span>
              </div>
              <div>
                <div className="font-medium">Detect Blog PRs</div>
                <div className="text-muted-foreground text-xs mt-1">
                  Scans for open pull requests with branches starting with <code className="font-mono bg-muted px-1.5 py-0.5 rounded">blog/</code> targeting the staging branch
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">2</span>
              </div>
              <div>
                <div className="font-medium">Merge to Staging</div>
                <div className="text-muted-foreground text-xs mt-1">
                  Verifies the PR is mergeable (no conflicts, checks passed) and automatically merges it into staging
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">3</span>
              </div>
              <div>
                <div className="font-medium">Promote to Main</div>
                <div className="text-muted-foreground text-xs mt-1">
                  Creates a new PR from staging to main and merges it automatically for production deployment
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
