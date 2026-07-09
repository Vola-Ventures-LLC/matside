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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Plus, X, Tag } from "lucide-react";

interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

export function BlogTags() {
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", slug: "" });

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("blog_tags")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast({ variant: "destructive", title: "Failed to fetch tags" });
    } else {
      setTags(data || []);
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
    setFormData({ name, slug: generateSlug(name) });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) {
      toast({ variant: "destructive", title: "Name and slug are required" });
      return;
    }

    const { error } = await supabase.from("blog_tags").insert({
      name: formData.name,
      slug: formData.slug,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to create tag",
        description: error.message,
      });
    } else {
      toast({ title: "Tag created" });
      fetchTags();
      setDialogOpen(false);
      setFormData({ name: "", slug: "" });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("blog_tags").delete().eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Failed to delete tag" });
    } else {
      toast({ title: "Tag deleted" });
      fetchTags();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tag className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Blog Tags</CardTitle>
              <CardDescription>Manage tags for your posts</CardDescription>
            </div>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tag
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSpinner />
        ) : tags.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No tags yet. Create your first tag.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="gap-1 px-3 py-1"
              >
                {tag.name}
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>New Tag</SheetTitle>
            <SheetDescription>Create a new blog tag</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Tag name"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="tag-slug"
              />
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Create</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
