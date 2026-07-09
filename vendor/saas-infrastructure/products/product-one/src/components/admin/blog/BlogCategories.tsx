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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Plus, Edit, Trash2, FolderOpen } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number | null;
}

export function BlogCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("blog_categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      toast({ variant: "destructive", title: "Failed to fetch categories" });
    } else {
      setCategories(data || []);
    }
    setIsLoading(false);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: editingCategory ? formData.slug : generateSlug(name),
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) {
      toast({ variant: "destructive", title: "Name and slug are required" });
      return;
    }

    if (editingCategory) {
      const { error } = await supabase
        .from("blog_categories")
        .update({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          is_active: formData.is_active,
          sort_order: formData.sort_order,
        })
        .eq("id", editingCategory.id);

      if (error) {
        toast({ variant: "destructive", title: "Failed to update category" });
      } else {
        toast({ title: "Category updated" });
        fetchCategories();
        closeDialog();
      }
    } else {
      const { error } = await supabase.from("blog_categories").insert({
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        is_active: formData.is_active,
        sort_order: formData.sort_order,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to create category",
          description: error.message,
        });
      } else {
        toast({ title: "Category created" });
        fetchCategories();
        closeDialog();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("blog_categories")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Failed to delete category" });
    } else {
      toast({ title: "Category deleted" });
      fetchCategories();
    }
  };

  const openDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        is_active: category.is_active,
        sort_order: category.sort_order || 0,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        is_active: true,
        sort_order: 0,
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Blog Categories</CardTitle>
              <CardDescription>Organize your blog posts</CardDescription>
            </div>
          </div>
          <Button onClick={() => openDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSpinner />
        ) : categories.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No categories yet. Create your first category.
          </p>
        ) : (
          <DataTable
            data={categories}
            columns={[
              {
                key: "name",
                header: "Name",
                render: (category) => (
                  <span className="font-medium">{category.name}</span>
                ),
              },
              {
                key: "slug",
                header: "Slug",
                render: (category) => (
                  <span className="text-muted-foreground">/{category.slug}</span>
                ),
              },
              {
                key: "is_active",
                header: "Status",
                render: (category) => (
                  <Badge
                    variant={category.is_active ? "default" : "secondary"}
                  >
                    {category.is_active ? "Active" : "Inactive"}
                  </Badge>
                ),
              },
              {
                key: "sort_order",
                header: "Order",
              },
              {
                key: "actions",
                header: "Actions",
                sortable: false,
                className: "w-[100px]",
                render: (category) => (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDialog(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ),
              },
            ]}
            defaultSortKey="sort_order"
            defaultSortDirection="asc"
            emptyMessage="No categories yet. Create your first category."
          />
        )}
      </CardContent>

      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingCategory ? "Edit Category" : "New Category"}
            </SheetTitle>
            <SheetDescription>
              {editingCategory
                ? "Update the category details"
                : "Create a new blog category"}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Category name"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="category-slug"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sort_order: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingCategory ? "Update" : "Create"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
