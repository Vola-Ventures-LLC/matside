import { BrandAssets } from "@/components/admin/BrandAssets";
import { EmailBranding } from "@/components/admin/EmailBranding";
import { FeatureToggles } from "@/components/admin/FeatureToggles";
import { Palette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

export default function AdminBrand() {
  const { isOwner } = useAuth();

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Palette className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Brand Assets</h1>
          <p className="text-muted-foreground">
            Manage your brand identity, colors, and email styling
          </p>
        </div>
      </div>

      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assets">Brand Files & Colors</TabsTrigger>
          <TabsTrigger value="email">Email Branding</TabsTrigger>
          {isOwner && <TabsTrigger value="features">Features</TabsTrigger>}
        </TabsList>

        <TabsContent value="assets">
          <BrandAssets />
        </TabsContent>

        <TabsContent value="email">
          <EmailBranding />
        </TabsContent>

        {isOwner && (
          <TabsContent value="features">
            <FeatureToggles />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
