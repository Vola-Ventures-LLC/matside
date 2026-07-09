/**
 * Create test users via Supabase API
 * Run this after disabling email confirmation in Supabase
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tpfyezfosamfuswfkwjt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0cIXpbbK3hZ6DVDA4OuOoQ_PWETcRI2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const testUsers = [
  { email: 'natalie.morin+e2e-user@gmail.com', password: 'Demo1234', role: 'user' },
  { email: 'natalie.morin+e2e-admin@gmail.com', password: 'Demo1234', role: 'admin' },
  { email: 'natalie.morin+e2e-owner@gmail.com', password: 'Demo1234', role: 'owner' },
];

async function createTestUsers() {
  console.log('🔧 Creating test users...\n');

  for (const user of testUsers) {
    console.log(`Creating ${user.email}...`);

    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          test_user: true, // Mark as test user
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log(`  ✓ Already exists`);
      } else {
        console.log(`  ✗ Error: ${error.message}`);
      }
    } else {
      console.log(`  ✓ Created successfully`);
      console.log(`    User ID: ${data.user?.id}`);
    }
  }

  console.log('\n✅ Done! Test users are ready.');
  console.log('\nNext steps:');
  console.log('  1. If you have a user_roles table, assign roles:');
  console.log('     - test-admin@example.com → admin role');
  console.log('  2. Run tests: pnpm test:e2e:ui');
}

createTestUsers();
