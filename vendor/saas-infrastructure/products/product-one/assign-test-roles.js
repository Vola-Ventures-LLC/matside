/**
 * Assign admin and owner roles to E2E test users
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

const testUsers = [
  { email: 'natalie.morin+e2e-admin@gmail.com', role: 'admin' },
  { email: 'natalie.morin+e2e-owner@gmail.com', role: 'owner' },
];

async function assignRoles() {
  console.log('🔧 Assigning roles to test users...\n');
  console.log('Using service role key to bypass RLS policies\n');

  for (const user of testUsers) {
    console.log(`Assigning ${user.role} role to ${user.email}...`);

    // Get user ID
    const { data: authUser, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', user.email)
      .single();

    if (userError) {
      // Try alternative query using auth admin API
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        console.log(`  ✗ Error finding user: ${listError.message}`);
        continue;
      }

      const foundUser = users.find(u => u.email === user.email);

      if (!foundUser) {
        console.log(`  ✗ User not found`);
        continue;
      }

      // Check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', foundUser.id)
        .single();

      if (existingRole) {
        if (existingRole.role === user.role) {
          console.log(`  ℹ️  Already has ${user.role} role`);
          continue;
        }

        // Update existing role
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ role: user.role })
          .eq('user_id', foundUser.id);

        if (updateError) {
          console.log(`  ✗ Error updating role: ${updateError.message}`);
        } else {
          console.log(`  ✓ Role updated from ${existingRole.role} to ${user.role}`);
        }
        continue;
      }

      // Insert role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: foundUser.id,
          role: user.role
        });

      if (roleError) {
        console.log(`  ✗ Error assigning role: ${roleError.message}`);
      } else {
        console.log(`  ✓ Role assigned successfully`);
      }
    } else {
      // Check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (existingRole) {
        if (existingRole.role === user.role) {
          console.log(`  ℹ️  Already has ${user.role} role`);
          continue;
        }

        // Update existing role
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ role: user.role })
          .eq('user_id', authUser.id);

        if (updateError) {
          console.log(`  ✗ Error updating role: ${updateError.message}`);
        } else {
          console.log(`  ✓ Role updated from ${existingRole.role} to ${user.role}`);
        }
        continue;
      }

      // Insert role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authUser.id,
          role: user.role
        });

      if (roleError) {
        console.log(`  ✗ Error assigning role: ${roleError.message}`);
      } else {
        console.log(`  ✓ Role assigned successfully`);
      }
    }
  }

  console.log('\n✅ Done! Test user roles assigned.');
  console.log('\nNext steps:');
  console.log('  1. Run admin tests: pnpm test:e2e --grep @admin');
  console.log('  2. Verify roles in Supabase Dashboard → Database → user_roles table\n');
}

assignRoles().catch(console.error);
