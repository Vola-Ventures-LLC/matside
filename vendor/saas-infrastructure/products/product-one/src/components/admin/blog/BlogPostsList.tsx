import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { DataTable, Column } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  FileText,
  Star,
} from "lucide-react";
import { format } from "date-fns";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  view_count: number;
  category: { name: string } | null;
}

export function BlogPostsList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        `
        id,
        title,
        slug,
        status,
        is_featured,
        published_at,
        created_at,
        view_count,
        category:blog_categories(name)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Failed to fetch posts" });
    } else {
      setPosts(data || []);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Failed to delete post" });
    } else {
      toast({ title: "Post deleted" });
      fetchPosts();
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    const { error } = await supabase
      .from("blog_posts")
      .update({
        status: newStatus,
        published_at:
          newStatus === "published" ? new Date().toISOString() : null,
      })
      .eq("id", post.id);

    if (error) {
      toast({ variant: "destructive", title: "Failed to update status" });
    } else {
      toast({ title: `Post ${newStatus === "published" ? "published" : "unpublished"}` });
      fetchPosts();
    }
  };

  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-primary">Published</Badge>;
      case "scheduled":
        return <Badge variant="secondary">Scheduled</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const columns: Column<BlogPost>[] = [
    {
      key: "title",
      header: "Title",
      render: (post) => (
        <div className="flex items-center gap-2">
          {post.is_featured && (
            <Star className="h-4 w-4 text-primary fill-primary" />
          )}
          <span className="font-medium">{post.title}</span>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (post) =>
        post.category?.name || (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (post) => getStatusBadge(post.status),
    },
    {
      key: "view_count",
      header: "Views",
    },
    {
      key: "published_at",
      header: "Date",
      render: (post) =>
        format(
          new Date(post.published_at || post.created_at),
          "MMM d, yyyy"
        ),
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      className: "w-[80px]",
      render: (post) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleTogglePublish(post)}>
              {post.status === "published" ? "Unpublish" : "Publish"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(post.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Blog Posts</CardTitle>
              <CardDescription>Manage your blog content</CardDescription>
            </div>
          </div>
          <Button onClick={() => navigate("/admin/blog/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No posts yet"
            description="Create your first blog post to get started"
            actionLabel="Create Post"
            onAction={() => navigate("/admin/blog/new")}
          />
        ) : (
          <div className="rounded-md border">
            <DataTable
              data={filteredPosts}
              columns={columns}
              defaultSortKey="published_at"
              defaultSortDirection="desc"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
