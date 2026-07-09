import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tpfyezfosamfuswfkwjt.supabase.co',
  'sb_publishable_0cIXpbbK3hZ6DVDA4OuOoQ_PWETcRI2'
);

async function assignRoles() {
  console.log('🔧 Assigning roles to test users...\n');

  const users = [
    { email: 'natalie.morin+e2e-admin@gmail.com', id: '5949391b-48f5-4a8c-ad9a-3ca6acf8cc3b', role: 'admin' },
    { email: 'natalie.morin+e2e-owner@gmail.com', id: '9d3ee51a-0118-4e8c-a322-7bb55ccd105e', role: 'owner' },
  ];

  for (const user of users) {
    console.log(`Assigning ${user.role} role to ${user.email}...`);

    const { error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: user.role,
      });

    if (error) {
      console.log(`  ✗ Error: ${error.message}`);
    } else {
      console.log(`  ✓ Role assigned`);
    }
  }

  console.log('\n✅ Roles assigned!');
}

assignRoles();
