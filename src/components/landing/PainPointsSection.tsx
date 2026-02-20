import { Clock, MessageSquare, FileSpreadsheet, AlertTriangle } from "lucide-react";

const painPoints = [
  {
    icon: FileSpreadsheet,
    title: "Spreadsheet Chaos",
    description: "Tracking rosters, weights, and ages across multiple teams in fragile spreadsheets that break every season.",
  },
  {
    icon: MessageSquare,
    title: "Endless Group Texts",
    description: "Coordinating attendance, weigh-ins, and last-minute scratches through a flood of messages.",
  },
  {
    icon: Clock,
    title: "Hours of Manual Pairing",
    description: "Hand-matching wrestlers by weight, age, and skill—only to redo it when someone doesn't show.",
  },
  {
    icon: AlertTriangle,
    title: "Meet Day Stress",
    description: "Scrambling to assign mats, avoid conflicts, and keep kids from waiting too long between bouts.",
  },
];

export function PainPointsSection() {
  return (
    <section className="py-20 sm:py-32 bg-card/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-foreground mb-4">
            SOUND FAMILIAR?
          </h2>
          <p className="text-lg text-muted-foreground">
            Running a youth wrestling program shouldn't feel like a second job.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {painPoints.map((point, index) => (
            <div 
              key={index}
              className="group p-6 sm:p-8 rounded-xl bg-background border border-border hover:border-primary/50 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4 group-hover:bg-destructive/20 transition-colors">
                <point.icon className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{point.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{point.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
