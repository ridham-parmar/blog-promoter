import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Trash2, CheckCircle2, XCircle, AlertCircle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { MergeLog } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef } from "react";

export default function ActivityLogs() {
  const { toast } = useToast();
  const logsEndRef = useRef<HTMLDivElement>(null);

  const { data: logs = [], isLoading } = useQuery<MergeLog[]>({
    queryKey: ["/api/logs"],
    refetchInterval: 5000,
  });

  const clearLogsMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/logs", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      toast({
        title: "Logs cleared",
        description: "All activity logs have been removed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to clear logs",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (logs.length > 0) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-status-online" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "skipped":
        return <AlertCircle className="w-4 h-4 text-status-away" />;
      default:
        return null;
    }
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `merge-logs-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Logs exported",
      description: `${logs.length} log entries downloaded`,
    });
  };

  const formatTimestamp = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold leading-tight" data-testid="text-page-title">Activity Logs</h1>
            <p className="text-sm text-muted-foreground mt-1">Complete history of merge operations</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={exportLogs}
              disabled={logs.length === 0}
              data-testid="button-export-logs"
              className="hover-elevate active-elevate-2"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="destructive"
              onClick={() => clearLogsMutation.mutate()}
              disabled={clearLogsMutation.isPending || logs.length === 0}
              data-testid="button-clear-logs"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Logs
            </Button>
          </div>
        </div>

        <Card data-testid="card-logs-viewer">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-medium">Merge Operations</CardTitle>
                <CardDescription>
                  {logs.length} {logs.length === 1 ? "entry" : "entries"} recorded
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No logs available</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Activity logs will appear here when the automation runs
                </p>
              </div>
            ) : (
              <div className="rounded-lg border max-h-96 overflow-y-auto">
                <div className="space-y-1 p-2">
                  {logs.map((log, index) => (
                    <div
                      key={log.id}
                      className="px-4 py-2 font-mono text-xs leading-relaxed hover-elevate rounded transition-colors duration-150"
                      data-testid={`log-entry-${index}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-muted-foreground opacity-60 shrink-0 min-w-[140px]">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        <div className="shrink-0 mt-0.5">
                          {getStatusIcon(log.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{log.branchName}</span>
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              PR #{log.prNumber}
                            </Badge>
                            {log.stagingMerged && (
                              <span className="text-status-online">→ staging</span>
                            )}
                            {log.mainMerged && (
                              <span className="text-status-online">→ main</span>
                            )}
                          </div>
                          <div className="text-muted-foreground">{log.message}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
