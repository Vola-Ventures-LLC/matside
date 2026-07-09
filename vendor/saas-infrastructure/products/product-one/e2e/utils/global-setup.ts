import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default async function globalSetup() {
  console.log('🔧 Running global E2E setup...');

  // Verify required environment variables
  const requiredEnvVars = [
    'VITE_SUPABASE_URL_TEST',
    'VITE_SUPABASE_ANON_KEY_TEST',
    'TEST_USER_EMAIL',
    'TEST_USER_PASSWORD',
    'TEST_ADMIN_EMAIL',
    'TEST_ADMIN_PASSWORD',
  ];

  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Copy .env.test.example to .env.test and fill in your test credentials.'
    );
  }

  // Verify Supabase connection (optional - can be removed if pre-seeded users exist)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY_TEST) {
    try {
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL_TEST!,
        process.env.SUPABASE_SERVICE_ROLE_KEY_TEST!
      );

      // Verify test users exist
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) {
        console.warn('⚠️  Could not verify test users:', error.message);
        console.warn('   Tests may fail if users are not pre-seeded.');
      } else {
        const testEmails = [
          process.env.TEST_USER_EMAIL,
          process.env.TEST_ADMIN_EMAIL,
          process.env.TEST_OWNER_EMAIL,
        ].filter(Boolean);

        const existingEmails = data.users.map(u => u.email);
        const foundUsers = testEmails.filter(email => existingEmails.includes(email));

        console.log(`✅ Found ${foundUsers.length}/${testEmails.length} test users in Supabase`);

        if (foundUsers.length < testEmails.length) {
          const missing = testEmails.filter(email => !existingEmails.includes(email));
          console.warn('⚠️  Missing test users:', missing.join(', '));
          console.warn('   Create these users in your Supabase test project before running tests.');
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not connect to Supabase:', error);
    }
  }

  console.log('✅ Global setup complete\n');
}
