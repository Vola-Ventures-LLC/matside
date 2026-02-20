import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserContext } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Calendar, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LeagueStats {
  totalTeams: number;
  activeTeams: number;
  pendingInvites: number;
}

export default function LeagueDashboard() {
  const navigate = useNavigate();
  const { currentContext } = useUserContext();
  const [stats, setStats] = useState<LeagueStats>({
    totalTeams: 0,
    activeTeams: 0,
    pendingInvites: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentContext?.type !== 'league') {
      navigate('/dashboard');
      return;
    }

    const fetchStats = async () => {
      setLoading(true);

      // Fetch league teams
      const { data: teamsData } = await supabase
        .from('league_teams')
        .select('id, status')
        .eq('league_id', currentContext.id);

      // Fetch pending invitations
      const { data: invitesData } = await supabase
        .from('invitations')
        .select('id')
        .eq('league_id', currentContext.id)
        .gt('expires_at', new Date().toISOString())
        .lt('use_count', 999); // less than max_uses

      setStats({
        totalTeams: teamsData?.length || 0,
        activeTeams: teamsData?.filter((t) => t.status === 'active').length || 0,
        pendingInvites: invitesData?.length || 0,
      });

      setLoading(false);
    };

    fetchStats();
  }, [currentContext, navigate]);

  if (currentContext?.type !== 'league') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-4xl text-foreground mb-2">
            League Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your league, teams, and events
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="bg-card border-border hover:bg-card/80 transition-colors cursor-pointer"
            onClick={() => navigate('/league/teams')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Teams
              </CardTitle>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? '-' : stats.totalTeams}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Teams in league
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-card border-border hover:bg-card/80 transition-colors cursor-pointer"
            onClick={() => navigate('/league/teams')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Teams
              </CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {loading ? '-' : stats.activeTeams}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Participating teams
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-card border-border hover:bg-card/80 transition-colors cursor-pointer"
            onClick={() => navigate('/league/invitations')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Invites
              </CardTitle>
              <Mail className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">
                {loading ? '-' : stats.pendingInvites}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting response
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Upcoming Events
              </CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                Coming soon
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for league management</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/league/invitations')}
              className="p-4 rounded-lg border border-border hover:bg-accent transition-colors text-left"
            >
              <Mail className="w-6 h-6 mb-2 text-primary" />
              <h3 className="font-medium">Invite Teams</h3>
              <p className="text-sm text-muted-foreground">
                Send invitations to team managers
              </p>
            </button>
            <button
              onClick={() => navigate('/league/teams')}
              className="p-4 rounded-lg border border-border hover:bg-accent transition-colors text-left"
            >
              <Building2 className="w-6 h-6 mb-2 text-primary" />
              <h3 className="font-medium">Manage Teams</h3>
              <p className="text-sm text-muted-foreground">
                View and manage league teams
              </p>
            </button>
            <button
              onClick={() => navigate('/league/settings')}
              className="p-4 rounded-lg border border-border hover:bg-accent transition-colors text-left"
            >
              <Users className="w-6 h-6 mb-2 text-primary" />
              <h3 className="font-medium">League Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure league options
              </p>
            </button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
