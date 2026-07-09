import { test as base } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type DatabaseFixtures = {
  supabase: SupabaseClient;
  cleanupTickets: () => Promise<void>;
  cleanupBlogPosts: () => Promise<void>;
  cleanupOrgs: () => Promise<void>;
};

export const test = base.extend<DatabaseFixtures>({
  supabase: async ({}, use) => {
    const client = createClient(
      process.env.VITE_SUPABASE_URL_TEST!,
      process.env.SUPABASE_SERVICE_ROLE_KEY_TEST!
    );
    await use(client);
  },

  cleanupTickets: async ({ supabase }, use) => {
    const cleanup = async () => {
      // Soft delete tickets created during test
      await supabase
        .from('support_tickets')
        .update({ deleted_at: new Date().toISOString() })
        .like('title', 'E2E Test:%')
        .is('deleted_at', null);
    };
    await use(cleanup);
    await cleanup(); // Run cleanup after test
  },

  cleanupBlogPosts: async ({ supabase }, use) => {
    const cleanup = async () => {
      await supabase
        .from('blog_posts')
        .delete()
        .like('title', 'E2E Test:%');
    };
    await use(cleanup);
    await cleanup(); // Run cleanup after test
  },

  cleanupOrgs: async ({ supabase }, use) => {
    const cleanup = async () => {
      await supabase
        .from('organizations')
        .delete()
        .like('name', 'E2E Test:%');
    };
    await use(cleanup);
    await cleanup(); // Run cleanup after test
  },
});

export { expect } from '@playwright/test';
