/**
 * Script to assign admin/owner roles to test users
 * Run this after creating test users in Supabase
 *
 * Usage: node --loader ts-node/esm setup-test-user-roles.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

async function setupTestUserRoles() {
  console.log('🔧 Setting up test user roles...\n');

  // Verify required environment variables
  const requiredEnvVars = [
    'VITE_SUPABASE_URL_TEST',
    'SUPABASE_SERVICE_ROLE_KEY_TEST',
    'TEST_USER_EMAIL',
    'TEST_ADMIN_EMAIL',
    'TEST_OWNER_EMAIL',
  ];

  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('   Copy .env.test.example to .env.test and fill in your test credentials.');
    process.exit(1);
  }

  // Create Supabase client with service role key (bypass RLS)
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL_TEST!,
    process.env.SUPABASE_SERVICE_ROLE_KEY_TEST!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // Get all test users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Failed to list users:', usersError.message);
      process.exit(1);
    }

    const testUserEmail = process.env.TEST_USER_EMAIL;
    const testAdminEmail = process.env.TEST_ADMIN_EMAIL;
    const testOwnerEmail = process.env.TEST_OWNER_EMAIL;

    const testUser = users.users.find(u => u.email === testUserEmail);
    const adminUser = users.users.find(u => u.email === testAdminEmail);
    const ownerUser = users.users.find(u => u.email === testOwnerEmail);

    // Regular user - no special role needed
    if (!testUser) {
      console.error(`❌ Test user not found: ${testUserEmail}`);
      console.error('   Create this user in Supabase Auth first.');
    } else {
      console.log(`✅ Found test user: ${testUserEmail}`);
    }

    // Admin user - needs 'admin' role
    if (!adminUser) {
      console.error(`❌ Admin user not found: ${testAdminEmail}`);
      console.error('   Create this user in Supabase Auth first.');
    } else {
      console.log(`✅ Found admin user: ${testAdminEmail}`);

      // Check if admin role exists
      const { data: existingAdminRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', adminUser.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (existingAdminRole) {
        console.log('   ℹ️  Admin role already assigned');
      } else {
        // Assign admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: adminUser.id,
            role: 'admin'
          });

        if (roleError) {
          console.error('   ❌ Failed to assign admin role:', roleError.message);
        } else {
          console.log('   ✅ Assigned admin role');
        }
      }
    }

    // Owner user - needs 'owner' role
    if (!ownerUser) {
      console.error(`❌ Owner user not found: ${testOwnerEmail}`);
      console.error('   Create this user in Supabase Auth first.');
    } else {
      console.log(`✅ Found owner user: ${testOwnerEmail}`);

      // Check if owner role exists
      const { data: existingOwnerRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', ownerUser.id)
        .eq('role', 'owner')
        .maybeSingle();

      if (existingOwnerRole) {
        console.log('   ℹ️  Owner role already assigned');
      } else {
        // Assign owner role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: ownerUser.id,
            role: 'owner'
          });

        if (roleError) {
          console.error('   ❌ Failed to assign owner role:', roleError.message);
        } else {
          console.log('   ✅ Assigned owner role');
        }
      }
    }

    console.log('\n✅ Test user roles setup complete!');
    console.log('\nNext steps:');
    console.log('  1. Run E2E tests: pnpm test:e2e');
    console.log('  2. Check test results');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupTestUserRoles();
