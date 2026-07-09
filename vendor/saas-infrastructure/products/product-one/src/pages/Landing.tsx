import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, Users, Lock, BookOpen } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Authentication Built-in",
    description: "Email/password, OAuth, and magic links ready to go.",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description: "User roles and permissions configured out of the box.",
  },
  {
    icon: Lock,
    title: "Secure by Default",
    description: "Row-level security and best practices implemented.",
  },
  {
    icon: Zap,
    title: "Production Ready",
    description: "Optimized for performance and scalability from day one.",
  },
];

export default function Landing() {
  return (
    <>
      <Helmet>
        <title>SaaS Infrastructure - Build Your SaaS Faster</title>
        <meta
          name="description"
          content="A complete, production-ready starter kit with authentication, billing, user management, and admin dashboard."
        />
        <meta property="og:title" content="SaaS Infrastructure" />
        <meta
          property="og:description"
          content="Build your next SaaS faster with our production-ready toolkit"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== "undefined" ? window.location.href : "https://your-domain.com/"} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SaaS Infrastructure" />
        <meta name="twitter:description" content="Build your next SaaS faster with our production-ready toolkit" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "SaaS Infrastructure",
            description:
              "Complete SaaS starter kit with authentication and billing",
            url: "https://your-domain.com",
          })}
        </script>
      </Helmet>
      <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-accent/30" />
        <div className="container relative py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border bg-background/80 px-4 py-1.5 text-sm backdrop-blur">
              <span className="mr-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                New
              </span>
              Production-ready SaaS template
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Build your next
              <span className="block text-gradient bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                SaaS faster
              </span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              A complete, production-ready starter kit with authentication,
              user management, and admin dashboard. Skip the boilerplate and
              start building your product.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/signup">
                <Button size="lg" className="gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Everything you need</h2>
            <p className="text-lg text-muted-foreground">
              Built with modern tools and best practices
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group rounded-xl border bg-card p-6 transition-all hover:border-primary/20 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl rounded-2xl bg-primary p-8 text-center text-primary-foreground md:p-12">
            <h2 className="mb-4 text-2xl font-bold md:text-3xl">
              Ready to get started?
            </h2>
            <p className="mb-6 text-primary-foreground/80">
              Create your account and start building in minutes.
            </p>
            <Link to="/signup">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2"
              >
                Create your account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <span className="text-sm font-bold text-primary-foreground">S</span>
                </div>
                <span className="text-lg font-semibold">SaaS Starter</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A complete, production-ready starter kit for your next SaaS project.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
                <li><Link to="/signup" className="hover:text-foreground transition-colors">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/guides" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors inline-flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    User Guides
                  </a>
                </li>
                <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} SaaS Starter. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
