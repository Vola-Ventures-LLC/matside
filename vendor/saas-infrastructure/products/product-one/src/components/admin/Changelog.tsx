import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, Column } from "@/components/ui/data-table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Bug,
  Zap,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string | null;
  type: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  feature: { label: "Feature", icon: Sparkles, variant: "default" },
  bugfix: { label: "Bug Fix", icon: Bug, variant: "secondary" },
  improvement: { label: "Improvement", icon: Zap, variant: "outline" },
  breaking: { label: "Breaking", icon: AlertTriangle, variant: "destructive" },
};

export function Changelog() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ChangelogEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("feature");
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("changelog")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch changelog:", error);
      toast.error("Failed to load changelog");
    } else {
      setEntries(data || []);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setVersion("");
    setTitle("");
    setDescription("");
    setType("feature");
    setIsPublished(false);
    setSelectedEntry(null);
  };

  const handleOpenDialog = (entry?: ChangelogEntry) => {
    if (entry) {
      setSelectedEntry(entry);
      setVersion(entry.version);
      setTitle(entry.title);
      setDescription(entry.description || "");
      setType(entry.type);
      setIsPublished(entry.is_published);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!version.trim() || !title.trim()) {
      toast.error("Version and title are required");
      return;
    }

    setIsSaving(true);

    const entryData = {
      version: version.trim(),
      title: title.trim(),
      description: description.trim() || null,
      type,
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
      created_by: user?.id || null,
    };

    if (selectedEntry) {
      const { error } = await supabase
        .from("changelog")
        .update(entryData)
        .eq("id", selectedEntry.id);

      if (error) {
        toast.error("Failed to update entry");
        console.error(error);
      } else {
        toast.success("Entry updated");
        fetchEntries();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase.from("changelog").insert([entryData]);

      if (error) {
        toast.error("Failed to create entry");
        console.error(error);
      } else {
        toast.success("Entry created");
        fetchEntries();
        setIsDialogOpen(false);
        resetForm();
      }
    }

    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;

    const { error } = await supabase
      .from("changelog")
      .delete()
      .eq("id", selectedEntry.id);

    if (error) {
      toast.error("Failed to delete entry");
      console.error(error);
    } else {
      toast.success("Entry deleted");
      fetchEntries();
    }

    setIsDeleteDialogOpen(false);
    setSelectedEntry(null);
  };

  const handleTogglePublish = async (entry: ChangelogEntry) => {
    const newPublished = !entry.is_published;
    const { error } = await supabase
      .from("changelog")
      .update({
        is_published: newPublished,
        published_at: newPublished ? new Date().toISOString() : null,
      })
      .eq("id", entry.id);

    if (error) {
      toast.error("Failed to update entry");
      console.error(error);
    } else {
      toast.success(newPublished ? "Entry published" : "Entry unpublished");
      fetchEntries();
    }
  };

  const getTypeBadge = (entryType: string) => {
    const config = typeConfig[entryType] || typeConfig.feature;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const columns: Column<ChangelogEntry>[] = [
    {
      key: "version",
      header: "Version",
      className: "font-mono font-medium",
    },
    {
      key: "title",
      header: "Title",
      render: (entry) => (
        <span className="max-w-[200px] truncate block">{entry.title}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (entry) => getTypeBadge(entry.type),
    },
    {
      key: "is_published",
      header: "Status",
      sortable: false,
      render: (entry) => (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => handleTogglePublish(entry)}
        >
          {entry.is_published ? (
            <>
              <Eye className="h-3 w-3 text-primary" />
              <span className="text-primary">Published</span>
            </>
          ) : (
            <>
              <EyeOff className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Draft</span>
            </>
          )}
        </Button>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      render: (entry) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(entry.created_at), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      sortable: false,
      render: (entry) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenDialog(entry)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedEntry(entry);
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription>
            Manage version history and release notes
          </CardDescription>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" text="Loading changelog..." />
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No changelog entries"
            description="Start documenting your platform updates"
          />
        ) : (
          <div className="rounded-md border">
            <DataTable
              data={entries}
              columns={columns}
              defaultSortKey="created_at"
              defaultSortDirection="desc"
            />
          </div>
        )}

        {/* Create/Edit Sheet */}
        <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>
                {selectedEntry ? "Edit Entry" : "New Changelog Entry"}
              </SheetTitle>
              <SheetDescription>
                Document a platform update or change
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version">Version *</Label>
                  <Input
                    id="version"
                    placeholder="e.g., 1.2.0"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feature">🎉 Feature</SelectItem>
                      <SelectItem value="bugfix">🐛 Bug Fix</SelectItem>
                      <SelectItem value="improvement">⚡ Improvement</SelectItem>
                      <SelectItem value="breaking">⚠️ Breaking Change</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief summary of the change"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of what changed..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="published" className="text-sm font-medium">
                      Visibility
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {isPublished 
                        ? "This entry is visible on the public changelog" 
                        : "This entry is only visible to admins"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isPublished ? "default" : "secondary"}>
                      {isPublished ? "Published" : "Draft"}
                    </Badge>
                    <Switch
                      id="published"
                      checked={isPublished}
                      onCheckedChange={setIsPublished}
                    />
                  </div>
                </div>
              </div>
            </div>

            <SheetFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : selectedEntry ? "Update" : "Create"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Delete Confirmation Sheet */}
        <Sheet open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Delete Entry</SheetTitle>
              <SheetDescription>
                Are you sure you want to delete "{selectedEntry?.title}"? This action cannot be undone.
              </SheetDescription>
            </SheetHeader>
            <SheetFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
}
