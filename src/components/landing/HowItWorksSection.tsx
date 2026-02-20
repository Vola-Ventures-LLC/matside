import { UserPlus, ClipboardList, Zap, Flag } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Set Up Your Team",
    description:
      "Create your team, add your wrestlers with their weights and ages, and invite assistant coaches if needed.",
  },
  {
    number: "02",
    icon: ClipboardList,
    title: "Join or Host a Meet",
    description: "Accept league invitations or create your own meets. Track who's attending and collect weigh-in data.",
  },
  {
    number: "03",
    icon: Zap,
    title: "Generate Pairings",
    description:
      "Let MatSide match wrestlers by weight, age, experience, and skill. Adjust rules, handle scratches, and assign mats with drag-and-drop.",
  },
  {
    number: "04",
    icon: Flag,
    title: "Run Meet Day",
    description: "Print schedules, resolve last-minute conflicts, and keep everyone on track with real-time updates.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-foreground mb-4">HOW IT WORKS</h2>
          <p className="text-lg text-muted-foreground">From signup to meet day in four simple steps.</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative flex gap-6 sm:gap-8 pb-12 last:pb-0">
              {/* Timeline line */}
              {index < steps.length - 1 && <div className="absolute left-6 sm:left-8 top-16 bottom-0 w-px bg-border" />}

              {/* Number circle */}
              <div className="relative z-10 shrink-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary flex items-center justify-center">
                  <span className="font-display text-xl sm:text-2xl text-primary-foreground">{step.number}</span>
                </div>
              </div>

              {/* Content */}
              <div className="pt-2 sm:pt-4 pb-8">
                <div className="flex items-center gap-3 mb-2">
                  <step.icon className="h-5 w-5 text-primary" />
                  <h3 className="text-xl sm:text-2xl font-semibold text-foreground">{step.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed max-w-lg">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
