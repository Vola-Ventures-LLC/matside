import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl sm:text-3xl text-primary">MATSIDE</span>
          </Link>
          
          {/* Desktop nav - placeholder for future links */}
          <nav className="hidden md:flex items-center gap-8">
          </nav>
          
          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="btn-primary">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
          
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        
        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline" className="w-full">
                  <Link to="/auth" onClick={() => setIsOpen(false)}>Sign In</Link>
                </Button>
                <Button asChild className="btn-primary w-full">
                  <Link to="/auth" onClick={() => setIsOpen(false)}>Get Started</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
