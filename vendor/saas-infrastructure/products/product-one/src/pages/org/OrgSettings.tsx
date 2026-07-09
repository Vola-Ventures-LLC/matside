import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgContext } from "@/hooks/useOrgContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { OrgLogoUpload } from "@/components/org/OrgLogoUpload";
import { Building2, Save, Trash2, Check, AlertCircle } from "lucide-react";

// Helper to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export default function OrgSettings() {
  const { activeOrg, activeOrgId, isOrgOwner, refreshMemberships } = useOrgContext();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  useEffect(() => {
    if (activeOrg) {
      setName(activeOrg.organization.name);
      setSlug(activeOrg.organization.slug);
      setOriginalSlug(activeOrg.organization.slug);
      fetchOrgDetails();
    }
  }, [activeOrg, fetchOrgDetails]);

  const fetchOrgDetails = useCallback(async () => {
    if (!activeOrgId) return;

    const { data } = await supabase
      .from("organizations")
      .select("logo_url")
      .eq("id", activeOrgId)
      .single();

    if (data) {
      setLogoUrl(data.logo_url);
    }
  }, [activeOrgId]);

  // Debounced slug uniqueness check
  useEffect(() => {
    if (!slug || slug === originalSlug) {
      setSlugError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingSlug(true);
      const { data, error } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .neq("id", activeOrgId || "")
        .maybeSingle();

      if (data) {
        setSlugError("This slug is already taken");
      } else {
        setSlugError(null);
      }
      setIsCheckingSlug(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [slug, originalSlug, activeOrgId]);

  const handleNameChange = (newName: string) => {
    setName(newName);
    // Auto-generate slug if it hasn't been manually edited or matches the generated version
    const currentGeneratedSlug = generateSlug(name);
    if (slug === originalSlug || slug === currentGeneratedSlug || slug === "") {
      setSlug(generateSlug(newName));
    }
  };

  const handleSlugChange = (value: string) => {
    const formatted = value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    setSlug(formatted);
  };

  const handleSave = async () => {
    if (!activeOrgId || slugError) return;
    
    if (!slug.trim()) {
      toast({
        variant: "destructive",
        title: "Slug required",
        description: "Please enter a URL slug for your organization",
      });
      return;
    }
    
    setIsSaving(true);
    
    const { error } = await supabase
      .from("organizations")
      .update({ name, slug })
      .eq("id", activeOrgId);

    if (error) {
      if (error.message.includes("duplicate") || error.code === "23505") {
        setSlugError("This slug is already taken");
      } else {
        toast({
          variant: "destructive",
          title: "Failed to update organization",
          description: error.message,
        });
      }
    } else {
      setOriginalSlug(slug);
      setShowSaveSuccess(true);
      refreshMemberships();
      setTimeout(() => setShowSaveSuccess(false), 2000);
    }
    
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!activeOrgId) return;
    
    setIsDeleting(true);
    
    // First delete all members
    await supabase
      .from("organization_members")
      .delete()
      .eq("organization_id", activeOrgId);
    
    // Then delete the organization
    const { error } = await supabase
      .from("organizations")
      .delete()
      .eq("id", activeOrgId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete organization",
        description: error.message,
      });
      setIsDeleting(false);
    } else {
      toast({
        title: "Organization deleted",
        description: "The organization has been permanently deleted",
      });
      // Refresh to go back to personal context
      window.location.href = "/dashboard";
    }
  };

  if (!activeOrg) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No organization selected</p>
      </div>
    );
  }

  if (!isOrgOwner) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Only the organization owner can access settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization's configuration
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>
              Update your organization's basic information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Organization Logo</Label>
              <OrgLogoUpload
                orgId={activeOrgId!}
                orgName={name}
                currentLogoUrl={logoUrl}
                onLogoUpdated={setLogoUrl}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Organization"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <div className="relative">
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="my-organization"
                  className={slugError ? "border-destructive pr-10" : ""}
                />
                {isCheckingSlug && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
                {slugError && !isCheckingSlug && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                )}
                {!slugError && !isCheckingSlug && slug !== originalSlug && slug && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                )}
              </div>
              {slugError ? (
                <p className="text-xs text-destructive">{slugError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Used in URLs: /org/{slug || "my-organization"}
                </p>
              )}
            </div>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !!slugError || isCheckingSlug || showSaveSuccess}
            >
              {showSaveSuccess ? (
                <span className="flex items-center gap-2 animate-fade-in">
                  <Check className="h-4 w-4" />
                  Saved
                </span>
              ) : isSaving ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Organization</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this organization and all its data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      <span className="font-semibold"> {activeOrg.organization.name} </span>
                      and remove all associated data including members, subscriptions,
                      and content.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete Organization"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
