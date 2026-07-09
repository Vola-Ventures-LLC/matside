import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ConversationRatingProps {
  currentRating?: number | null;
  onRate: (rating: number, feedback?: string) => Promise<void>;
  isLoading: boolean;
  compact?: boolean;
}

export function ConversationRating({ currentRating, onRate, isLoading, compact = false }: ConversationRatingProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(currentRating || null);
  const [feedback, setFeedback] = useState("");
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);
    if (rating <= 3) {
      setShowFeedbackInput(true);
    } else {
      // For 4-5 stars, submit immediately
      onRate(rating);
    }
  };

  const handleSubmit = () => {
    if (selectedRating) {
      onRate(selectedRating, feedback.trim() || undefined);
    }
  };

  // If already rated, show the rating
  if (currentRating) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg bg-muted/50",
        compact && "p-2"
      )}>
        <span className="text-sm text-muted-foreground">Your rating:</span>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                compact ? "h-4 w-4" : "h-5 w-5",
                star <= currentRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  if (showFeedbackInput) {
    return (
      <div className="p-3 rounded-lg bg-muted/50 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rating:</span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-5 w-5",
                  star <= (selectedRating || 0)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          How could we have done better? (optional)
        </p>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share your thoughts..."
          rows={2}
          disabled={isLoading}
        />
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setShowFeedbackInput(false);
              setSelectedRating(null);
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            Submit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col gap-2 p-3 rounded-lg bg-muted/50",
      compact && "p-2"
    )}>
      <span className="text-sm text-muted-foreground">
        Rate this conversation:
      </span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(null)}
            disabled={isLoading}
            className="p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
          >
            <Star
              className={cn(
                compact ? "h-5 w-5" : "h-6 w-6",
                star <= (hoveredStar || selectedRating || 0)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/50 hover:text-yellow-400/70"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
