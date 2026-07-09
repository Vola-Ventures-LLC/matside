import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SupabaseProvider, AuthProvider, RoleContextProvider, ProtectedRoute, PublicOnlyRoute } from "@saas-infra/auth";
import { supabase } from "@/integrations/supabase/client";
import { OrgProvider } from "@/hooks/useOrgContext";
import { LocaleProvider } from "@/hooks/useLocale";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { useAppFeatures } from "@/hooks/useAppFeatures";
// Layouts (loaded immediately)
import { PublicLayout } from "@/layouts/PublicLayout";
import { AppLayout } from "@/layouts/AppLayout";

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
        </div>
      </div>
    </div>
  );
}

// Lazy-loaded pages
const Landing = lazy(() => import("@/pages/Landing"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const UpdatePassword = lazy(() => import("@/pages/UpdatePassword"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Settings = lazy(() => import("@/pages/Settings"));
const Admin = lazy(() => import("@/pages/Admin"));
const AdminUsers = lazy(() => import("@/pages/AdminUsers"));
const AdminBilling = lazy(() => import("@/pages/AdminBilling"));
const AdminBillingOverview = lazy(() => import("@/pages/AdminBillingOverview"));
const AdminBillingAllProducts = lazy(() => import("@/pages/AdminBillingAllProducts"));
const AdminBillingSubscriptions = lazy(() => import("@/pages/AdminBillingSubscriptions"));
const AdminBillingCredits = lazy(() => import("@/pages/AdminBillingCredits"));
const AdminBillingProducts = lazy(() => import("@/pages/AdminBillingProducts"));
const AdminBillingConnect = lazy(() => import("@/pages/AdminBillingConnect"));
const AdminBillingCoupons = lazy(() => import("@/pages/AdminBillingCoupons"));
const UserBilling = lazy(() => import("@/pages/UserBilling"));
const AdminBrand = lazy(() => import("@/pages/AdminBrand"));
const AdminTemplates = lazy(() => import("@/pages/AdminTemplates"));
const AdminEmail = lazy(() => import("@/pages/AdminEmail"));
const AdminEmailDomains = lazy(() => import("@/pages/AdminEmailDomains"));
const AdminChangelog = lazy(() => import("@/pages/AdminChangelog"));
const AdminAudit = lazy(() => import("@/pages/AdminAudit"));
const AdminLoginEvents = lazy(() => import("@/pages/AdminLoginEvents"));
const AdminRoles = lazy(() => import("@/pages/AdminRoles"));
const AdminBlog = lazy(() => import("@/pages/AdminBlog"));
const AdminBlogEditor = lazy(() => import("@/pages/AdminBlogEditor"));
const UserAnalytics = lazy(() => import("@/pages/UserAnalytics"));
const ContentAnalytics = lazy(() => import("@/pages/ContentAnalytics"));
const BillingAnalytics = lazy(() => import("@/pages/BillingAnalytics"));
const ContentPlanner = lazy(() => import("@/pages/ContentPlanner"));
const SetupGuide = lazy(() => import("@/pages/SetupGuide"));
const AdminDocs = lazy(() => import("@/pages/AdminDocs"));
const AdminGuides = lazy(() => import("@/pages/AdminGuides"));
const AdminGuidesSection = lazy(() => import("@/pages/AdminGuidesSection"));
const AdminGuidesArticleEditor = lazy(() => import("@/pages/AdminGuidesArticleEditor"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const Guides = lazy(() => import("@/pages/Guides"));
const Referrals = lazy(() => import("@/pages/Referrals"));
const AdminSupport = lazy(() => import("@/pages/AdminSupport"));
const AdminSupportInsights = lazy(() => import("@/pages/AdminSupportInsights"));
const AdminSupportSatisfaction = lazy(() => import("@/pages/AdminSupportSatisfaction"));
const AdminTicketDetail = lazy(() => import("@/pages/AdminTicketDetail"));
const AdminAffiliates = lazy(() => import("@/pages/AdminAffiliates"));
const AdminAffiliateSettings = lazy(() => import("@/pages/AdminAffiliateSettings"));
const AdminAffiliateTiers = lazy(() => import("@/pages/AdminAffiliateTiers"));
const AdminAffiliateList = lazy(() => import("@/pages/AdminAffiliateList"));
const AdminAffiliatePayouts = lazy(() => import("@/pages/AdminAffiliatePayouts"));
const AdminWebhooks = lazy(() => import("@/pages/AdminWebhooks"));
const AdminOrgs = lazy(() => import("@/pages/AdminOrgs"));
const AdminDrips = lazy(() => import("@/pages/AdminDrips"));
const AdminRateLimits = lazy(() => import("@/pages/AdminRateLimits"));
const AdminOnboarding = lazy(() => import("@/pages/AdminOnboarding"));
const AdminCosts = lazy(() => import("@/pages/AdminCosts"));
const Unsubscribe = lazy(() => import("@/pages/Unsubscribe"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const UserSupport = lazy(() => import("@/pages/UserSupport"));
const OrgDashboard = lazy(() => import("@/pages/org").then(m => ({ default: m.OrgDashboard })));
const OrgMembers = lazy(() => import("@/pages/org").then(m => ({ default: m.OrgMembers })));
const OrgBilling = lazy(() => import("@/pages/org").then(m => ({ default: m.OrgBilling })));
const OrgBillingUsage = lazy(() => import("@/pages/org").then(m => ({ default: m.OrgBillingUsage })));
const OrgSettings = lazy(() => import("@/pages/org").then(m => ({ default: m.OrgSettings })));
const NotFound = lazy(() => import("@/pages/NotFound"));


const queryClient = new QueryClient();

// Wrapper component to access useAppFeatures hook
function AppContent({ children }: { children: React.ReactNode }) {
  const { orgsEnabled } = useAppFeatures();
  return <OrgProvider orgsEnabled={orgsEnabled}>{children}</OrgProvider>;
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider value={supabase}>
      <AuthProvider>
        <LocaleProvider>
          <RoleContextProvider>
            <AppContent>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <ImpersonationBanner />
          <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Layout Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
            </Route>

            {/* Auth Routes (Public Only - redirect if logged in) */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicOnlyRoute>
                  <Signup />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicOnlyRoute>
                  <ForgotPassword />
                </PublicOnlyRoute>
              }
            />
            <Route path="/update-password" element={<UpdatePassword />} />

            {/* App Layout Routes (Protected) */}
            <Route
              element={
                <ProtectedRoute loader={<PageLoader />}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/guides" element={<Guides />} />
              <Route path="/guides/role/:roleSlug" element={<Guides />} />
              <Route path="/guides/:sectionSlug" element={<Guides />} />
              <Route path="/guides/:sectionSlug/:articleSlug" element={<Guides />} />
              <Route path="/referrals" element={<Referrals />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/support" element={<UserSupport />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/user/billing" element={<UserBilling />} />

              {/* Organization Routes */}
              <Route path="/org/dashboard" element={<OrgDashboard />} />
              <Route path="/team/members" element={<OrgMembers />} />
              <Route path="/billing" element={<OrgBilling />} />
              <Route path="/billing/usage" element={<OrgBillingUsage />} />
              <Route path="/settings/org" element={<OrgSettings />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/roles"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminRoles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/billing"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminBilling />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/billing/overview"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminBillingOverview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/billing/all-products"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminBillingAllProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/billing/subscriptions"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminBillingSubscriptions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/billing/credits"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminBillingCredits />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/billing/products"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminBillingProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/billing/connect"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminBillingConnect />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/billing/coupons"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminBillingCoupons />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/brand"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminBrand />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/templates"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminTemplates />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/email"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminEmail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/email/domains"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminEmailDomains />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/changelog"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminChangelog />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminAudit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users/logins"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLoginEvents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/blog"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminBlog />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/blog/new"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminBlogEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/blog/edit/:id"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminBlogEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users/analytics"
                element={
                  <ProtectedRoute requireAdmin>
                    <UserAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/content/analytics"
                element={
                  <ProtectedRoute requireAdmin>
                    <ContentAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/billing/analytics"
                element={
                  <ProtectedRoute requireOwner>
                    <BillingAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/content"
                element={
                  <ProtectedRoute requireAdmin>
                    <ContentPlanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/guides"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminGuides />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/guides/sections/:sectionId"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminGuidesSection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/guides/sections/:sectionId/new"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminGuidesArticleEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/guides/articles/new"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminGuidesArticleEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/guides/articles/:articleId/edit"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminGuidesArticleEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/docs"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminDocs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/setup"
                element={
                  <ProtectedRoute requireOwner>
                    <SetupGuide />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/support"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminSupport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/support/insights"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminSupportInsights />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/support/satisfaction"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminSupportSatisfaction />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/support/tickets/:id"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminTicketDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/affiliates"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminAffiliates />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/affiliates/settings"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminAffiliateSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/affiliates/tiers"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminAffiliateTiers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/affiliates/list"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminAffiliateList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/affiliates/payouts"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminAffiliatePayouts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/webhooks"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminWebhooks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/orgs"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminOrgs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/drips"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminDrips />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/rate-limits"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminRateLimits />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/onboarding"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminOnboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/costs"
                element={
                  <ProtectedRoute requireOwner>
                    <AdminCosts />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
          </TooltipProvider>
        </AppContent>
      </RoleContextProvider>
      </LocaleProvider>
    </AuthProvider>
    </SupabaseProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
