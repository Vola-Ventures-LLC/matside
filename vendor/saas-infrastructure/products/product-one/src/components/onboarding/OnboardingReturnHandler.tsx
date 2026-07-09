import { useState, useEffect } from "react";
import { useOnboardingReturn } from "@/hooks/useOnboardingReturn";
import { ReturnToOnboardingBanner } from "./NavigationCTAButton";
import { OnboardingChat } from "./OnboardingChat";
import { useOnboarding } from "@/hooks/useOnboarding";

interface OnboardingReturnHandlerProps {
  children?: React.ReactNode;
}

export function OnboardingReturnHandler({ children }: OnboardingReturnHandlerProps) {
  const { shouldShowBanner, returnStepKey, clearReturn } = useOnboardingReturn();
  const { resumeConversation, isDismissed } = useOnboarding();
  const [showChat, setShowChat] = useState(false);

  const handleReturn = async () => {
    clearReturn();
    await resumeConversation();
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
  };

  // Don't show banner if onboarding is dismissed
  if (isDismissed) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      
      {/* Return banner - shows when user comes back from a CTA navigation */}
      {shouldShowBanner && !showChat && (
        <ReturnToOnboardingBanner onReturn={handleReturn} />
      )}

      {/* Chat dialog */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <OnboardingChat onClose={handleCloseChat} />
        </div>
      )}
    </>
  );
}
