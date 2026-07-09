import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";

interface OnboardingReturnState {
  shouldShowBanner: boolean;
  returnStepKey: string | null;
  clearReturn: () => void;
}

const RETURN_STEP_KEY = "onboarding_return_step";
const RETURN_TIME_KEY = "onboarding_return_time";
const RETURN_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

export function useOnboardingReturn(): OnboardingReturnState {
  const location = useLocation();
  const [shouldShowBanner, setShouldShowBanner] = useState(false);
  const [returnStepKey, setReturnStepKey] = useState<string | null>(null);

  useEffect(() => {
    const storedStep = sessionStorage.getItem(RETURN_STEP_KEY);
    const storedTime = sessionStorage.getItem(RETURN_TIME_KEY);

    if (storedStep && storedTime) {
      const returnTime = parseInt(storedTime, 10);
      const now = Date.now();
      
      // Check if within the return window
      if (now - returnTime < RETURN_WINDOW_MS) {
        setReturnStepKey(storedStep);
        setShouldShowBanner(true);
      } else {
        // Expired, clear storage
        sessionStorage.removeItem(RETURN_STEP_KEY);
        sessionStorage.removeItem(RETURN_TIME_KEY);
      }
    }
  }, [location.pathname]);

  const clearReturn = useCallback(() => {
    sessionStorage.removeItem(RETURN_STEP_KEY);
    sessionStorage.removeItem(RETURN_TIME_KEY);
    setShouldShowBanner(false);
    setReturnStepKey(null);
  }, []);

  return {
    shouldShowBanner,
    returnStepKey,
    clearReturn,
  };
}
