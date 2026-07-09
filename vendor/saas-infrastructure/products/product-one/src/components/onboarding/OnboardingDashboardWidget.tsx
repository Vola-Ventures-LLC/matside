import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useRoleContext } from "@/hooks/useRoleContext";
import { useOrgContext } from "@/hooks/useOrgContext";
import { OnboardingProgress } from "./OnboardingProgress";
import { OnboardingChat } from "./OnboardingChat";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  MessageCircle,
  Sparkles,
  SkipForward,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function OnboardingDashboardWidget() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeContext } = useRoleContext();
  const { activeOrg } = useOrgContext();
  const {
    steps,
    progress,
    summary,
    conversation,
    widgetConfig,
    isLoading,
    isComplete,
    resumeConversation,
    skipStep,
  } = useOnboarding();

  const [showChat, setShowChat] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Hide onboarding widget in Platform Admin context (when no org is selected)
  const isPlatformAdminMode = activeContext === "admin" && !activeOrg;

  // Auto-open chat if URL param is present
  useEffect(() => {
    if (searchParams.get("openSetupChat") === "true") {
      // Remove the param from URL
      searchParams.delete("openSetupChat");
      setSearchParams(searchParams, { replace: true });
      // Open the chat
      setShowChat(true);
    }
  }, [searchParams, setSearchParams]);

  // Don't show widget if in platform admin mode, dismissed or complete, but still allow chat via URL param
  const shouldHideWidget = isPlatformAdminMode || isComplete || isLoading || !summary || summary.total_steps === 0;

  const handleStartChat = async () => {
    await resumeConversation();
    setShowChat(true);
  };

  // Group steps by category
  const stepsByCategory = steps.reduce((acc, step) => {
    if (!acc[step.category]) {
      acc[step.category] = [];
    }
    acc[step.category].push(step);
    return acc;
  }, {} as Record<string, typeof steps>);

  const categoryLabels: Record<string, string> = {
    getting_started: "Getting Started",
    profile: "Your Profile",
    general: "General",
  };

  if (showChat) {
    return (
      <OnboardingChat
        onClose={() => setShowChat(false)}
        onComplete={() => {
          setShowChat(false);
        }}
      />
    );
  }

  // Hide the widget card if should be hidden
  if (shouldHideWidget) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{widgetConfig.title}</CardTitle>
              <CardDescription>
                {widgetConfig.description}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
        {/* Start Guided Setup - moved to top */}
        <div>
          <Button onClick={handleStartChat} className="w-full">
            <MessageCircle className="h-4 w-4 mr-2" />
            {conversation ? "Continue Setup Chat" : "Start Guided Setup"}
          </Button>
        </div>

        <OnboardingProgress
          completed={summary.completed_steps}
          total={summary.total_steps}
          size="md"
        />

        <div className="space-y-4">
          {Object.entries(stepsByCategory).map(([category, categorySteps]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {categoryLabels[category] || category}
              </h4>
              <div className="space-y-1.5">
                {categorySteps.map((step) => {
                  const stepProgress = progress.get(step.id);
                  const isCompleted = stepProgress?.status === "completed";
                  const isSkipped = stepProgress?.status === "skipped";
                  const isPending = !stepProgress || stepProgress.status === "pending";
                  const hasLink = step.navigation_cta?.enabled && step.navigation_cta?.path;

                  const stepContent = (
                    <>
                      <div className="flex items-center gap-2 min-w-0">
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        ) : isSkipped ? (
                          <SkipForward className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div
                            className={cn(
                              "font-medium truncate",
                              (isCompleted || isSkipped) && "text-muted-foreground"
                            )}
                          >
                            {step.title}
                            {step.is_required && !isCompleted && (
                              <span className="text-destructive ml-1">*</span>
                            )}
                          </div>
                          {step.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {step.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {isPending && !step.is_required && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs shrink-0"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            skipStep(step.key);
                          }}
                        >
                          Skip
                        </Button>
                      )}
                    </>
                  );

                  if (hasLink && !isCompleted && !isSkipped) {
                    return (
                      <Link
                        key={step.id}
                        to={step.navigation_cta!.path}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-md border p-2 text-sm transition-colors",
                          "border-border bg-background hover:border-primary hover:bg-primary/5"
                        )}
                      >
                        {stepContent}
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-md border p-2 text-sm transition-colors",
                        isCompleted
                          ? "border-primary/20 bg-primary/5"
                          : isSkipped
                          ? "border-muted bg-muted/50"
                          : "border-border bg-background"
                      )}
                    >
                      {stepContent}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

          <p className="text-xs text-muted-foreground text-center">
            <span className="text-destructive">*</span> Required steps
          </p>
        </CardContent>
      )}
    </Card>
  );
}
