import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTeam } from '@/contexts/TeamContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Trophy } from 'lucide-react';
import { JoinLeagueModal } from '@/components/team/JoinLeagueModal';

export default function Dashboard() {
  const [joinLeagueOpen, setJoinLeagueOpen] = useState(false);
  const { currentTeam } = useTeam();
  const [stats, setStats] = useState({
    wrestlerCount: 0,
    upcomingMeets: 0,
    matchesThisSeason: 0,
  });

  useEffect(() => {
    if (!currentTeam) return;

    const fetchStats = async () => {
      // Fetch wrestler count
      const { count: wrestlerCount } = await supabase
        .from('wrestlers')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', currentTeam.id)
        .eq('status', 'active');

      // Fetch upcoming meets (as host OR as participating team)
      const { count: meetCount } = await supabase
        .from('meet_teams')
        .select('meets!inner(id, meet_date)', { count: 'exact', head: true })
        .eq('team_id', currentTeam.id)
        .gte('meets.meet_date', new Date().toISOString().split('T')[0]);

      setStats({
        wrestlerCount: wrestlerCount || 0,
        upcomingMeets: meetCount || 0,
        matchesThisSeason: 0,
      });
    };

    fetchStats();
  }, [currentTeam]);

  const statCards = [
    {
      title: 'Total Wrestlers',
      value: stats.wrestlerCount,
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Upcoming Meets',
      value: stats.upcomingMeets,
      icon: Calendar,
      color: 'text-success',
    },
    {
      title: 'Matches This Season',
      value: stats.matchesThisSeason,
      icon: Trophy,
      color: 'text-warning',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Welcome back! Here's what's happening with {currentTeam?.name || 'your team'}.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="card-athletic">
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6 md:pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                <div className="text-xl md:text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="card-athletic">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 md:space-y-3 p-4 pt-0 md:p-6 md:pt-0">
            <a 
              href="/roster" 
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Users className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm md:text-base">Manage Roster</p>
                <p className="text-xs md:text-sm text-muted-foreground truncate">Add or edit wrestlers</p>
              </div>
            </a>
            <a 
              href="/meets/hosting" 
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Calendar className="w-5 h-5 text-success flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm md:text-base">Host a Meet</p>
                <p className="text-xs md:text-sm text-muted-foreground truncate">Create a new wrestling event</p>
              </div>
            </a>
            <button 
              onClick={() => setJoinLeagueOpen(true)}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors w-full text-left"
            >
              <Trophy className="w-5 h-5 text-warning flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm md:text-base">Join a League</p>
                <p className="text-xs md:text-sm text-muted-foreground truncate">Enter an invite code to join</p>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>

      <JoinLeagueModal 
        open={joinLeagueOpen} 
        onOpenChange={setJoinLeagueOpen}
      />
    </DashboardLayout>
  );
}
