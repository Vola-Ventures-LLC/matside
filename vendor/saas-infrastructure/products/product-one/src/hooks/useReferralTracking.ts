import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook to process referral code after user signs up and verifies email.
 * Should be used in a component that renders after authentication.
 */
export function useReferralTracking() {
  const { user } = useAuth();

  useEffect(() => {
    const processReferral = async () => {
      if (!user) return;

      // Check for stored referral code
      const referralCode = localStorage.getItem("referral_code");
      if (!referralCode) return;

      try {
        console.log("Processing referral code:", referralCode);
        
        const { data, error } = await supabase.functions.invoke("process-referral", {
          body: {
            referral_code: referralCode,
            referred_user_id: user.id,
          },
        });

        if (error) {
          console.error("Failed to process referral:", error);
        } else {
          console.log("Referral processed:", data);
        }
      } catch (err) {
        console.error("Referral processing error:", err);
      } finally {
        // Clear the stored code regardless of outcome
        localStorage.removeItem("referral_code");
      }
    };

    processReferral();
  }, [user]);
}
