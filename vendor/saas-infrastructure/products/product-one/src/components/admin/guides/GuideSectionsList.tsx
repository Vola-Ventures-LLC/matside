import { useState } from "react";
import { GuideSection, useGuideSections } from "@/hooks/useGuides";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  GripVertical, 
  Pencil, 
  Trash2, 
  BookOpen,
  Eye,
  EyeOff,
  FileText
} from "lucide-react";
import { Link } from "react-router-dom";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface SectionFormData {
  title: string;
  slug: string;
  description: string;
  icon: string;
  visible_to_roles: string[];
  is_active: boolean;
}

const defaultFormData: SectionFormData = {
  title: "",
  slug: "",
  description: "",
  icon: "BookOpen",
  visible_to_roles: [],
  is_active: true,
};

export function GuideSectionsList() {
  const { sections, loading, createSection, updateSection, deleteSection, reorderSections } = useGuideSections();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<GuideSection | null>(null);
  const [deletingSection, setDeletingSection] = useState<GuideSection | null>(null);
  const [formData, setFormData] = useState<SectionFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  const handleOpenCreate = () => {
    setEditingSection(null);
    setFormData(defaultFormData);
    setSheetOpen(true);
  };

  const handleOpenEdit = (section: GuideSection) => {
    setEditingSection(section);
    setFormData({
      title: section.title,
      slug: section.slug,
      description: section.description || "",
      icon: section.icon,
      visible_to_roles: section.visible_to_roles,
      is_active: section.is_active,
    });
    setSheetOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editingSection) {
      await updateSection(editingSection.id, formData);
    } else {
      await createSection(formData);
    }
    setSaving(false);
    setSheetOpen(false);
  };

  const handleDelete = async () => {
    if (deletingSection) {
      await deleteSection(deletingSection.id);
      setDeleteDialogOpen(false);
      setDeletingSection(null);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardDescription>
              Organize guides into sections. Drag to reorder.
            </CardDescription>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sections yet. Create your first section to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{section.title}</span>
                      {!section.is_active && (
                        <Badge variant="secondary">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Hidden
                        </Badge>
                      )}
                      {section.visible_to_roles.length > 0 && (
                        <Badge variant="outline">
                          {section.visible_to_roles.join(", ")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {section.description || "No description"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/guides/sections/${section.id}`}>
                        <FileText className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(section)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeletingSection(section);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingSection ? "Edit Section" : "New Section"}</SheetTitle>
            <SheetDescription>
              {editingSection
                ? "Update the section details below."
                : "Create a new section to organize your guides."}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setFormData({
                    ...formData,
                    title,
                    slug: editingSection ? formData.slug : generateSlug(title),
                  });
                }}
                placeholder="Getting Started"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="getting-started"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Help new users get up and running"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roles">Visible to Roles (comma-separated, empty = all)</Label>
              <Input
                id="roles"
                value={formData.visible_to_roles.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    visible_to_roles: e.target.value
                      .split(",")
                      .map((r) => r.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="user, admin, owner"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
            <Button onClick={handleSave} disabled={saving || !formData.title || !formData.slug} className="w-full">
              {saving ? "Saving..." : editingSection ? "Update Section" : "Create Section"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingSection?.title}" and all its articles.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
