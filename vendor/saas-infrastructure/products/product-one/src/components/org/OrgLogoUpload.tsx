import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Building2, Upload, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrgLogoUploadProps {
  orgId: string;
  orgName: string;
  currentLogoUrl: string | null;
  onLogoUpdated: (newUrl: string | null) => void;
}

export function OrgLogoUpload({
  orgId,
  orgName,
  currentLogoUrl,
  onLogoUpdated,
}: OrgLogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, etc.)",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please select an image under 2MB",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Delete old logo if exists
      if (currentLogoUrl) {
        const oldPath = currentLogoUrl.split("/org-logos/")[1];
        if (oldPath) {
          await supabase.storage.from("org-logos").remove([oldPath]);
        }
      }

      // Upload new logo
      const fileExt = file.name.split(".").pop();
      const filePath = `${orgId}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("org-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("org-logos")
        .getPublicUrl(filePath);

      // Update organization record
      const { error: updateError } = await supabase
        .from("organizations")
        .update({ logo_url: urlData.publicUrl })
        .eq("id", orgId);

      if (updateError) throw updateError;

      onLogoUpdated(urlData.publicUrl);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!currentLogoUrl) return;

    setIsRemoving(true);

    try {
      // Extract path from URL
      const path = currentLogoUrl.split("/org-logos/")[1];
      if (path) {
        await supabase.storage.from("org-logos").remove([path]);
      }

      // Update organization record
      const { error } = await supabase
        .from("organizations")
        .update({ logo_url: null })
        .eq("id", orgId);

      if (error) throw error;

      onLogoUpdated(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to remove logo",
        description: error.message,
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex items-center gap-6">
      <Avatar className="h-20 w-20">
        <AvatarImage src={currentLogoUrl || undefined} alt={orgName} />
        <AvatarFallback className="bg-primary/10 text-primary text-2xl">
          <Building2 className="h-8 w-8" />
        </AvatarFallback>
      </Avatar>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isRemoving}
          >
            {showSuccess ? (
              <span className="flex items-center gap-2 animate-fade-in">
                <Check className="h-4 w-4" />
                Saved
              </span>
            ) : isUploading ? (
              "Uploading..."
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Logo
              </>
            )}
          </Button>
          {currentLogoUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveLogo}
              disabled={isUploading || isRemoving}
              className="text-destructive hover:text-destructive"
            >
              {isRemoving ? (
                "Removing..."
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </>
              )}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Recommended: Square image, at least 200×200px. Max 2MB.
        </p>
      </div>
    </div>
  );
}
