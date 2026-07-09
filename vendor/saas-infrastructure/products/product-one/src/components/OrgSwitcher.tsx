import { Building2, Check, ChevronDown, User, Shield } from "lucide-react";
import { useOrgContext } from "@/hooks/useOrgContext";
import { useAppFeatures } from "@/hooks/useAppFeatures";
import { useAuth } from "@/hooks/useAuth";
import { useRoleContext } from "@/hooks/useRoleContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function OrgSwitcher() {
  const { orgsEnabled } = useAppFeatures();
  const { isAdmin, isOwner } = useAuth();
  const { activeContext, setActiveContext } = useRoleContext();
  const {
    activeOrgId,
    activeOrg,
    isPersonalContext,
    memberships,
    isLoading,
    switchToOrg,
  } = useOrgContext();

  // Don't render if orgs feature is disabled
  if (!orgsEnabled) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="px-3 py-2">
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  // Determine current display state
  const isInAdminMode = isPersonalContext && activeContext === "admin";
  const hasAdminAccess = isAdmin || isOwner;
  
  const getCurrentLabel = () => {
    if (isPersonalContext) {
      return activeContext === "admin" ? "Platform Admin" : "Personal";
    }
    return activeOrg?.organization.name || "Select workspace";
  };

  const getCurrentIcon = () => {
    if (isPersonalContext) {
      return activeContext === "admin" ? Shield : User;
    }
    return Building2;
  };

  const handleSelectPersonal = () => {
    switchToOrg(null);
    setActiveContext("user");
  };

  const handleSelectAdmin = () => {
    switchToOrg(null);
    setActiveContext("admin");
  };

  const handleSelectOrg = (orgId: string) => {
    switchToOrg(orgId);
    // When switching to org, we use org-specific context (not platform admin)
    setActiveContext("user");
  };

  const CurrentIcon = getCurrentIcon();

  return (
    <div className="px-3 py-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between gap-2 font-normal"
          >
            <span className="flex items-center gap-2 truncate">
              <CurrentIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{getCurrentLabel()}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[220px]">
          
          {/* Personal workspace */}
          <DropdownMenuItem 
            onClick={handleSelectPersonal}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Personal
            </span>
            {isPersonalContext && activeContext === "user" && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>

          {memberships.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Organizations
              </DropdownMenuLabel>
            </>
          )}
          
          {/* Organization workspaces */}
          {memberships.map((membership) => (
            <DropdownMenuItem
              key={membership.organization_id}
              onClick={() => handleSelectOrg(membership.organization_id)}
              className="flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2 truncate">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{membership.organization.name}</span>
                {membership.is_owner && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    Owner
                  </Badge>
                )}
              </span>
              {activeOrgId === membership.organization_id && (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
          
          {memberships.length === 0 && (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground">
              No organizations yet
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
