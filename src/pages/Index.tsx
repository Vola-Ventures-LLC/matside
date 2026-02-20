import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTeam } from "@/contexts/TeamContext";
import { useUserContext } from "@/contexts/UserContext";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { PainPointsSection } from "@/components/landing/PainPointsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PersonaSection } from "@/components/landing/PersonaSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { teams, loading: teamLoading } = useTeam();
  const { contexts, loading: contextLoading } = useUserContext();

  useEffect(() => {
    // Wait for auth and user data to load
    if (authLoading || teamLoading || contextLoading) return;

    // If user is authenticated, redirect appropriately
    if (user) {
      // If user has no teams and no leagues, redirect to onboarding
      if (teams.length === 0 && contexts.filter(c => c.type === 'league').length === 0) {
        navigate('/onboarding', { replace: true });
      } else {
        // Otherwise, redirect to dashboard
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, authLoading, teamLoading, contextLoading, teams, contexts, navigate]);

  // Show nothing while checking auth to prevent flash of landing page for logged-in users
  if (user && (authLoading || teamLoading || contextLoading)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 sm:pt-20">
        <HeroSection />
        <PainPointsSection />
        <FeaturesSection />
        <PersonaSection />
        <HowItWorksSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
