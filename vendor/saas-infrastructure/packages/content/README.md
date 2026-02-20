# @saas-infra/content

Content management with blog posts, content planner, and multi-platform publishing.

## Features

- **Blog System** — Posts, categories, tags with search
- **Content Planner** — Plan content for blog, social media, email campaigns
- **Multi-Platform** — Support for blog, social media, email, marketing copy
- **Content Status** — Draft, scheduled, published, archived
- **AI Content Ideas** — Generate and store content ideas
- **Dependency Injection** — Uses `useSupabase()` from @saas-infra/auth

## Installation

```bash
pnpm add @saas-infra/content @saas-infra/auth @tanstack/react-query
```

## Usage

### Blog Posts Hook

Fetch and filter blog posts:

```tsx
import { useBlogPosts } from "@saas-infra/content";

function BlogList() {
  const { posts, isLoading } = useBlogPosts();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
          <div>
            {post.category && <span>{post.category.name}</span>}
            <span>{post.reading_time_minutes} min read</span>
          </div>
        </article>
      ))}
    </div>
  );
}
```

The hook automatically:
- Reads search params from URL (category, tag, search query)
- Filters posts by published status
- Orders by publish date
- Debounces search input

### Content Planner Hooks

Full content lifecycle management:

```tsx
import {
  useContentItems,
  useCreateContentItem,
  useUpdateContentItem,
  useDeleteContentItem,
} from "@saas-infra/content";
import type { ContentType, ContentStatus } from "@saas-infra/content";

function ContentPlanner() {
  const { data: items, isLoading } = useContentItems();
  const createItem = useCreateContentItem({
    onSuccess: () => toast.success("Content created"),
  });
  const updateItem = useUpdateContentItem({
    onSuccess: () => toast.success("Content updated"),
  });
  const deleteItem = useDeleteContentItem({
    onSuccess: () => toast.success("Content deleted"),
  });

  const handleCreate = () => {
    createItem.mutate({
      title: "New Blog Post",
      content_type: "blog_post",
      status: "draft",
      scheduled_date: new Date("2024-12-01"),
    });
  };

  const handlePublish = (id: string) => {
    updateItem.mutate({
      id,
      updates: { status: "published" },
    });
  };

  return (
    <div>
      <button onClick={handleCreate}>New Content</button>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {items.map(item => (
            <div key={item.id} className="border p-4 rounded">
              <h3>{item.title}</h3>
              <p>{item.content_type} - {item.status}</p>
              {item.status === "draft" && (
                <button onClick={() => handlePublish(item.id)}>
                  Publish
                </button>
              )}
              <button onClick={() => deleteItem.mutate(item.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### AI Content Ideas

Generate and manage content ideas:

```tsx
import { useContentIdeas, useSaveContentIdea } from "@saas-infra/content";

function ContentIdeas() {
  const { data: ideas } = useContentIdeas();
  const saveIdea = useSaveContentIdea({
    onSuccess: () => toast.success("Idea saved"),
  });

  const handleSave = (idea: { title: string; description: string }) => {
    saveIdea.mutate(idea);
  };

  return (
    <div>
      <h2>Content Ideas</h2>

      <div className="space-y-2">
        {ideas?.map(idea => (
          <div key={idea.id} className="border p-3 rounded">
            <h4>{idea.title}</h4>
            <p className="text-sm text-muted-foreground">{idea.description}</p>
            <button onClick={() => handleConvertToContent(idea)}>
              Create Content
            </button>
          </div>
        ))}
      </div>

      <button onClick={() => handleSave({
        title: "10 Tips for Better SEO",
        description: "Practical SEO tips for small businesses",
      })}>
        Save Idea
      </button>
    </div>
  );
}
```

### Utility: useDebounce

Included utility for debouncing values:

```tsx
import { useDebounce } from "@saas-infra/content";
import { useState } from "react";

function SearchInput() {
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value, 300);

  // debouncedValue updates 300ms after user stops typing
  useEffect(() => {
    if (debouncedValue) {
      performSearch(debouncedValue);
    }
  }, [debouncedValue]);

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

## API Reference

### `useBlogPosts()`

Fetches blog posts with automatic URL param filtering.

**Returns:**
```tsx
{
  posts: BlogPost[];
  isLoading: boolean;
}
```

**BlogPost:**
```tsx
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image_url: string | null;
  published_at: string;
  reading_time_minutes: number;
  category: { name: string; slug: string };
  tags: Array<{ name: string; slug: string }>;
}
```

Reads from URL:
- `?category=news` — Filter by category slug
- `?tag=tutorial` — Filter by tag slug
- `?search=keyword` — Search in title/excerpt

