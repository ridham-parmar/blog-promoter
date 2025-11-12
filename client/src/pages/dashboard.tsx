import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Play, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AutomationStatus, MergeLog, Configuration, ManualTriggerResponse } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { toast } = useToast();

  const { data: status, isLoading: statusLoading } = useQuery<AutomationStatus>({
    queryKey: ["/api/status"],
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery<MergeLog[]>({
    queryKey: ["/api/logs"],
    refetchInterval: 10000,
  });

  const { data: config } = useQuery<Configuration>({
    queryKey: ["/api/config"],
  });

  const triggerMutation = useMutation({
    mutationFn: () => apiRequest<ManualTriggerResponse>("POST", "/api/trigger", {}),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      toast({
        title: "Automation triggered",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to trigger automation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const recentLogs = logs.slice(0, 5);

  const getStatusBadge = (logStatus: string) => {
    switch (logStatus) {
      case "success":
        return (
          <Badge className="bg-status-online text-white border-0" data-testid={`badge-status-success`}>
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Success
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" data-testid={`badge-status-failed`}>
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "skipped":
        return (
          <Badge variant="secondary" data-testid={`badge-status-skipped`}>
            <AlertCircle className="w-3 h-3 mr-1" />
            Skipped
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getNextRunCountdown = () => {
    if (!status?.nextRun) return "Not scheduled";
    const now = new Date();
    const next = new Date(status.nextRun);
    const diff = next.getTime() - now.getTime();
    
    if (diff < 0) return "Calculating...";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold leading-tight" data-testid="text-page-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor and control your blog PR automation</p>
        </div>

        <Card className="border-primary/20 bg-card" data-testid="card-manual-trigger">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium">Manual Trigger</CardTitle>
            <CardDescription>Run the automation process immediately</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => triggerMutation.mutate()}
                disabled={triggerMutation.isPending || status?.isRunning}
                className="px-6 py-3 font-medium"
                data-testid="button-trigger-automation"
              >
                {triggerMutation.isPending || status?.isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Automation Now
                  </>
                )}
              </Button>
              {config && (
                <div className="text-sm text-muted-foreground">
                  Target: <span className="font-mono font-medium text-foreground">{config.owner}/{config.repo}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card data-testid="card-current-status">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="flex items-center gap-2">
                  {status?.isRunning ? (
                    <>
                      <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                      <span className="text-sm font-medium">Running</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-status-online" />
                      <span className="text-sm font-medium">Idle</span>
                    </>
                  )}
                </div>
              )}
              {status?.currentOperation && (
                <p className="text-xs text-muted-foreground mt-2 font-mono">{status.currentOperation}</p>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-last-run">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Last Run</CardTitle>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {status?.lastRun ? formatDate(status.lastRun) : "Never"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-next-run">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Next Scheduled Run</CardTitle>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{getNextRunCountdown()}</span>
                </div>
              )}
              {status?.nextRun && (
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDate(status.nextRun)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
            <CardDescription>Last 5 merge operations</CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mt-3">No activity yet</p>
                <p className="text-xs text-muted-foreground mt-1">Trigger the automation to see merge operations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-4 p-4 rounded-lg border hover-elevate transition-colors duration-150"
                    data-testid={`log-entry-${log.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium truncate" data-testid={`text-branch-${log.id}`}>
                          {log.branchName}
                        </span>
                        <span className="text-xs text-muted-foreground">PR #{log.prNumber}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{log.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {log.stagingMerged && (
                          <span className="text-xs text-muted-foreground">→ staging ✓</span>
                        )}
                        {log.mainMerged && (
                          <span className="text-xs text-muted-foreground">→ main ✓</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(log.status)}
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
