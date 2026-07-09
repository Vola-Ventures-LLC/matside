#!/usr/bin/env tsx
/**
 * Generate E2E tests from user guides
 *
 * Usage:
 *   pnpm tsx scripts/generate-guide-tests.ts
 *
 * Requires .env.test to be configured with Supabase credentials
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { generateTestsFromGuides } from '../e2e/utils/guide-test-generator.js';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.test') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL_TEST;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY_TEST;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('   Make sure .env.test is configured with:');
  console.error('   - VITE_SUPABASE_URL_TEST');
  console.error('   - VITE_SUPABASE_ANON_KEY_TEST');
  process.exit(1);
}

const outputDir = path.join(__dirname, '..', 'e2e');

console.log('🚀 Guide-Based Test Generator\n');
console.log('This will generate E2E test scaffolds from your published user guides.');
console.log('Tests will be created in: e2e/generated/\n');

generateTestsFromGuides(SUPABASE_URL, SUPABASE_KEY, outputDir)
  .then(() => {
    console.log('\n✅ Test generation complete!\n');
    console.log('Next steps:');
    console.log('  1. Review generated tests in e2e/generated/');
    console.log('  2. Fill in TODO comments with actual Playwright selectors');
    console.log('  3. Move completed tests to e2e/<section>/ folders');
    console.log('  4. Run tests with: pnpm test:e2e\n');
  })
  .catch((error) => {
    console.error('\n❌ Error generating tests:', error.message);
    process.exit(1);
  });
