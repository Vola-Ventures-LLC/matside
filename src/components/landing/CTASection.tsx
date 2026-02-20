import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <section className="py-20 sm:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground mb-6">
            READY TO SIMPLIFY
            <span className="block text-gradient">YOUR NEXT MEET?</span>
          </h2>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join teams across the country who've already saved countless hours on meet day logistics. 
            Free to start, no credit card required.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="btn-primary text-lg px-10 h-14 w-full sm:w-auto">
              <Link to="/auth">
                Create Your Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          
          <p className="mt-6 text-sm text-muted-foreground">
            Questions? Email us at <a href="mailto:hello@matsideapp.com" className="text-primary hover:underline">hello@matsideapp.com</a>
          </p>
        </div>
      </div>
    </section>
  );
}