### Content Planner Hooks

All hooks accept `UseContentPlannerOptions`:

```tsx
interface UseContentPlannerOptions {
  onSuccess?: (title: string, description: string) => void;
  onError?: (title: string, description: string) => void;
}
```

#### `useContentItems()`

React Query hook that returns all content items.

#### `useContentItem(id: string)`

React Query hook that returns a single content item.

#### `useCreateContentItem(options?)`

Mutation hook for creating content.

```tsx
const create = useCreateContentItem();
create.mutate({
  title: string;
  content_type: ContentType;
  platform?: Platform;
  status?: ContentStatus;
  scheduled_date?: Date;
  content?: string;
});
```

#### `useUpdateContentItem(options?)`

Mutation hook for updating content.

```tsx
const update = useUpdateContentItem();
update.mutate({
  id: string;
  updates: Partial<ContentItem>;
});
```

#### `useDeleteContentItem(options?)`

Mutation hook for deleting content.

```tsx
const remove = useDeleteContentItem();
remove.mutate(id);
```

#### `useContentAI(options?)`

Hook for AI-powered content operations (generate, improve, etc.).

#### `useContentIdeas()`

React Query hook that returns saved content ideas.

#### `useSaveContentIdea(options?)`

Mutation hook for saving content ideas.

```tsx
const save = useSaveContentIdea();
save.mutate({
  title: string;
  description: string;
});
```

### Types

```tsx
type ContentType = "blog_post" | "social_media" | "email_campaign" | "marketing_copy";

type ContentStatus = "draft" | "scheduled" | "published" | "archived";

type Platform = "twitter" | "linkedin" | "facebook" | "instagram" | "tiktok";
```

## Database Schema

Required tables (see `templates/schemas/05_content_blog.sql`):

- `blog_posts` — Blog posts
- `blog_categories` — Post categories
- `blog_tags` — Tags
- `blog_post_tags` — Many-to-many join table
- `content_items` — Content planner items
- `content_ideas` — Saved content ideas

## Examples

### Blog Archive Page

```tsx
import { useBlogPosts } from "@saas-infra/content";
import { useSearchParams } from "react-router-dom";

function BlogArchive() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { posts, isLoading } = useBlogPosts();

  const handleCategoryFilter = (slug: string) => {
    setSearchParams({ category: slug });
  };

  const handleSearch = (query: string) => {
    setSearchParams({ search: query });
  };

  return (
    <div>
      <input
        type="search"
        placeholder="Search posts..."
        onChange={(e) => handleSearch(e.target.value)}
      />

      <div className="flex gap-2">
        <button onClick={() => handleCategoryFilter("news")}>News</button>
        <button onClick={() => handleCategoryFilter("tutorials")}>Tutorials</button>
        <button onClick={() => handleCategoryFilter("updates")}>Updates</button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-6">
          {posts.map(post => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Content Calendar

```tsx
import { useContentItems } from "@saas-infra/content";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

function ContentCalendar() {
  const { data: items } = useContentItems();
  const month = new Date();
  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });

  const getItemsForDay = (day: Date) => {
    return items?.filter(item => {
      if (!item.scheduled_date) return false;
      const scheduled = new Date(item.scheduled_date);
      return format(scheduled, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
    }) || [];
  };

  return (
    <div className="grid grid-cols-7 gap-2">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
        <div key={day} className="font-bold text-center">{day}</div>
      ))}

      {days.map(day => {
        const dayItems = getItemsForDay(day);
        return (
          <div key={day.toString()} className="border p-2 min-h-24">
            <div className="text-sm">{format(day, "d")}</div>
            {dayItems.map(item => (
              <div key={item.id} className="text-xs bg-blue-100 p-1 rounded mt-1">
                {item.title}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
```

### Content Status Board

```tsx
import { useContentItems } from "@saas-infra/content";

function ContentBoard() {
  const { data: items } = useContentItems();

  const groupByStatus = () => {
    return {
      draft: items?.filter(i => i.status === "draft") || [],
      scheduled: items?.filter(i => i.status === "scheduled") || [],
      published: items?.filter(i => i.status === "published") || [],
    };
  };

  const columns = groupByStatus();

  return (
    <div className="grid grid-cols-3 gap-4">
      {Object.entries(columns).map(([status, items]) => (
        <div key={status} className="border rounded p-4">
          <h3 className="font-bold capitalize mb-4">{status}</h3>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="bg-white border p-3 rounded">
                <h4 className="font-medium">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.content_type}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```
