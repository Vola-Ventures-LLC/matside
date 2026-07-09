import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Eye } from "lucide-react";

interface TopPost {
  id: string;
  title: string;
  slug: string;
  view_count: number;
}

interface TopPostsTableProps {
  posts: TopPost[];
  className?: string;
}

export function TopPostsTable({ posts, className }: TopPostsTableProps) {
  const columns: Column<TopPost>[] = [
    {
      key: "title",
      header: "Title",
      render: (post, index) => (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm font-medium w-5">
            {(index ?? 0) + 1}.
          </span>
          <span className="font-medium line-clamp-1">{post.title}</span>
        </div>
      ),
    },
    {
      key: "view_count",
      header: "Views",
      headerClassName: "text-right w-[100px]",
      render: (post) => (
        <div className="flex items-center justify-end gap-1">
          <Eye className="h-3 w-3 text-muted-foreground" />
          <span>{post.view_count.toLocaleString()}</span>
        </div>
      ),
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Top Posts</CardTitle>
        <CardDescription>Most viewed blog posts</CardDescription>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No published posts yet
          </p>
        ) : (
          <DataTable
            data={posts}
            columns={columns}
            defaultSortKey="view_count"
            defaultSortDirection="desc"
          />
        )}
      </CardContent>
    </Card>
  );
}
