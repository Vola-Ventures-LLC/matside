import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import {
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Mail,
  Shield,
  CreditCard,
  Bell,
  Megaphone,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

type EmailDomainCategory = "transactional" | "support" | "outbound" | "marketing" | "notifications" | "billing";

interface EmailDomain {
  id: string;
  category: EmailDomainCategory;
  subdomain: string;
  display_name: string;
  description: string | null;
  from_name: string;
  is_verified: boolean;
  is_active: boolean;
  resend_domain_id: string | null;
  dns_records: Record<string, unknown> | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  inbound_enabled: boolean;
  inbound_address: string | null;
  reply_to_address: string | null;
}

interface AppEmailConfig {
  id: string;
  primary_domain: string;
  support_inbound_address: string | null;
  default_from_name: string;
}

const categoryConfig: Record<EmailDomainCategory, { icon: React.ElementType; color: string; label: string }> = {
  transactional: { icon: Mail, color: "bg-blue-500/10 text-blue-600", label: "Transactional" },
  support: { icon: MessageSquare, color: "bg-purple-500/10 text-purple-600", label: "Support" },
  outbound: { icon: Megaphone, color: "bg-orange-500/10 text-orange-600", label: "Outbound" },
  marketing: { icon: Bell, color: "bg-pink-500/10 text-pink-600", label: "Marketing" },
  notifications: { icon: Bell, color: "bg-cyan-500/10 text-cyan-600", label: "Notifications" },
  billing: { icon: CreditCard, color: "bg-green-500/10 text-green-600", label: "Billing" },
};

export default function AdminEmailDomains() {
  const [domains, setDomains] = useState<EmailDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDomain, setEditingDomain] = useState<EmailDomain | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [brandDomain, setBrandDomain] = useState("");
  const [supportInboundAddress, setSupportInboundAddress] = useState("");
  const [defaultFromName, setDefaultFromName] = useState("Support Team");
  const [appConfig, setAppConfig] = useState<AppEmailConfig | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [isPrimaryEditOpen, setIsPrimaryEditOpen] = useState(false);

  useEffect(() => {
    fetchDomains();
    fetchAppConfig();
  }, []);

  const fetchAppConfig = async () => {
    const { data, error } = await supabase
      .from("app_email_config")
      .select("*")
      .limit(1)
      .single();

    if (!error && data) {
      setAppConfig(data as AppEmailConfig);
      setBrandDomain(data.primary_domain || "");
      setSupportInboundAddress(data.support_inbound_address || "");
      setDefaultFromName(data.default_from_name || "Support Team");
    }
  };

  const saveAppConfig = async () => {
    if (!brandDomain.trim()) return;
    
    setIsSavingConfig(true);
    
    const configData = { 
      primary_domain: brandDomain.trim(),
      support_inbound_address: supportInboundAddress.trim() || null,
      default_from_name: defaultFromName.trim() || "Support Team",
      updated_at: new Date().toISOString()
    };
    
    if (appConfig) {
      const { error } = await supabase
        .from("app_email_config")
        .update(configData)
        .eq("id", appConfig.id);
      
      if (error) {
        toast({ title: "Error", description: "Failed to save configuration", variant: "destructive" });
      } else {
        toast({ title: "Saved", description: "Email configuration updated" });
        fetchAppConfig();
      }
    } else {
      const { error } = await supabase
        .from("app_email_config")
        .insert(configData);
      
      if (error) {
        toast({ title: "Error", description: "Failed to save configuration", variant: "destructive" });
      } else {
        toast({ title: "Saved", description: "Email configuration created" });
        fetchAppConfig();
      }
    }
    
    setIsSavingConfig(false);
  };

  const fetchDomains = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("email_domains")
      .select("*")
      .order("category");

    if (error) {
      console.error("Failed to fetch email domains:", error);
      toast({ title: "Error", description: "Failed to load email domains", variant: "destructive" });
    } else {
      setDomains((data || []) as EmailDomain[]);
    }
    setIsLoading(false);
  };

  const handleSave = async (domain: Partial<EmailDomain>) => {
    if (editingDomain) {
      const { error } = await supabase
        .from("email_domains")
        .update({
          display_name: domain.display_name,
          description: domain.description,
          from_name: domain.from_name,
          subdomain: domain.subdomain,
          is_active: domain.is_active,
          inbound_enabled: domain.inbound_enabled,
          inbound_address: domain.inbound_address,
          reply_to_address: domain.reply_to_address,
        })
        .eq("id", editingDomain.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update domain", variant: "destructive" });
        return;
      }
      toast({ title: "Success", description: "Domain updated successfully" });
    }
    setIsDialogOpen(false);
    setEditingDomain(null);
    fetchDomains();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("email_domains").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete domain", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Domain deleted" });
    fetchDomains();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast({ title: "Copied!", description: "Copied to clipboard" });
    setTimeout(() => setCopied(null), 2000);
  };

  const getFullDomain = (subdomain: string) => {
    if (!brandDomain) return `${subdomain}.yourdomain.com`;
    return `${subdomain}.${brandDomain}`;
  };

  const verifiedCount = domains.filter(d => d.is_verified).length;
  const activeCount = domains.filter(d => d.is_active).length;

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Globe className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Email Domains</h1>
          <p className="text-muted-foreground">
            Configure sending domains for different email categories
          </p>
        </div>
      </div>

      {/* Compact Stats - Hidden on mobile, inline on desktop */}
      <div className="hidden sm:flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{domains.length}</span>
          <span className="text-muted-foreground">domains</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-primary" />
          <span className="font-medium">{verifiedCount}</span>
          <span className="text-muted-foreground">verified</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{activeCount}</span>
          <span className="text-muted-foreground">active</span>
        </div>
      </div>

      {/* Setup Guide */}
      <Alert className="border-primary/20 bg-primary/5">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Domain Setup Required</AlertTitle>
        <AlertDescription>
          <p className="mb-4">
            Each subdomain must be verified in Resend before sending emails. Follow these steps for each domain:
          </p>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="step-1">
              <AccordionTrigger className="text-sm font-medium">
                Step 1: Add Domain in Resend
              </AccordionTrigger>
              <AccordionContent className="text-sm space-y-2">
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Go to <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-primary underline">resend.com/domains</a></li>
                  <li>Click "Add Domain"</li>
                  <li>Enter the full subdomain (e.g., mail.yourbrand.com)</li>
                  <li>Copy the DNS records provided</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="step-2">
              <AccordionTrigger className="text-sm font-medium">
                Step 2: Configure DNS Records
              </AccordionTrigger>
              <AccordionContent className="text-sm space-y-2">
                <p className="text-muted-foreground mb-2">Add these records at your DNS provider for each subdomain:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>SPF Record</strong> - Authorizes Resend to send on your behalf</li>
                  <li><strong>DKIM Records</strong> - Cryptographically signs your emails</li>
                  <li><strong>DMARC Record</strong> - Sets policy for email authentication</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="step-3">
              <AccordionTrigger className="text-sm font-medium">
                Step 3: Verify Domain
              </AccordionTrigger>
              <AccordionContent className="text-sm space-y-2">
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Wait for DNS propagation (up to 48 hours)</li>
                  <li>Click "Verify" in Resend dashboard</li>
                  <li>Once verified, update the status here</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="mt-4">
            <Button variant="outline" size="sm" asChild>
              <a href="https://resend.com/docs/dashboard/domains/introduction" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Resend Domain Docs
              </a>
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Domains Table */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Domains</CardTitle>
          <CardDescription>
            Manage your email sending domains by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" text="Loading domains..." />
            </div>
          ) : domains.length === 0 ? (
            <EmptyState
              icon={Globe}
              title="No domains configured"
              description="Add your first email sending domain"
            />
          ) : (
            <div className="rounded-md border">
              <DataTable
                data={[
                  {
                    id: "primary",
                    category: "primary" as EmailDomainCategory,
                    subdomain: brandDomain,
                    display_name: "Primary Domain",
                    from_name: defaultFromName || "—",
                    is_verified: domains.some(d => d.is_verified),
                    is_active: true,
                    isPrimary: true,
                  } as EmailDomain & { isPrimary?: boolean },
                  ...domains,
                ]}
                columns={[
                  {
                    key: "category",
                    header: "Category",
                    render: (row) => {
                      if (row.isPrimary) {
                        return (
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Globe className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">Primary Domain</p>
                              <p className="text-xs text-muted-foreground">Main brand domain</p>
                            </div>
                          </div>
                        );
                      }
                      const config = categoryConfig[row.category];
                      const Icon = config.icon;
                      return (
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-lg ${config.color} flex items-center justify-center`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{row.display_name}</p>
                            <p className="text-xs text-muted-foreground">{config.label}</p>
                          </div>
                        </div>
                      );
                    },
                  },
                  {
                    key: "subdomain",
                    header: "Subdomain",
                    render: (row) => {
                      if (row.isPrimary) {
                        return (
                          <>
                            {brandDomain ? (
                              <div className="flex items-center gap-2">
                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                  {brandDomain}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(brandDomain, "primary")}
                                >
                                  {copied === "primary" ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm italic">Not configured</span>
                            )}
                            {supportInboundAddress && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Inbound: {supportInboundAddress}
                              </p>
                            )}
                          </>
                        );
                      }
                      const fullDomain = getFullDomain(row.subdomain);
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {fullDomain}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(fullDomain, row.id)}
                            >
                              {copied === row.id ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          {row.description && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                              {row.description}
                            </p>
                          )}
                        </>
                      );
                    },
                  },
                  {
                    key: "from_name",
                    header: "From Name",
                    render: (row) => <span className="text-sm">{row.from_name}</span>,
                  },
                  {
                    key: "is_verified",
                    header: "Status",
                    render: (row) => {
                      if (row.isPrimary) {
                        return (
                          <div className="flex flex-col gap-1">
                            {domains.some(d => d.is_verified) ? (
                              <Badge variant="default">
                                <CheckCircle className="h-3 w-3 mr-1" /> Verified
                              </Badge>
                            ) : domains.length > 0 ? (
                              <Badge variant="secondary">
                                <AlertTriangle className="h-3 w-3 mr-1" /> Pending
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                <XCircle className="h-3 w-3 mr-1" /> No Subdomains
                              </Badge>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div className="flex flex-col gap-1">
                          <Badge variant={row.is_verified ? "default" : "secondary"}>
                            {row.is_verified ? (
                              <><CheckCircle className="h-3 w-3 mr-1" /> Verified</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" /> Unverified</>
                            )}
                          </Badge>
                          {!row.is_active && (
                            <Badge variant="outline" className="text-muted-foreground">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      );
                    },
                  },
                  {
                    key: "actions",
                    header: "Actions",
                    sortable: false,
                    headerClassName: "text-right",
                    className: "text-right",
                    render: (row) => {
                      if (row.isPrimary) {
                        return (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsPrimaryEditOpen(true)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        );
                      }
                      return (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingDomain(row);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    },
                  },
                ]}
                defaultSortKey="category"
                defaultSortDirection="asc"
                emptyMessage="No email domains configured"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Domain Sheet */}
      <EditDomainDialog
        domain={editingDomain}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
      />

      {/* Edit Primary Domain Sheet */}
      <Sheet open={isPrimaryEditOpen} onOpenChange={setIsPrimaryEditOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Primary Domain</SheetTitle>
            <SheetDescription>
              Configure your main brand domain for email sending
            </SheetDescription>
          </SheetHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              saveAppConfig();
              setIsPrimaryEditOpen(false);
            }} 
            className="space-y-4 mt-6"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-brand-domain">Primary Domain</Label>
              <Input
                id="edit-brand-domain"
                placeholder="yourbrand.com"
                value={brandDomain}
                onChange={(e) => setBrandDomain(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your main brand domain for email addresses
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-from-name">Default From Name</Label>
              <Input
                id="edit-from-name"
                placeholder="Support Team"
                value={defaultFromName}
                onChange={(e) => setDefaultFromName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Display name for outgoing emails
              </p>
            </div>
            
            {/* Inbound Configuration */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Inbound Email (Ticketing)</p>
                  <p className="text-xs text-muted-foreground">
                    Receive support emails on your primary domain
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-support-inbound">Support Inbound Address</Label>
                <Input
                  id="edit-support-inbound"
                  type="email"
                  placeholder={`support@${brandDomain || "yourbrand.com"}`}
                  value={supportInboundAddress}
                  onChange={(e) => setSupportInboundAddress(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Emails to this address create tickets. User replies are routed here.
                </p>
              </div>
              {supportInboundAddress && (
                <Alert className="bg-background">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-xs">
                    Configure Resend to forward <code className="bg-muted px-1 rounded">{supportInboundAddress}</code> to your inbound-email webhook.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <SheetFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsPrimaryEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingConfig || !brandDomain.trim()}>
                {isSavingConfig ? "Saving..." : "Save Changes"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function EditDomainDialog({
  domain,
  open,
  onOpenChange,
  onSave,
}: {
  domain: EmailDomain | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (domain: Partial<EmailDomain>) => void;
}) {
  const [formData, setFormData] = useState({
    display_name: "",
    description: "",
    from_name: "",
    subdomain: "",
    is_active: true,
    is_verified: false,
    inbound_enabled: false,
    inbound_address: "",
    reply_to_address: "",
  });

  useEffect(() => {
    if (domain) {
      setFormData({
        display_name: domain.display_name,
        description: domain.description || "",
        from_name: domain.from_name,
        subdomain: domain.subdomain,
        is_active: domain.is_active,
        is_verified: domain.is_verified,
        inbound_enabled: domain.inbound_enabled || false,
        inbound_address: domain.inbound_address || "",
        reply_to_address: domain.reply_to_address || "",
      });
    }
  }, [domain]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      inbound_address: formData.inbound_address || null,
      reply_to_address: formData.reply_to_address || null,
    });
  };

  const isSupport = domain?.category === "support";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Domain</SheetTitle>
          <SheetDescription>
            Update the configuration for this email domain
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain</Label>
            <Input
              id="subdomain"
              value={formData.subdomain}
              onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
              placeholder="mail"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="System Emails"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="from_name">From Name</Label>
            <Input
              id="from_name"
              value={formData.from_name}
              onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
              placeholder="Team"
            />
            <p className="text-xs text-muted-foreground">
              Appears as the sender name (e.g., "Team &lt;noreply@mail.brand.com&gt;")
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What this domain is used for..."
              rows={2}
            />
          </div>
          
          {/* Inbound Email Settings - only show for support category */}
          {isSupport && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="inbound_enabled" className="font-medium">Enable Inbound Email</Label>
                  <p className="text-xs text-muted-foreground">Route email replies back to the ticketing system</p>
                </div>
                <Switch
                  id="inbound_enabled"
                  checked={formData.inbound_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, inbound_enabled: checked })}
                />
              </div>
              
              {formData.inbound_enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="inbound_address">Inbound Email Address</Label>
                    <Input
                      id="inbound_address"
                      type="email"
                      value={formData.inbound_address}
                      onChange={(e) => setFormData({ ...formData, inbound_address: e.target.value })}
                      placeholder="tickets@support.yourdomain.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      This address receives user replies. Configure Resend to forward emails to your inbound webhook.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reply_to_address">Reply-To Address (optional)</Label>
                    <Input
                      id="reply_to_address"
                      type="email"
                      value={formData.reply_to_address}
                      onChange={(e) => setFormData({ ...formData, reply_to_address: e.target.value })}
                      placeholder="Same as inbound address if empty"
                    />
                    <p className="text-xs text-muted-foreground">
                      Override the reply-to header. Defaults to inbound address if left empty.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is_verified">Verified in Resend</Label>
              <p className="text-xs text-muted-foreground">Mark as verified after DNS verification</p>
            </div>
            <Switch
              id="is_verified"
              checked={formData.is_verified}
              onCheckedChange={(checked) => setFormData({ ...formData, is_verified: checked })}
            />
          </div>
          <SheetFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
