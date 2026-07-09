import { AlertTriangle, CreditCard, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface StripeSetupBannerProps {
  isConfigured: boolean;
  appName?: string;
}

export function StripeSetupBanner({ isConfigured, appName }: StripeSetupBannerProps) {
  if (isConfigured) return null;

  return (
    <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-600">Stripe Not Configured{appName ? ` for ${appName}` : ""}</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-muted-foreground">
          To enable billing features, you need to configure Stripe API keys for this app.
        </p>
        <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-2">
          <p className="font-medium">Setup Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Stripe Dashboard → API Keys <ExternalLink className="h-3 w-3" /></a></li>
            <li>Copy your <strong>Publishable key</strong> (starts with pk_)</li>
            <li>Copy your <strong>Secret key</strong> (starts with sk_)</li>
            <li>Add them as secrets in your backend configuration</li>
            <li>Create a webhook endpoint and copy the <strong>Webhook Secret</strong></li>
          </ol>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer">
              <CreditCard className="mr-2 h-4 w-4" />
              Open Stripe Dashboard
            </a>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
