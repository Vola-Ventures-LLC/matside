import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ExternalLink, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationCTA {
  enabled: boolean;
  label: string;
  path: string;
  description: string;
  external: boolean;
  complete_on_return: boolean;
}

interface NavigationCTAButtonProps {
  cta: NavigationCTA;
  stepKey: string;
  onNavigate?: () => void;
  className?: string;
}

export function NavigationCTAButton({
  cta,
  stepKey,
  onNavigate,
  className,
}: NavigationCTAButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Store the return context in sessionStorage
    sessionStorage.setItem("onboarding_return_step", stepKey);
    sessionStorage.setItem("onboarding_return_time", Date.now().toString());

    if (onNavigate) {
      onNavigate();
    }

    if (cta.external) {
      window.open(cta.path, "_blank", "noopener,noreferrer");
    } else {
      navigate(cta.path);
    }
  };

  return (
    <Card className={cn("bg-primary/5 border-primary/20", className)}>
      <CardContent className="p-4 space-y-3">
        {cta.description && (
          <p className="text-sm text-muted-foreground">{cta.description}</p>
        )}
        <Button
          onClick={handleClick}
          className="w-full gap-2"
          variant="default"
        >
          {cta.label}
          {cta.external ? (
            <ExternalLink className="h-4 w-4" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          You can return to continue the conversation after completing this step.
        </p>
      </CardContent>
    </Card>
  );
}

interface ReturnToOnboardingBannerProps {
  onReturn: () => void;
  className?: string;
}

export function ReturnToOnboardingBanner({
  onReturn,
  className,
}: ReturnToOnboardingBannerProps) {
  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5",
        className
      )}
    >
      <Card className="shadow-lg border-primary/20 bg-background">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium">Continue Setup</p>
            <p className="text-xs text-muted-foreground">
              Return to the onboarding assistant
            </p>
          </div>
          <Button onClick={onReturn} size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
