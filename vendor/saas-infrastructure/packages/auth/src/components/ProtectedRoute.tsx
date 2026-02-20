import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireOwner?: boolean;
  loginPath?: string;
  dashboardPath?: string;
  loader?: ReactNode;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireOwner = false,
  loginPath = "/login",
  dashboardPath = "/dashboard",
  loader,
}: ProtectedRouteProps) {
  const { user, isAdmin, isOwner, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return loader ? <>{loader}</> : null;
  }

  if (!user) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (requireOwner && !isOwner) {
    return <Navigate to={dashboardPath} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({
  children,
  dashboardPath = "/dashboard",
  loader,
}: {
  children: ReactNode;
  dashboardPath?: string;
  loader?: ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return loader ? <>{loader}</> : null;
  }

  if (user) {
    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || dashboardPath;
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
