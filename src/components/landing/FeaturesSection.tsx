import { 
  Users, 
  Calendar, 
  Zap, 
  LayoutGrid, 
  Shield, 
  Printer,
  MessageSquare,
  History
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Smart Roster Management",
    description: "Track weight, age, skill level (1-5), and years of experience for every wrestler. Bulk import, quick updates, and automatic age calculations.",
    color: "primary",
  },
  {
    icon: Calendar,
    title: "Meet Coordination",
    description: "Schedule meets, invite teams, and track attendance in real-time. Everyone sees who's confirmed, arriving late, or scratched.",
    color: "success",
  },
  {
    icon: Zap,
    title: "Automated Pairings",
    description: "Generate optimal matchups based on weight, age, skill rating, and experience level. Set your own rules and regenerate on the fly.",
    color: "warning",
  },
  {
    icon: MessageSquare,
    title: "Matchup Coordination",
    description: "Prep for your matchup call by flagging wrestlers for discussion. Preview pairings before the call so coaches come prepared.",
    color: "success",
  },
  {
    icon: LayoutGrid,
    title: "Mat Assignment",
    description: "Drag-and-drop matches across mats. Automatic conflict detection ensures wrestlers get proper rest between bouts.",
    color: "primary",
  },
  {
    icon: History,
    title: "Change Tracking",
    description: "Full audit history of all pairing changes between the matchup call and meet day. Know exactly what changed and when.",
    color: "warning",
  },
  {
    icon: Shield,
    title: "Privacy Controls",
    description: "Your roster data stays private until you choose to share. Per-team consent controls protect sensitive information about minors.",
    color: "success",
  },
  {
    icon: Printer,
    title: "Print & Share",
    description: "Generate print-ready schedules by mat or team. Share with coaches morning-of so everyone knows the plan.",
    color: "warning",
  },
];

const colorMap = {
  primary: "bg-primary/10 text-primary group-hover:bg-primary/20",
  success: "bg-success/10 text-success group-hover:bg-success/20",
  warning: "bg-warning/10 text-warning group-hover:bg-warning/20",
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-foreground mb-4">
            EVERYTHING YOU NEED
          </h2>
          <p className="text-lg text-muted-foreground">
            From roster to results, MatSide handles the logistics so you can focus on coaching.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-6 sm:p-8 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${colorMap[feature.color as keyof typeof colorMap]}`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
