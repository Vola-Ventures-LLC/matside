import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Mail, Check, Loader2 } from "lucide-react";

interface NewsletterSignupProps {
  variant?: "inline" | "card";
  className?: string;
}

export function NewsletterSignup({
  variant = "card",
  className,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setIsLoading(true);

    const { error } = await supabase.from("newsletter_subscribers").insert({
      email,
      source: "blog",
    });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "You're already subscribed!" });
        setIsSubscribed(true);
      } else {
        toast({
          variant: "destructive",
          title: "Failed to subscribe",
          description: error.message,
        });
      }
    } else {
      setIsSubscribed(true);
      toast({ title: "Thanks for subscribing!" });
    }

    setIsLoading(false);
  };

  if (isSubscribed) {
    return (
      <div
        className={`flex items-center gap-2 text-primary ${className || ""}`}
      >
        <Check className="h-5 w-5" />
        <span className="font-medium">You're subscribed!</span>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className={`flex gap-2 ${className || ""}`}>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Subscribe"
          )}
        </Button>
      </form>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Stay Updated</CardTitle>
        <CardDescription>
          Get the latest posts delivered to your inbox
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Subscribe
          </Button>
        </form>
        <p className="mt-3 text-xs text-center text-muted-foreground">
          No spam, unsubscribe anytime.
        </p>
      </CardContent>
    </Card>
  );
}
