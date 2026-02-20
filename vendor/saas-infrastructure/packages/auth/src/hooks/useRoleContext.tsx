import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./useAuth";

export type RoleContext = "user" | "admin";

interface RoleContextType {
  activeContext: RoleContext;
  availableContexts: RoleContext[];
  setActiveContext: (context: RoleContext) => void;
}

const RoleContextContext = createContext<RoleContextType | undefined>(undefined);

export function RoleContextProvider({ children }: { children: ReactNode }) {
  const { isAdmin, isOwner, isLoading } = useAuth();
  const [activeContext, setActiveContext] = useState<RoleContext>("user");

  const availableContexts: RoleContext[] = isAdmin || isOwner
    ? ["user", "admin"]
    : ["user"];

  useEffect(() => {
    if (!isLoading && activeContext === "admin" && !isAdmin && !isOwner) {
      setActiveContext("user");
    }
  }, [isAdmin, isOwner, isLoading, activeContext]);

  useEffect(() => {
    if (isLoading) return;

    const saved = localStorage.getItem("roleContext") as RoleContext | null;
    if (saved && (saved === "user" || (saved === "admin" && (isAdmin || isOwner)))) {
      setActiveContext(saved);
    }
  }, [isAdmin, isOwner, isLoading]);

  const handleSetContext = (context: RoleContext) => {
    if (availableContexts.includes(context)) {
      setActiveContext(context);
      localStorage.setItem("roleContext", context);
    }
  };

  return (
    <RoleContextContext.Provider
      value={{
        activeContext,
        availableContexts,
        setActiveContext: handleSetContext,
      }}
    >
      {children}
    </RoleContextContext.Provider>
  );
}

export function useRoleContext() {
  const context = useContext(RoleContextContext);
  if (context === undefined) {
    throw new Error("useRoleContext must be used within a RoleContextProvider");
  }
  return context;
}
