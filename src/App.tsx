import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TeamProvider, useTeam } from "@/contexts/TeamContext";
import { UserContextProvider, useUserContext } from "@/contexts/UserContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Roster from "./pages/Roster";
import Meets from "./pages/Meets";
import MeetPairings from "./pages/MeetPairings";
import Settings from "./pages/Settings";
import AccountSettings from "./pages/AccountSettings";
import NotFound from "./pages/NotFound";
import PublicMeetView from "./pages/PublicMeetView";
import CreateLeague from "./pages/league/CreateLeague";
import LeagueDashboard from "./pages/league/LeagueDashboard";
import LeagueMeets from "./pages/league/LeagueMeets";
import LeagueTeams from "./pages/league/LeagueTeams";
import LeagueInvitations from "./pages/league/LeagueInvitations";
import LeagueSettings from "./pages/league/LeagueSettings";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import Guides from "./pages/Guides";
import GuideArticle from "./pages/GuideArticle";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { teams, loading: teamsLoading } = useTeam();
  const { contexts, loading: contextsLoading } = useUserContext();

  if (loading || teamsLoading || contextsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl text-primary mb-4">MATSIDE</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user has no teams and no leagues, redirect to onboarding
  if (teams.length === 0 && contexts.filter(c => c.type === 'league').length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { teams, loading: teamsLoading } = useTeam();
  const { contexts, loading: contextsLoading } = useUserContext();

  if (loading || teamsLoading || contextsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl text-primary mb-4">MATSIDE</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check for action parameter to allow existing users to create new teams
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  
  // If action is specified, allow access to onboarding
  if (action === 'create-team') {
    return <>{children}</>;
  }

  // If user already has teams, go to team dashboard
  if (teams.length > 0) {
    return <Navigate to="/dashboard" replace />;
  }

  // If user has leagues but no teams, go to league dashboard
  const leagueContexts = contexts.filter(c => c.type === 'league');
  if (leagueContexts.length > 0) {
    return <Navigate to="/league/dashboard" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { teams, loading: teamsLoading } = useTeam();
  const { contexts, loading: contextsLoading } = useUserContext();

  if (loading || teamsLoading || contextsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl text-primary mb-4">MATSIDE</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    // Prioritize team dashboard if user has teams
    if (teams.length > 0) {
      return <Navigate to="/dashboard" replace />;
    }
    // If user has leagues but no teams, go to league dashboard
    const leagueContexts = contexts.filter(c => c.type === 'league');
    if (leagueContexts.length > 0) {
      return <Navigate to="/league/dashboard" replace />;
    }
    // No teams or leagues, go to onboarding
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
      <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/roster" element={<ProtectedRoute><Roster /></ProtectedRoute>} />
      <Route path="/meets" element={<ProtectedRoute><Meets /></ProtectedRoute>} />
      <Route path="/meets/:meetId/pairings" element={<ProtectedRoute><MeetPairings /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
      
      {/* League Routes */}
      <Route path="/league/create" element={<ProtectedRoute><CreateLeague /></ProtectedRoute>} />
      <Route path="/league/dashboard" element={<ProtectedRoute><LeagueDashboard /></ProtectedRoute>} />
      <Route path="/league/meets" element={<ProtectedRoute><LeagueMeets /></ProtectedRoute>} />
      <Route path="/league/teams" element={<ProtectedRoute><LeagueTeams /></ProtectedRoute>} />
      <Route path="/league/invitations" element={<ProtectedRoute><LeagueInvitations /></ProtectedRoute>} />
      <Route path="/league/settings" element={<ProtectedRoute><LeagueSettings /></ProtectedRoute>} />
      
      {/* Legal Pages */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />

      {/* Help Center */}
      <Route path="/guides" element={<Guides />} />
      <Route path="/guides/:sectionSlug/:articleSlug" element={<GuideArticle />} />
      
      {/* Public Pages */}
      <Route path="/public/meet/:token" element={<PublicMeetView />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TeamProvider>
            <UserContextProvider>
              <AppRoutes />
            </UserContextProvider>
          </TeamProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
