import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FeedbackButtonsProps {
  onFeedback: (feedback: "positive" | "negative", reason?: string) => void;
  isLoading: boolean;
}

export function FeedbackButtons({ onFeedback, isLoading }: FeedbackButtonsProps) {
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState("");

  const handleNegative = () => {
    setShowReasonInput(true);
  };

  const handleSubmitReason = () => {
    onFeedback("negative", reason.trim() || undefined);
    setShowReasonInput(false);
    setReason("");
  };

  if (showReasonInput) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          What could have been better? (optional)
        </p>
        <div className="flex gap-2">
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell us more..."
            onKeyDown={(e) => e.key === "Enter" && handleSubmitReason()}
            disabled={isLoading}
          />
          <Button onClick={handleSubmitReason} disabled={isLoading} size="sm">
            Submit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
      <span className="text-sm text-muted-foreground">Was this helpful?</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFeedback("positive")}
        disabled={isLoading}
        className="gap-1"
      >
        <ThumbsUp className="h-4 w-4" />
        Yes
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNegative}
        disabled={isLoading}
        className="gap-1"
      >
        <ThumbsDown className="h-4 w-4" />
        No
      </Button>
    </div>
  );
}
