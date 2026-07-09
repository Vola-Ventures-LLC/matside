import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useContentAI, useSaveContentIdea } from "@/hooks/useContentPlanner";
import { Sparkles, Lightbulb, FileText, Wand2, Clock, Loader2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AIAssistantPanelProps {
  onInsertContent?: (content: string) => void;
  onCreateFromIdea?: (title: string) => void;
}

export function AIAssistantPanel({ onInsertContent, onCreateFromIdea }: AIAssistantPanelProps) {
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState("blog_post");
  const [platform, setPlatform] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("");
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [parsedIdeas, setParsedIdeas] = useState<any[]>([]);

  const contentAI = useContentAI();
  const saveIdea = useSaveContentIdea();

  const handleBrainstorm = async () => {
    if (!topic.trim()) {
      toast({ variant: "destructive", title: "Please enter a topic" });
      return;
    }

    try {
      const result = await contentAI.mutateAsync({
        action: "brainstorm",
        topic,
        content_type: contentType,
        platform: platform || undefined,
        target_audience: targetAudience || undefined,
      });

      setAiResult(result);

      // Try to parse as JSON for structured ideas
      try {
        const parsed = JSON.parse(result);
        if (Array.isArray(parsed)) {
          setParsedIdeas(parsed);
        } else if (parsed.ideas) {
          setParsedIdeas(parsed.ideas);
        }
      } catch {
        setParsedIdeas([]);
      }
    } catch (error) {
      console.error("Brainstorm error:", error);
    }
  };

  const handleGenerateDraft = async () => {
    if (!topic.trim()) {
      toast({ variant: "destructive", title: "Please enter a topic" });
      return;
    }

    try {
      const result = await contentAI.mutateAsync({
        action: "draft",
        topic,
        content_type: contentType,
        platform: platform || undefined,
        tone: tone || undefined,
        target_audience: targetAudience || undefined,
      });

      setAiResult(result);
      setParsedIdeas([]);
    } catch (error) {
      console.error("Draft error:", error);
    }
  };

  const handleScheduleSuggest = async () => {
    try {
      const result = await contentAI.mutateAsync({
        action: "schedule_suggest",
        content_type: contentType,
        platform: platform || undefined,
        target_audience: targetAudience || undefined,
      });

      setAiResult(result);
      setParsedIdeas([]);
    } catch (error) {
      console.error("Schedule suggest error:", error);
    }
  };

  const handleSaveIdea = async (ideaText: string) => {
    try {
      await saveIdea.mutateAsync({
        idea_text: ideaText,
        idea_type: "topic",
      });
    } catch (error) {
      console.error("Save idea error:", error);
    }
  };

  const handleUseContent = () => {
    if (aiResult && onInsertContent) {
      onInsertContent(aiResult);
      toast({ title: "Content inserted" });
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="brainstorm">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="brainstorm">
              <Lightbulb className="mr-1 h-4 w-4" />
              Ideas
            </TabsTrigger>
            <TabsTrigger value="draft">
              <FileText className="mr-1 h-4 w-4" />
              Draft
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Clock className="mr-1 h-4 w-4" />
              Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brainstorm" className="space-y-4 mt-4">
            <div>
              <Label>Topic / Theme</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., productivity tips, product launch"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Content Type</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog_post">Blog Post</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="email_campaign">Email</SelectItem>
                    <SelectItem value="marketing_copy">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Target Audience</Label>
              <Input
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g., small business owners"
              />
            </div>

            <Button onClick={handleBrainstorm} disabled={contentAI.isPending} className="w-full">
              {contentAI.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="mr-2 h-4 w-4" />
              )}
              Generate Ideas
            </Button>
          </TabsContent>

          <TabsContent value="draft" className="space-y-4 mt-4">
            <div>
              <Label>Topic</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What should the content be about?"
              />
            </div>

            <div>
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="authoritative">Authoritative</SelectItem>
                  <SelectItem value="humorous">Humorous</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleGenerateDraft} disabled={contentAI.isPending} className="w-full">
              {contentAI.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Generate Draft
            </Button>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Get AI-powered suggestions for the best times to post your content.
            </p>

            <div>
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleScheduleSuggest} disabled={contentAI.isPending} className="w-full">
              {contentAI.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Clock className="mr-2 h-4 w-4" />
              )}
              Get Schedule Suggestions
            </Button>
          </TabsContent>
        </Tabs>

        {/* AI Results */}
        {aiResult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>AI Response</Label>
              {onInsertContent && (
                <Button size="sm" variant="outline" onClick={handleUseContent}>
                  <Plus className="mr-1 h-3 w-3" />
                  Use Content
                </Button>
              )}
            </div>
            <ScrollArea className="h-[200px] rounded-md border p-3">
              {parsedIdeas.length > 0 ? (
                <div className="space-y-2">
                  {parsedIdeas.map((idea, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                      onClick={() => onCreateFromIdea?.(idea.title || idea)}
                    >
                      <div className="font-medium text-sm">
                        {typeof idea === "string" ? idea : idea.title}
                      </div>
                      {idea.hook && (
                        <p className="text-xs text-muted-foreground mt-1">{idea.hook}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveIdea(typeof idea === "string" ? idea : idea.title);
                          }}
                        >
                          Save Idea
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm whitespace-pre-wrap">{aiResult}</div>
              )}
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
