import { useRoleContext, RoleContext } from "@/hooks/useRoleContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Shield } from "lucide-react";

const contextLabels: Record<RoleContext, { label: string; icon: React.ElementType }> = {
  user: { label: "Personal", icon: User },
  admin: { label: "Admin", icon: Shield },
};

export function RoleContextSwitcher() {
  const { activeContext, availableContexts, setActiveContext } = useRoleContext();

  // Don't show switcher if only one context is available
  if (availableContexts.length <= 1) {
    return null;
  }

  return (
    <Select value={activeContext} onValueChange={(value) => setActiveContext(value as RoleContext)}>
      <SelectTrigger className="w-full h-10 bg-sidebar-accent/50 border-sidebar-border">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {availableContexts.map((context) => {
          const Icon = contextLabels[context].icon;
          return (
            <SelectItem key={context} value={context}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {contextLabels[context].label}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
