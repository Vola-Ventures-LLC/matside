import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is MatSide?",
    answer: "MatSide is a meet management tool built specifically for youth wrestling. It helps coaches and league organizers manage rosters, generate fair pairings based on weight, age, and experience, and run smooth meets with multi-mat scheduling and print-ready schedules.",
  },
  {
    question: "How much does MatSide cost?",
    answer: "MatSide is currently free to use during our beta period in the 2025-2026 season. In the future, we plan to offer affordable seasonal pricing for leagues and teams.",
  },
  {
    question: "How does the pairing algorithm work?",
    answer: "Our algorithm considers weight, age, skill rating (1-5), and years of experience to create fair, competitive matchups. You control the priority of each factor and set rules—like maximum age differences or whether teammates can wrestle each other—and MatSide handles the rest.",
  },
  {
    question: "Can I manage multiple teams or leagues?",
    answer: "Yes! MatSide supports both team managers running their own programs and league organizers coordinating multiple teams. You can easily switch between contexts from the dashboard.",
  },
  {
    question: "How do you protect wrestler data?",
    answer: "We take data protection seriously, especially for minors. Your roster data is never sold or shared without explicit consent. Team managers must opt-in before their wrestlers' information is visible to meet hosts for pairing purposes.",
  },
  {
    question: "Is MatSide COPPA compliant?",
    answer: "Yes. We designed MatSide with youth data privacy as a priority. We collect only the minimum information needed to create fair matchups, and all sensitive data is protected with role-based access controls.",
  },
  {
    question: "Can I print schedules for meet day?",
    answer: "Absolutely! MatSide generates print-ready schedules organized by mat or by team. Share them with coaches the morning of the meet so everyone knows the plan.",
  },
  {
    question: "What if a wrestler doesn't show up?",
    answer: "No problem. Update attendance in real-time and regenerate pairings with one click. MatSide handles last-minute changes so you don't have to scramble.",
  },
];

export function FAQSection() {
  return (
    <section className="py-20 sm:py-28 bg-muted/30">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-sm font-medium text-primary tracking-widest uppercase mb-4">
            FAQ
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-foreground mb-4">
            COMMON QUESTIONS
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about MatSide.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-background border border-border rounded-lg px-6 data-[state=open]:border-primary/50"
              >
                <AccordionTrigger className="text-left text-base sm:text-lg font-medium hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
