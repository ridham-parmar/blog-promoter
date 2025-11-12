import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Save, CheckCircle2, AlertCircle, GitBranch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { configurationSchema, type Configuration } from "@shared/schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function ConfigurationPage() {
  const { toast } = useToast();

  const { data: config, isLoading } = useQuery<Configuration>({
    queryKey: ["/api/config"],
  });

  const form = useForm<Configuration>({
    resolver: zodResolver(configurationSchema),
    values: config,
  });

  const saveMutation = useMutation({
    mutationFn: (data: Configuration) => apiRequest("POST", "/api/config", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({
        title: "Configuration saved",
        description: "Your settings have been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save configuration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Configuration) => {
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold leading-tight" data-testid="text-page-title">Configuration</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage automation settings and repository configuration</p>
        </div>

        <Card className="border-muted-foreground/20 bg-card/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-status-online" />
              <CardTitle className="text-lg font-medium">GitHub Connection</CardTitle>
            </div>
            <CardDescription>Successfully connected to GitHub API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge className="bg-status-online text-white border-0">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
              <span className="text-xs text-muted-foreground">
                Using Replit GitHub integration
              </span>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card data-testid="card-repository-config">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Repository Settings</CardTitle>
                <CardDescription>Configure the target repository for automation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="owner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repository Owner</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="username or organization"
                          data-testid="input-owner"
                        />
                      </FormControl>
                      <FormDescription>
                        The GitHub username or organization that owns the repository
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="repo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repository Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="my-blog-repo"
                          data-testid="input-repo"
                        />
                      </FormControl>
                      <FormDescription>
                        The name of your blog repository
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card data-testid="card-branch-config">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  Branch Configuration
                </CardTitle>
                <CardDescription>Define branch names and patterns for automation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="branchPrefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blog Branch Prefix</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="blog/"
                          className="font-mono"
                          data-testid="input-branch-prefix"
                        />
                      </FormControl>
                      <FormDescription>
                        PRs from branches starting with this prefix will be processed (e.g., blog/2025-11-12)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stagingBranch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Staging Branch</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="staging"
                          className="font-mono"
                          data-testid="input-staging-branch"
                        />
                      </FormControl>
                      <FormDescription>
                        Blog PRs will be merged into this branch first
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mainBranch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Production Branch</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="main"
                          className="font-mono"
                          data-testid="input-main-branch"
                        />
                      </FormControl>
                      <FormDescription>
                        After staging merge, a PR will be created to this branch
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card data-testid="card-schedule-config">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Schedule Settings</CardTitle>
                <CardDescription>Configure automation timing and behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="cronSchedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cron Schedule</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="0 9 * * *"
                          className="font-mono"
                          data-testid="input-cron-schedule"
                        />
                      </FormControl>
                      <FormDescription>
                        Cron expression for daily automation (default: 9:00 AM daily)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autoMerge"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto-Merge</FormLabel>
                        <FormDescription>
                          Automatically merge PRs when conditions are met
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-auto-merge"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={saveMutation.isPending}
                data-testid="button-reset"
                className="hover-elevate active-elevate-2"
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                data-testid="button-save"
              >
                {saveMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-lg font-medium text-amber-900 dark:text-amber-100">Important Notes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-900/80 dark:text-amber-100/80">
            <p>• Ensure the GitHub integration has appropriate permissions for the repository</p>
            <p>• Changes to branch names will affect future automation runs</p>
            <p>• The cron schedule uses UTC timezone</p>
            <p>• Auto-merge requires PRs to be mergeable (no conflicts, passing checks)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
