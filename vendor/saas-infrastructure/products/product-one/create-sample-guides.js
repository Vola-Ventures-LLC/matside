/**
 * Create sample user guides for testing the guide-based test generator
 * This creates example guides that will be converted to E2E tests
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY_TEST in .env.test to bypass RLS policies
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL_TEST;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY_TEST;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY_TEST not found in .env.test');
  console.error('\nPlease add your service role key to .env.test:');
  console.error('SUPABASE_SERVICE_ROLE_KEY_TEST=sb_secret_YOUR_SERVICE_ROLE_KEY_HERE\n');
  console.error('You can find it in Supabase Dashboard → Settings → API → service_role key\n');
  process.exit(1);
}

// Use service role key to bypass RLS policies
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Sample guides organized by section
const sampleGuides = {
  'Getting Started': {
    description: 'Learn the basics of using the platform',
    icon: 'BookOpen',
    articles: [
      {
        title: 'How to Login',
        slug: 'how-to-login',
        excerpt: 'Learn how to access your account',
        content: `# How to Login

Access your account by following these simple steps:

1. Navigate to the login page at /login
2. Enter your email address in the email field
3. Enter your password in the password field
4. Click the "Log In" button
5. Verify you are redirected to the dashboard
6. Check that your name or email appears in the user menu

**Troubleshooting:**
- If you forgot your password, click "Forgot Password" to reset it
- Make sure your email is verified before logging in
`,
        visible_to_roles: [], // Public
      },
      {
        title: 'How to Update Your Profile',
        slug: 'update-profile',
        excerpt: 'Customize your account settings',
        content: `# How to Update Your Profile

Keep your profile information current:

1. Click on your user menu in the top right
2. Select "Settings" from the dropdown
3. Navigate to the "Profile" tab
4. Update your name, bio, or other information
5. Click "Save Changes"
6. Verify you see a success message

Your updated information will be displayed throughout the app.
`,
        visible_to_roles: [],
      },
    ],
  },
  'Support': {
    description: 'Get help when you need it',
    icon: 'MessageCircle',
    articles: [
      {
        title: 'How to Create a Support Ticket',
        slug: 'create-support-ticket',
        excerpt: 'Submit a support request',
        content: `# How to Create a Support Ticket

Need assistance? Here's how to reach our support team:

1. Navigate to the Support page from the sidebar
2. Click the "Create Ticket" button
3. Fill in the ticket title with a brief summary
4. Describe your issue in detail in the description field
5. Select the appropriate category (if available)
6. Click "Submit"
7. Verify your ticket appears in the ticket list
8. Check that you receive the ticket ID

You'll be notified when our team responds to your ticket.
`,
        visible_to_roles: [],
      },
    ],
  },
  'Billing': {
    description: 'Manage your subscription and payments',
    icon: 'CreditCard',
    articles: [
      {
        title: 'How to View Your Subscription',
        slug: 'view-subscription',
        excerpt: 'Check your current plan details',
        content: `# How to View Your Subscription

See what plan you're currently on:

1. Navigate to the Billing page from the sidebar
2. Scroll to the "Current Plan" section
3. Verify your plan name is displayed
4. Check the billing cycle (monthly/yearly)
5. Review the renewal date
6. See the list of included features

From here you can also upgrade or cancel your subscription.
`,
        visible_to_roles: [],
      },
    ],
  },
  'Admin': {
    description: 'Administrative features and tools',
    icon: 'Shield',
    articles: [
      {
        title: 'How to View User List',
        slug: 'view-user-list',
        excerpt: 'Access the user management dashboard',
        content: `# How to View User List

As an admin, you can view all users:

1. Navigate to the Admin section
2. Click on "Users" in the admin menu
3. Verify the user table loads
4. Check that you see columns for email, role, and status
5. Try using the search bar to find a specific user
6. Verify the search filters the results

You can click on any user to view their details.
`,
        visible_to_roles: ['admin', 'owner'],
      },
    ],
  },
};

async function createSampleGuides() {
  console.log('📚 Creating sample user guides...\n');
  console.log('Using service role key to bypass RLS policies\n');

  for (const [sectionTitle, sectionData] of Object.entries(sampleGuides)) {
    console.log(`Creating section: ${sectionTitle}`);

    // Create section
    const { data: section, error: sectionError } = await supabase
      .from('guide_sections')
      .insert({
        title: sectionTitle,
        slug: sectionTitle.toLowerCase().replace(/\s+/g, '-'),
        description: sectionData.description,
        icon: sectionData.icon,
        is_active: true,
        visible_to_roles: [],
      })
      .select()
      .single();

    if (sectionError) {
      console.log(`  ✗ Error creating section: ${sectionError.message}`);
      continue;
    }

    console.log(`  ✓ Section created: ${section.id}`);

    // Create articles for this section
    for (const article of sectionData.articles) {
      const { data: createdArticle, error: articleError } = await supabase
        .from('guide_articles')
        .insert({
          section_id: section.id,
          title: article.title,
          slug: article.slug,
          content: article.content,
          excerpt: article.excerpt,
          status: 'published',
          visible_to_roles: article.visible_to_roles,
          author_id: '00000000-0000-0000-0000-000000000000', // Will need to update this
        })
        .select()
        .single();

      if (articleError) {
        console.log(`    ✗ Error creating article "${article.title}": ${articleError.message}`);
      } else {
        console.log(`    ✓ Article created: ${article.title}`);
      }
    }

    console.log('');
  }

  console.log('✅ Sample guides created!\n');
  console.log('Next steps:');
  console.log('  1. Generate tests: pnpm test:generate-from-guides');
  console.log('  2. Review: cat e2e/generated/COVERAGE_REPORT.md');
  console.log('  3. Implement the tests and start testing!\n');
}

createSampleGuides().catch(console.error);
