import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MailX, CheckCircle, AlertTriangle, Info } from "lucide-react";

type UnsubscribeStatus = "loading" | "success" | "already" | "error" | "invalid";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<UnsubscribeStatus>("loading");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const processUnsubscribe = async () => {
      try {
        const { data, error } = await supabase.rpc("unsubscribe_by_token", {
          p_token: token,
        });

        if (error) {
          console.error("Unsubscribe error:", error);
          setStatus("error");
          return;
        }

        // Function returns true if a row was updated, false if already unsubscribed
        setStatus(data ? "success" : "already");
      } catch (err) {
        console.error("Unsubscribe error:", err);
        setStatus("error");
      }
    };

    processUnsubscribe();
  }, [token]);

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex flex-col items-center gap-4 py-8">
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground">Processing your request...</p>
          </div>
        );

      case "success":
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Successfully Unsubscribed</h3>
                <p className="text-muted-foreground">
                  You've been unsubscribed from marketing emails.
                </p>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>About app notifications</AlertTitle>
              <AlertDescription>
                You will still receive essential app notifications such as account alerts,
                billing updates, and support messages. These cannot be disabled while your
                account is active.
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Want to stop all emails?
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    To stop receiving all emails including app notifications, you'll need to{" "}
                    <Link to="/settings" className="underline font-medium hover:no-underline">
                      delete your account
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "already":
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="rounded-full bg-muted p-3">
                <MailX className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Already Unsubscribed</h3>
                <p className="text-muted-foreground">
                  You're already unsubscribed from marketing emails.
                </p>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>About app notifications</AlertTitle>
              <AlertDescription>
                You will still receive essential app notifications such as account alerts,
                billing updates, and support messages. These cannot be disabled while your
                account is active.
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Want to stop all emails?
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    To stop receiving all emails including app notifications, you'll need to{" "}
                    <Link to="/settings" className="underline font-medium hover:no-underline">
                      delete your account
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "invalid":
        return (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Invalid Link</h3>
              <p className="text-muted-foreground">
                This unsubscribe link is invalid or has expired.
              </p>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Something went wrong</h3>
              <p className="text-muted-foreground">
                We couldn't process your request. Please try again later.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <Helmet>
        <title>Unsubscribe | SaaS Infrastructure</title>
        <meta name="description" content="Manage your email subscription settings" />
        <meta property="og:title" content="Unsubscribe | SaaS Infrastructure" />
        <meta property="og:description" content="Manage your email subscription settings" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Email Preferences</CardTitle>
          <CardDescription>
            Manage your email subscription settings
          </CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
      </div>
    </>
  );
}
