 import { useState, useEffect } from "react";
 import { useAuth } from "@/hooks/useAuth";
 import { supabase } from "@/integrations/supabase/client";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
 } from "@/components/ui/card";
 import { Switch } from "@/components/ui/switch";
 import { Label } from "@/components/ui/label";
 import { Input } from "@/components/ui/input";
 import { Separator } from "@/components/ui/separator";
 import { Badge } from "@/components/ui/badge";
 import { Bell, Mail, MessageSquare, Webhook, Loader2 } from "lucide-react";
 import { toast } from "@/hooks/use-toast";
 
 interface NotificationPreferences {
   id: string;
   user_id: string;
   support_in_app: boolean;
   support_email: boolean;
   support_sms: boolean;
   support_webhook: boolean;
   billing_in_app: boolean;
   billing_email: boolean;
   billing_sms: boolean;
   billing_webhook: boolean;
   security_in_app: boolean;
   security_email: boolean;
   security_sms: boolean;
   security_webhook: boolean;
   updates_in_app: boolean;
   updates_email: boolean;
   updates_sms: boolean;
   updates_webhook: boolean;
   mentions_in_app: boolean;
   mentions_email: boolean;
   mentions_sms: boolean;
   mentions_webhook: boolean;
   webhook_url: string | null;
 }
 
 type Category = "support" | "billing" | "security" | "updates" | "mentions";
 type Channel = "in_app" | "email" | "sms" | "webhook";
 
 const CATEGORIES: { key: Category; label: string; description: string }[] = [
   { key: "support", label: "Support", description: "Ticket replies and updates" },
   { key: "billing", label: "Billing", description: "Invoices and payment alerts" },
   { key: "security", label: "Security", description: "Login alerts and account security" },
   { key: "updates", label: "Updates", description: "Product news and feature releases" },
   { key: "mentions", label: "Mentions", description: "When someone mentions you" },
 ];
 
 const CHANNELS: { key: Channel; label: string; icon: React.ElementType }[] = [
   { key: "in_app", label: "In-App", icon: Bell },
   { key: "email", label: "Email", icon: Mail },
   { key: "sms", label: "SMS", icon: MessageSquare },
   { key: "webhook", label: "Webhook", icon: Webhook },
 ];
 
 export function NotificationPreferences() {
   const { user } = useAuth();
   const queryClient = useQueryClient();
   const [webhookUrl, setWebhookUrl] = useState("");
 
   const { data: prefs, isLoading } = useQuery({
     queryKey: ["notification-preferences", user?.id],
     queryFn: async () => {
       if (!user?.id) return null;
       
       const { data, error } = await supabase
         .from("notification_preferences")
         .select("*")
         .eq("user_id", user.id)
         .single();
 
       if (error && error.code !== "PGRST116") throw error;
       
       // Initialize if not exists
       if (!data) {
         const { data: newPrefs, error: insertError } = await supabase
           .from("notification_preferences")
           .insert({ user_id: user.id })
           .select()
           .single();
         
         if (insertError) throw insertError;
         return newPrefs as NotificationPreferences;
       }
       
       return data as NotificationPreferences;
     },
     enabled: !!user?.id,
   });
 
   useEffect(() => {
     if (prefs?.webhook_url) {
       setWebhookUrl(prefs.webhook_url);
     }
   }, [prefs?.webhook_url]);
 
   const updateMutation = useMutation({
     mutationFn: async (updates: Partial<NotificationPreferences>) => {
       if (!user?.id) throw new Error("Not authenticated");
       
       const { error } = await supabase
         .from("notification_preferences")
         .update({ ...updates, updated_at: new Date().toISOString() })
         .eq("user_id", user.id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["notification-preferences", user?.id] });
     },
     onError: (error) => {
       toast({
         variant: "destructive",
         title: "Failed to update preferences",
         description: error instanceof Error ? error.message : "Unknown error",
       });
     },
   });
 
   const handleToggle = (category: Category, channel: Channel, value: boolean) => {
   // Security and billing email cannot be disabled
   if ((category === "security" || category === "billing") && channel === "email" && !value) {
       toast({
       title: "Required notifications",
       description: `${category === "security" ? "Security" : "Billing"} email notifications cannot be disabled for your protection.`,
       });
       return;
     }
 
     const key = `${category}_${channel}` as keyof NotificationPreferences;
     updateMutation.mutate({ [key]: value });
   };
 
   const handleWebhookUrlSave = () => {
     updateMutation.mutate({ webhook_url: webhookUrl || null });
     toast({ title: "Webhook URL saved" });
   };
 
   const getValue = (category: Category, channel: Channel): boolean => {
     if (!prefs) return false;
     const key = `${category}_${channel}` as keyof NotificationPreferences;
     return prefs[key] as boolean;
   };
 
   if (isLoading) {
     return (
       <Card>
         <CardContent className="flex items-center justify-center py-8">
           <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card>
       <CardHeader>
         <div className="flex items-center gap-2">
           <Bell className="h-5 w-5 text-muted-foreground" />
           <CardTitle>Notification Preferences</CardTitle>
         </div>
         <CardDescription>
           Choose how you want to receive notifications for different types of updates
         </CardDescription>
       </CardHeader>
       <CardContent className="space-y-6">
         {/* Channel Headers */}
         <div className="grid grid-cols-[1fr_repeat(4,60px)] gap-2 items-center text-center">
           <div></div>
           {CHANNELS.map((channel) => {
             const Icon = channel.icon;
             return (
               <div key={channel.key} className="flex flex-col items-center gap-1">
                 <Icon className="h-4 w-4 text-muted-foreground" />
                 <span className="text-xs text-muted-foreground">{channel.label}</span>
               </div>
             );
           })}
         </div>
 
         <Separator />
 
         {/* Category Rows */}
         {CATEGORIES.map((category) => (
           <div key={category.key} className="grid grid-cols-[1fr_repeat(4,60px)] gap-2 items-center">
             <div>
               <Label className="font-medium">{category.label}</Label>
               <p className="text-xs text-muted-foreground">{category.description}</p>
             </div>
             {CHANNELS.map((channel) => {
               const isRequiredEmail = (category.key === "security" || category.key === "billing") && channel.key === "email";
               return (
                 <div key={channel.key} className="flex justify-center">
                   {isRequiredEmail ? (
                     <Badge variant="secondary" className="text-[10px]">Required</Badge>
                   ) : (
                     <Switch
                       checked={getValue(category.key, channel.key)}
                       onCheckedChange={(value) => handleToggle(category.key, channel.key, value)}
                       disabled={updateMutation.isPending}
                     />
                   )}
                 </div>
               );
             })}
           </div>
         ))}
 
         <Separator />
 
         {/* Webhook URL */}
         <div className="space-y-2">
           <Label>Webhook URL (optional)</Label>
           <div className="flex gap-2">
             <Input
               value={webhookUrl}
               onChange={(e) => setWebhookUrl(e.target.value)}
               placeholder="https://your-webhook-endpoint.com/notifications"
               className="flex-1"
             />
             <button
               onClick={handleWebhookUrlSave}
               disabled={updateMutation.isPending || webhookUrl === (prefs?.webhook_url || "")}
               className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
             >
               Save
             </button>
           </div>
           <p className="text-xs text-muted-foreground">
             Receive notifications via HTTP POST to your custom endpoint
           </p>
         </div>
       </CardContent>
     </Card>
   );
 }