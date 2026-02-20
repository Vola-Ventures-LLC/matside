import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const personas = [
  {
    icon: Trophy,
    role: "Team Manager",
    title: "Run Your Team Like a Pro",
    benefits: [
      "Manage your full roster with weights, ages, and skill tracking",
      "RSVP to meets and update attendance in real-time",
      "See your wrestlers' match assignments before meet day",
      "Flag issues for discussion with opposing coaches",
      "Never miss a weigh-in deadline again",
    ],
    cta: "Start Managing Your Team",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    icon: Building2,
    role: "League Organizer",
    title: "Scale Your League Effortlessly",
    benefits: [
      "Onboard teams with simple invite codes",
      "Schedule league-wide meets from one dashboard",
      "Set standard rules for weight differentials and age matching",
      "View team participation across all events",
      "Maintain privacy—see team names, not private roster data",
    ],
    cta: "Create Your League",
    gradient: "from-success/20 to-success/5",
  },
];

export function PersonaSection() {
  return (
    <section className="py-20 sm:py-32 bg-card/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-foreground mb-4">
            BUILT FOR YOUR ROLE
          </h2>
          <p className="text-lg text-muted-foreground">
            Whether you're managing one team or an entire league, MatSide adapts to your needs.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {personas.map((persona, index) => (
            <div 
              key={index}
              className={`relative p-8 sm:p-10 rounded-2xl border border-border overflow-hidden bg-gradient-to-br ${persona.gradient}`}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center mb-6">
                <persona.icon className="h-7 w-7 text-foreground" />
              </div>
              
              {/* Content */}
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {persona.role}
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
                {persona.title}
              </h3>
              
              <ul className="space-y-3 mb-8">
                {persona.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
              
              <Button asChild className="btn-primary">
                <Link to="/auth">
                  {persona.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
