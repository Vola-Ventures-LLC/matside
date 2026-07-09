import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useRoleContext } from "@/hooks/useRoleContext";
import { useOrgContext } from "@/hooks/useOrgContext";
import { OnboardingProgress } from "./OnboardingProgress";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingSidebarWidgetProps {
  onClose?: () => void;
}

export function OnboardingSidebarWidget({ onClose }: OnboardingSidebarWidgetProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeContext } = useRoleContext();
  const { activeOrg } = useOrgContext();
  const {
    steps,
    progress,
    summary,
    isLoading,
    isComplete,
    resumeConversation,
    getIncompleteSteps,
  } = useOnboarding();

  const [isOpen, setIsOpen] = useState(true);
  const [isResuming, setIsResuming] = useState(false);

  // Hide onboarding widget in Platform Admin context (when no org is selected)
  const isPlatformAdminMode = activeContext === "admin" && !activeOrg;

  const handleOpenChat = async () => {
    setIsResuming(true);
    await resumeConversation();
    setIsResuming(false);
    // Close mobile sheet if open
    onClose?.();
    // Navigate to dashboard with param to auto-open chat
    navigate("/dashboard?openSetupChat=true");
  };

  // Hide in Platform Admin context or show minimal "Chat to Setup" prompt if dismissed but not complete
  if (isPlatformAdminMode) return null;

  // Don't show if complete or still loading
  if (isComplete || isLoading) return null;
  if (!summary || summary.total_steps === 0) return null;

  const incompleteSteps = getIncompleteSteps();

  return (
    <div className="border-t border-border/50 pt-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between px-3 py-2">
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Setup</span>
          </CollapsibleTrigger>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {summary.completed_steps}/{summary.total_steps}
            </span>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3">
            <OnboardingProgress
              completed={summary.completed_steps}
              total={summary.total_steps}
              size="sm"
              showLabel={false}
            />

            <div className="space-y-1">
              {steps.slice(0, 4).map((step) => {
                const stepProgress = progress.get(step.id);
                const isCompleted = stepProgress?.status === "completed";
                const isSkipped = stepProgress?.status === "skipped";
                const hasLink = step.navigation_cta?.enabled && step.navigation_cta?.path;

                const stepContent = (
                  <>
                    {isCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Circle className="h-3.5 w-3.5" />
                    )}
                    <span className={cn(isCompleted && "line-through")}>
                      {step.title}
                    </span>
                    {step.is_required && !isCompleted && (
                      <span className="text-destructive">*</span>
                    )}
                  </>
                );

                if (hasLink && !isCompleted && !isSkipped) {
                  return (
                    <Link
                      key={step.id}
                      to={step.navigation_cta!.path}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2 text-xs py-1 rounded-md px-1 -mx-1 transition-colors",
                        "text-foreground hover:bg-muted hover:text-primary"
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
                      "flex items-center gap-2 text-xs py-1",
                      isCompleted || isSkipped
                        ? "text-muted-foreground"
                        : "text-foreground"
                    )}
                  >
                    {stepContent}
                  </div>
                );
              })}
              {steps.length > 4 && (
                <div className="text-xs text-muted-foreground pl-5">
                  +{steps.length - 4} more
                </div>
              )}
            </div>

            {incompleteSteps.length > 0 && (
              <Button
                size="sm"
                className="w-full"
                onClick={handleOpenChat}
                disabled={isResuming}
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                {isResuming ? "Opening..." : "Chat to Setup"}
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
