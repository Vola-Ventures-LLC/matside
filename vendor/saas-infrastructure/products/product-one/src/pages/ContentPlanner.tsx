import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ContentCalendar } from "@/components/content/ContentCalendar";
import { ContentKanban } from "@/components/content/ContentKanban";
import { ContentEditor } from "@/components/content/ContentEditor";
import { AIAssistantPanel } from "@/components/content/AIAssistantPanel";
import {
  useContentItems,
  useCreateContentItem,
  useUpdateContentItem,
  useContentAI,
  ContentItem,
  ContentStatus,
} from "@/hooks/useContentPlanner";
import { Calendar, Columns3, Plus, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";

export default function ContentPlanner() {
  const [view, setView] = useState<"calendar" | "kanban">("calendar");
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);

  const { data: items = [], isLoading } = useContentItems();
  const createItem = useCreateContentItem();
  const updateItem = useUpdateContentItem();
  const contentAI = useContentAI();

  const handleItemClick = (item: ContentItem) => {
    setSelectedItem(item);
    setIsEditing(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedItem({
      scheduled_for: date.toISOString(),
    } as any);
    setIsEditing(true);
  };

  const handleNewContent = () => {
    setSelectedItem(null);
    setIsEditing(true);
  };

  const handleSave = async (data: Partial<ContentItem>) => {
    try {
      if (selectedItem?.id) {
        await updateItem.mutateAsync({ id: selectedItem.id, ...data });
      } else {
        await createItem.mutateAsync(data);
      }
      setIsEditing(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleStatusChange = async (itemId: string, newStatus: ContentStatus) => {
    await updateItem.mutateAsync({ id: itemId, status: newStatus });
  };

  const handleAIAssist = async (
    action: "brainstorm" | "draft" | "refine",
    data: any
  ) => {
    try {
      const result = await contentAI.mutateAsync({
        action,
        ...data,
      });

      if (action === "draft" || action === "refine") {
        setSelectedItem((prev) => ({
          ...prev,
          content: result,
        } as ContentItem));
        toast({ title: "Content generated!" });
      }
    } catch (error) {
      console.error("AI assist error:", error);
    }
  };

  const handleCreateFromIdea = (title: string) => {
    setSelectedItem({
      title,
      status: "idea",
    } as any);
    setIsEditing(true);
    setIsAIPanelOpen(false);
  };

  if (isEditing) {
    return (
      <ContentEditor
        item={selectedItem}
        onSave={handleSave}
        onBack={() => {
          setIsEditing(false);
          setSelectedItem(null);
        }}
        onAIAssist={handleAIAssist}
        isAILoading={contentAI.isPending}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Planner</h1>
          <p className="text-muted-foreground">
            Plan, create, and schedule your content with AI assistance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Sheet open={isAIPanelOpen} onOpenChange={setIsAIPanelOpen}>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                AI Assistant
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <AIAssistantPanel onCreateFromIdea={handleCreateFromIdea} />
            </SheetContent>
          </Sheet>
          <Button onClick={handleNewContent}>
            <Plus className="mr-2 h-4 w-4" />
            New Content
          </Button>
        </div>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as "calendar" | "kanban")}>
        <TabsList>
          <TabsTrigger value="calendar">
            <Calendar className="mr-2 h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="kanban">
            <Columns3 className="mr-2 h-4 w-4" />
            Kanban
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6">
          <ContentCalendar
            items={items}
            onItemClick={handleItemClick}
            onDateClick={handleDateClick}
          />
        </TabsContent>

        <TabsContent value="kanban" className="mt-6">
          <ContentKanban
            items={items}
            onItemClick={handleItemClick}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
