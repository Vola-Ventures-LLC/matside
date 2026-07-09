/**
 * UAT: Generate pairings for all 5 test scenarios
 * Uses service-role admin to get user token, then calls Edge Function
 *
 * Usage: SUPABASE_SERVICE_ROLE_KEY=... node scripts/uat-generate-pairings.mjs
 */

const SUPABASE_URL = 'https://acxydgdrrmvhzfhhulat.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_ROLE_KEY) {
  throw new Error('Set SUPABASE_SERVICE_ROLE_KEY in the environment before running this script.');
}
const USER_EMAIL = 'natalie.hirsch+75f56404-3230-4b7e-804b-d21dc5aab5e4@volaventures.com';
const USER_ID = '959589d2-3e5f-415a-b4ea-d97bcdbb9fb0';
const TEMP_PASSWORD = 'uat-temp-password-do-not-use-in-prod-2026';
const HOST_TEAM_ID = 'ffffffff-ffff-ffff-ffff-000000000001'; // [TEST] Wildcats

const SCENARIOS = [
  { name: 'A - Cross-Team Preference (Fix 7)',   meet_id: 'eeeeeeee-eeee-eeee-eeee-000000000001' },
  { name: 'B - Attendance Priority (Fix 2)',      meet_id: 'eeeeeeee-eeee-eeee-eeee-000000000002' },
  { name: 'C - Weight Cap (Fix 4)',               meet_id: 'eeeeeeee-eeee-eeee-eeee-000000000003' },
  { name: 'D - Mat Preference Individual (Fix 3)',meet_id: 'eeeeeeee-eeee-eeee-eeee-000000000004' },
  { name: 'E - Diagnostics (Fix 6)',              meet_id: 'eeeeeeee-eeee-eeee-eeee-000000000005' },
];

async function getUserToken() {
  // 1. Set a temporary password on the user via admin API
  const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}`, {
    method: 'PUT',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: TEMP_PASSWORD }),
  });

  if (!updateRes.ok) {
    const err = await updateRes.text();
    throw new Error(`admin update user failed: ${updateRes.status} ${err}`);
  }

  // 2. Sign in with email + password to get access token
  const signInRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: USER_EMAIL, password: TEMP_PASSWORD }),
  });

  const signInData = await signInRes.json();
  if (!signInData.access_token) {
    throw new Error('sign-in failed: ' + JSON.stringify(signInData));
  }

  // 3. Remove the password so the user stays passwordless
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}`, {
    method: 'PUT',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: null }),
  }).catch(() => {}); // best-effort cleanup

  return signInData.access_token;
}

async function getUserTokenFallback() {
  // Alternative: use admin API to get user, then create custom JWT
  // For Supabase, we can't directly create user JWTs without going through auth
  // BUT: we can use signInWithOtp with the admin token

  // Try admin user session endpoint
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/959589d2-3e5f-415a-b4ea-d97bcdbb9fb0`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  const user = await res.json();
  console.log('User:', JSON.stringify(user).substring(0, 200));

  // Try to exchange via OTP
  const otpRes = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: USER_EMAIL, create_user: false }),
  });
  console.log('OTP status:', otpRes.status);
  return null;
}

async function generatePairings(accessToken, meetId) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-pairings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ meet_id: meetId, host_team_id: HOST_TEAM_ID }),
  });

  const data = await res.json();
  return { status: res.status, data };
}

async function main() {
  console.log('Getting user access token...');
  let accessToken;
  try {
    accessToken = await getUserToken();
    console.log('Token obtained successfully.');
  } catch (e) {
    console.error('Primary token method failed:', e.message);
    console.log('Trying fallback...');
    await getUserTokenFallback();
    process.exit(1);
  }

  console.log('\n=== Generating pairings for all UAT scenarios ===\n');

  for (const scenario of SCENARIOS) {
    console.log(`\n--- Scenario ${scenario.name} ---`);
    console.log(`Meet ID: ${scenario.meet_id}`);

    try {
      const result = await generatePairings(accessToken, scenario.meet_id);
      if (result.status === 200 || result.status === 201) {
        const d = result.data;
        console.log(`✅ matches_created: ${d.matches_created}`);
        if (d.wrestlers_with_zero_matches?.length > 0) {
          console.log(`⚠️  wrestlers_with_zero_matches (${d.wrestlers_with_zero_matches.length}):`);
          d.wrestlers_with_zero_matches.forEach(w => {
            console.log(`   - ${w.name}: ${w.reason}`);
          });
        } else {
          console.log('   All wrestlers matched.');
        }
      } else {
        console.log(`❌ Error ${result.status}:`, JSON.stringify(result.data));
      }
    } catch (err) {
      console.error(`❌ Exception:`, err.message);
    }
  }

  console.log('\n=== Done ===');
}

main().catch(console.error);
