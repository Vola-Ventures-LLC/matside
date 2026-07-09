import { useState, useEffect, useCallback } from "react";
import { useDataExport, DataPreview } from "@/hooks/useDataExport";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Download, Database, FileJson, Shield } from "lucide-react";

export function DataExportCard() {
  const { exportData, loadPreview, preview, isExporting, isLoadingPreview } = useDataExport();
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (showPreview && !preview) {
      loadPreview();
    }
  }, [showPreview, loadPreview, preview]);

  const handleExport = async () => {
    await exportData();
  };

  const previewItems = preview ? [
    { label: "Profile", value: preview.profile ? "Included" : "—", isBoolean: true },
    { label: "Email preferences", value: preview.email_preferences ? "Included" : "—", isBoolean: true },
    { label: "Organizations", value: preview.organizations },
    { label: "Subscriptions", value: preview.subscriptions },
    { label: "Support conversations", value: preview.support_conversations },
    { label: "Login events", value: `${preview.login_events} (last 100)` },
    { label: "Content items", value: preview.content_items },
    { label: "Milestones", value: preview.milestones },
  ] : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Your Data</CardTitle>
        </div>
        <CardDescription>
          Download a copy of all your personal data (GDPR Article 20)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <Shield className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Your right to data portability</p>
            <p className="text-muted-foreground">
              You can request a copy of your personal data at any time. The export includes
              your profile, preferences, activity history, and content you've created.
            </p>
          </div>
        </div>

        {showPreview && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileJson className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Data included in export</span>
              </div>
              
              {isLoadingPreview ? (
                <div className="py-4 text-center">
                  <LoadingSpinner size="sm" text="Loading preview..." />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {previewItems.map((item) => (
                    <div key={item.label} className="flex justify-between p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">{item.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {typeof item.value === "number" ? item.value : item.value}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex gap-2">
          <Button onClick={handleExport} disabled={isExporting} className="gap-2">
            {isExporting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export My Data
          </Button>
          {!showPreview && (
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              Preview
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
