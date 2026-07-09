import { useState } from "react";
import { GuideRole, useGuideRoles } from "@/hooks/useGuideRoles";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  GripVertical, 
  Pencil, 
  Trash2,
  User,
  Users,
  Building2,
  CreditCard,
  FileEdit,
  Shield,
  Settings,
  Crown,
  Briefcase,
  EyeOff,
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const ICON_OPTIONS = [
  { value: "User", icon: User, label: "User" },
  { value: "Users", icon: Users, label: "Users" },
  { value: "Building2", icon: Building2, label: "Building" },
  { value: "CreditCard", icon: CreditCard, label: "Credit Card" },
  { value: "FileEdit", icon: FileEdit, label: "File Edit" },
  { value: "Shield", icon: Shield, label: "Shield" },
  { value: "Settings", icon: Settings, label: "Settings" },
  { value: "Crown", icon: Crown, label: "Crown" },
  { value: "Briefcase", icon: Briefcase, label: "Briefcase" },
];

const COLOR_OPTIONS = [
  { value: "primary", label: "Primary", class: "bg-primary" },
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "red", label: "Red", class: "bg-red-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
  { value: "teal", label: "Teal", class: "bg-teal-500" },
];

interface RoleFormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
}

const defaultFormData: RoleFormData = {
  name: "",
  slug: "",
  description: "",
  icon: "User",
  color: "primary",
  is_active: true,
};

export function GuideRolesList() {
  const { roles, loading, createRole, updateRole, deleteRole } = useGuideRoles();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<GuideRole | null>(null);
  const [deletingRole, setDeletingRole] = useState<GuideRole | null>(null);
  const [formData, setFormData] = useState<RoleFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData(defaultFormData);
    setSheetOpen(true);
  };

  const handleOpenEdit = (role: GuideRole) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      slug: role.slug,
      description: role.description || "",
      icon: role.icon,
      color: role.color,
      is_active: role.is_active,
    });
    setSheetOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editingRole) {
      await updateRole(editingRole.id, formData);
    } else {
      await createRole({ ...formData, sort_order: roles.length });
    }
    setSaving(false);
    setSheetOpen(false);
  };

  const handleDelete = async () => {
    if (deletingRole) {
      await deleteRole(deletingRole.id);
      setDeleteDialogOpen(false);
      setDeletingRole(null);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const getIconComponent = (iconName: string) => {
    const option = ICON_OPTIONS.find(o => o.value === iconName);
    return option?.icon || User;
  };

  const getColorClass = (colorName: string) => {
    const option = COLOR_OPTIONS.find(o => o.value === colorName);
    return option?.class || "bg-primary";
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
              Define roles that organize your user guides. Articles can be assigned to one or more roles.
            </CardDescription>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No roles defined yet. Create your first role to organize guides.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {roles.map((role) => {
                const IconComponent = getIconComponent(role.icon);
                return (
                  <div
                    key={role.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <div className={`rounded-lg p-2 ${getColorClass(role.color)}`}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{role.name}</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {role.slug}
                        </Badge>
                        {!role.is_active && (
                          <Badge variant="secondary">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hidden
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {role.description || "No description"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(role)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingRole(role);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingRole ? "Edit Role" : "New Role"}</SheetTitle>
            <SheetDescription>
              {editingRole
                ? "Update the role details below."
                : "Create a new role to organize your guides."}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData({
                    ...formData,
                    name,
                    slug: editingRole ? formData.slug : generateSlug(name),
                  });
                }}
                placeholder="Organization Manager"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (used in visible_to_roles)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="org-manager"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Guides for team leads managing organizations"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData({ ...formData, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${option.class}`} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
            <Button onClick={handleSave} disabled={saving || !formData.name || !formData.slug} className="w-full">
              {saving ? "Saving..." : editingRole ? "Update Role" : "Create Role"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingRole?.name}". Articles assigned to this role
              will no longer show this role in their visibility settings.
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
