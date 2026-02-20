import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, AlertTriangle, History } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

interface ConsentAuditEntry {
  id: string;
  action: string;
  created_at: string;
  changed_by: string;
}

interface PrivacySettingsProps {
  teamId: string | undefined;
  dataSharingConsent: boolean;
  setDataSharingConsent: (value: boolean) => void;
  dataSharingConsentAt: string | null;
}

export function PrivacySettings({
  teamId,
  dataSharingConsent,
  setDataSharingConsent,
  dataSharingConsentAt,
}: PrivacySettingsProps) {
  const [acknowledged, setAcknowledged] = useState(dataSharingConsent);
  const [auditLog, setAuditLog] = useState<ConsentAuditEntry[]>([]);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    if (dataSharingConsent) {
      setAcknowledged(true);
    }
  }, [dataSharingConsent]);

  const fetchAuditLog = async () => {
    if (!teamId) return;
    
    setLoadingAudit(true);
    const { data, error } = await supabase
      .from('consent_audit')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setAuditLog(data);
    }
    setLoadingAudit(false);
  };

  useEffect(() => {
    if (showAuditLog && teamId) {
      fetchAuditLog();
    }
  }, [showAuditLog, teamId]);

  const handleConsentChange = (enabled: boolean) => {
    if (enabled && !acknowledged) {
      // Don't allow enabling without acknowledgment
      return;
    }
    setDataSharingConsent(enabled);
  };

  const handleAcknowledgmentChange = (checked: boolean) => {
    setAcknowledged(checked);
    if (!checked && dataSharingConsent) {
      // If unchecking acknowledgment while consent is enabled, disable consent
      setDataSharingConsent(false);
    }
  };

  return (
    <Card className="card-athletic">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy & Data Sharing
        </CardTitle>
        <CardDescription>
          Control how your team's wrestler information is shared with meet hosts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-warning/50 bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-sm">
            Your roster contains personal information about minors (names, ages, weights). 
            Enable data sharing consent to allow meet hosts to view this information for matchmaking.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 p-4 border border-border rounded-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="data-sharing" className="text-base font-medium">
                Allow Meet Hosts to View Roster Data
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, teams hosting meets you participate in can see your wrestlers' 
                names, ages, weights, experience, and skill levels for matchmaking purposes.
              </p>
            </div>
            <Switch
              id="data-sharing"
              checked={dataSharingConsent}
              onCheckedChange={handleConsentChange}
              disabled={!acknowledged}
            />
          </div>

          {/* Acknowledgment checkbox - required to enable sharing */}
          <div className="flex items-start space-x-3 pt-2 border-t border-border">
            <Checkbox
              id="acknowledge"
              checked={acknowledged}
              onCheckedChange={(checked) => handleAcknowledgmentChange(checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="acknowledge"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I acknowledge and consent
              </Label>
              <p className="text-xs text-muted-foreground">
                I confirm that I have the authority to share this information on behalf of the team 
                and that parents/guardians of the wrestlers have been informed about data sharing 
                practices for meet coordination purposes.
              </p>
            </div>
          </div>

          {dataSharingConsent && dataSharingConsentAt && (
            <p className="text-xs text-muted-foreground pt-2">
              Consent enabled on {format(new Date(dataSharingConsentAt), 'MMM d, yyyy \'at\' h:mm a')}
            </p>
          )}
        </div>

        {!dataSharingConsent && (
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> If data sharing is disabled, meet hosts will not be able to 
            see your wrestlers when creating match pairings. You may need to coordinate 
            roster information separately.
          </p>
        )}

        {/* Audit Log Section */}
        <Collapsible open={showAuditLog} onOpenChange={setShowAuditLog}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
              <History className="w-4 h-4" />
              {showAuditLog ? 'Hide' : 'View'} Consent History
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="border border-border rounded-lg p-3 bg-muted/30">
              <h4 className="text-sm font-medium mb-2">Consent Change History</h4>
              {loadingAudit ? (
                <p className="text-xs text-muted-foreground">Loading...</p>
              ) : auditLog.length === 0 ? (
                <p className="text-xs text-muted-foreground">No consent changes recorded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {auditLog.map((entry) => (
                    <li key={entry.id} className="text-xs flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        entry.action === 'enabled' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {entry.action === 'enabled' ? 'Enabled' : 'Disabled'}
                      </span>
                      <span className="text-muted-foreground">
                        {format(new Date(entry.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
