import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import {
  Download,
  Palette,
  Image,
  Copy,
  Check,
} from "lucide-react";

interface ColorSwatch {
  name: string;
  variable: string;
  description: string;
}

const brandColors: ColorSwatch[] = [
  { name: "Primary", variable: "--primary", description: "Main brand color" },
  { name: "Secondary", variable: "--secondary", description: "Supporting color" },
  { name: "Accent", variable: "--accent", description: "Highlight color" },
  { name: "Background", variable: "--background", description: "Page background" },
  { name: "Foreground", variable: "--foreground", description: "Main text color" },
  { name: "Muted", variable: "--muted", description: "Subtle backgrounds" },
  { name: "Destructive", variable: "--destructive", description: "Error/danger states" },
];

function ColorSwatchItem({ color, onCopy }: { color: ColorSwatch; onCopy: (colorName: string) => void }) {
  const [copied, setCopied] = useState(false);

  const getColorValue = () => {
    const root = document.documentElement;
    const value = getComputedStyle(root).getPropertyValue(color.variable).trim();
    return value;
  };

  const copyColor = () => {
    const value = getColorValue();
    navigator.clipboard.writeText(`hsl(${value})`);
    setCopied(true);
    onCopy(color.name);
    toast({
      title: "Copied!",
      description: `${color.name} color copied to clipboard`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={copyColor}
    >
      <div
        className="h-10 w-10 rounded-md border shadow-sm flex-shrink-0"
        style={{ backgroundColor: `hsl(var(${color.variable}))` }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{color.name}</p>
        <p className="text-xs text-muted-foreground truncate">{color.description}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? (
          <Check className="h-4 w-4 text-primary" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

function DownloadableAsset({
  name,
  description,
  fileName,
  filePath,
  icon: Icon,
  onDownload,
}: {
  name: string;
  description: string;
  fileName: string;
  filePath: string;
  icon: React.ElementType;
  onDownload: () => void;
}) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = filePath;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onDownload();
    toast({
      title: "Download started",
      description: `${name} is being downloaded`,
    });
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={handleDownload}>
        <Download className="h-4 w-4 mr-2" />
        Download
      </Button>
    </div>
  );
}

export function BrandAssets() {
  const { logAction } = useAuditLog();

  const handleLogoDownload = () => {
    logAction({ action: "DOWNLOAD_LOGO", details: { fileName: "logo.svg" } });
  };

  const handleFaviconDownload = () => {
    logAction({ action: "DOWNLOAD_FAVICON", details: { fileName: "favicon.ico" } });
  };

  const handleColorCopy = (colorName: string) => {
    logAction({ action: "COPY_BRAND_COLOR", details: { color: colorName } });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Downloadable Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Downloadable Files</CardTitle>
          <CardDescription>
            Download logo and icon files for your brand
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <DownloadableAsset
            name="Logo"
            description="Primary logo (SVG)"
            fileName="logo.svg"
            filePath="/placeholder.svg"
            icon={Image}
            onDownload={handleLogoDownload}
          />
          <DownloadableAsset
            name="Favicon"
            description="Browser icon (ICO)"
            fileName="favicon.ico"
            filePath="/favicon.ico"
            icon={Image}
            onDownload={handleFaviconDownload}
          />
          <p className="text-xs text-muted-foreground pt-2">
            Replace these placeholder assets with your own brand files in the public folder.
          </p>
        </CardContent>
      </Card>

      {/* Brand Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Brand Colors
          </CardTitle>
          <CardDescription>
            Click any color to copy its HSL value
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {brandColors.map((color) => (
              <ColorSwatchItem key={color.variable} color={color} onCopy={handleColorCopy} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
