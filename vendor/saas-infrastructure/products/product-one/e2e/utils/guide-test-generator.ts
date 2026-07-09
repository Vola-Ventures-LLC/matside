/**
 * Guide-Based Test Generator
 *
 * Converts user guide articles into E2E test specifications.
 * This creates "living documentation" - tests prove guides work, guides document what's tested.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

interface GuideArticle {
  id: string;
  section_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  visible_to_roles: string[];
  section: {
    title: string;
    slug: string;
  };
}

interface TestStep {
  stepNumber: number;
  action: string;
  isAssertion: boolean;
}

interface TestSpec {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  roles: string[];
  steps: TestStep[];
  tags: string[];
}

/**
 * Parse markdown content to extract test steps
 */
export function parseGuideSteps(markdown: string): TestStep[] {
  const steps: TestStep[] = [];
  const lines = markdown.split('\n');

  let stepNumber = 0;

  for (const line of lines) {
    // Match numbered lists (1. , 2. , etc.)
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      stepNumber++;
      const action = numberedMatch[2].trim();
      const isAssertion = /verify|check|should|expect|confirm|ensure/i.test(action);

      steps.push({
        stepNumber,
        action,
        isAssertion,
      });
      continue;
    }

    // Match checkbox lists (- [ ] or - [x])
    const checkboxMatch = line.match(/^[-*]\s+\[[ x]\]\s+(.+)$/);
    if (checkboxMatch) {
      stepNumber++;
      const action = checkboxMatch[1].trim();
      const isAssertion = /verify|check|should|expect|confirm|ensure/i.test(action);

      steps.push({
        stepNumber,
        action,
        isAssertion,
      });
    }
  }

  return steps;
}

/**
 * Determine test priority based on guide content
 */
function determinePriority(article: GuideArticle): 'critical' | 'high' | 'medium' | 'low' {
  const content = article.content.toLowerCase();
  const title = article.title.toLowerCase();

  // Critical: Authentication, billing, core workflows
  if (
    /login|signup|auth|register|billing|payment|subscription/i.test(title) ||
    /must|required|essential|critical/i.test(content)
  ) {
    return 'critical';
  }

  // High: Admin features, user management
  if (
    /admin|user management|impersonate|role|permission/i.test(title) ||
    article.visible_to_roles.includes('admin')
  ) {
    return 'high';
  }

  // Medium: Most features
  if (/feature|create|edit|delete|manage/i.test(title)) {
    return 'medium';
  }

  // Low: Documentation, guides about guides
  return 'low';
}

/**
 * Generate tags based on guide metadata
 */
function generateTags(article: GuideArticle, priority: string): string[] {
  const tags: string[] = [];

  // Priority tag
  if (priority === 'critical') tags.push('@critical', '@smoke');
  if (priority === 'high') tags.push('@important');

  // Role tags
  if (article.visible_to_roles.length > 0) {
    article.visible_to_roles.forEach(role => tags.push(`@${role}`));
  }

  // Feature tags based on title
  const title = article.title.toLowerCase();
  if (/billing|payment|subscription/i.test(title)) tags.push('@billing');
  if (/support|ticket/i.test(title)) tags.push('@support');
  if (/blog|content/i.test(title)) tags.push('@content');
  if (/admin/i.test(title)) tags.push('@admin');
  if (/auth|login|signup/i.test(title)) tags.push('@auth');

  return tags;
}

/**
 * Convert guide article to test spec
 */
export function guideToTestSpec(article: GuideArticle): TestSpec {
  const steps = parseGuideSteps(article.content);
  const priority = determinePriority(article);
  const tags = generateTags(article, priority);

  return {
    title: article.title,
    description: article.excerpt || `Test generated from guide: ${article.title}`,
    priority,
    roles: article.visible_to_roles.length > 0 ? article.visible_to_roles : ['user'],
    steps,
    tags,
  };
}

/**
 * Generate Playwright test file from test spec
 */
export function generateTestFile(spec: TestSpec, article: GuideArticle): string {
  const fileName = `${article.section.slug}/${article.slug}.spec.ts`;
  const testName = spec.title;
  const tags = spec.tags.join(' ');

  const stepsCode = spec.steps.map((step, index) => {
    const comment = `// ${step.stepNumber}. ${step.action}`;

    if (step.isAssertion) {
      // Generate assertion
      return `  ${comment}
  // TODO: Add assertion - ${step.action}
  // await expect(page.getByText('...')).toBeVisible();`;
    } else {
      // Generate action
      return `  ${comment}
  // TODO: Add action - ${step.action}
  // await page.getByRole('button', { name: '...' }).click();`;
    }
  }).join('\n\n');

  return `import { test, expect } from '@playwright/test';
// Guide-based test: ${testName}
// Source: /guides/${article.section.slug}/${article.slug}
// Priority: ${spec.priority}
// Roles: ${spec.roles.join(', ')}

test.describe('${article.section.title} - ${testName}', () => {
  test('should ${testName.toLowerCase()} ${tags}', async ({ page }) => {
${stepsCode}
  });
});
`;
}

/**
 * Fetch all published guides from Supabase
 */
export async function fetchGuides(
  supabaseUrl: string,
  supabaseKey: string
): Promise<GuideArticle[]> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: articles, error } = await supabase
    .from('guide_articles')
    .select(`
      id,
      section_id,
      title,
      slug,
      content,
      excerpt,
      visible_to_roles,
      section:guide_sections(title, slug)
    `)
    .eq('status', 'published')
    .order('sort_order');

  if (error) {
    throw new Error(`Failed to fetch guides: ${error.message}`);
  }

  return (articles || []) as any;
}

/**
 * Generate test report showing coverage
 */
export function generateCoverageReport(articles: GuideArticle[], specs: TestSpec[]): string {
  const report = [`# Guide-Based Test Coverage Report\n`];
  report.push(`**Generated**: ${new Date().toISOString()}\n`);
  report.push(`**Total Guides**: ${articles.length}`);
  report.push(`**Testable Guides**: ${specs.filter(s => s.steps.length > 0).length}\n`);

  // Group by section
  const bySection = articles.reduce((acc, article) => {
    const sectionTitle = article.section.title;
    if (!acc[sectionTitle]) acc[sectionTitle] = [];
    acc[sectionTitle].push(article);
    return acc;
  }, {} as Record<string, GuideArticle[]>);

  report.push(`## Coverage by Section\n`);
  Object.entries(bySection).forEach(([section, sectionArticles]) => {
    const testable = sectionArticles.filter(a => {
      const spec = specs.find(s => s.title === a.title);
      return spec && spec.steps.length > 0;
    }).length;

    report.push(`### ${section}`);
    report.push(`- **Total Articles**: ${sectionArticles.length}`);
    report.push(`- **Testable**: ${testable}`);
    report.push(`- **Coverage**: ${Math.round((testable / sectionArticles.length) * 100)}%\n`);
  });

  // Priority breakdown
  report.push(`## Priority Breakdown\n`);
  const byPriority = specs.reduce((acc, spec) => {
    if (!acc[spec.priority]) acc[spec.priority] = 0;
    acc[spec.priority]++;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(byPriority).forEach(([priority, count]) => {
    report.push(`- **${priority}**: ${count} tests`);
  });

  return report.join('\n');
}

/**
 * Main generator function
 */
export async function generateTestsFromGuides(
  supabaseUrl: string,
  supabaseKey: string,
  outputDir: string
): Promise<void> {
  console.log('📚 Fetching guides from Supabase...');
  const articles = await fetchGuides(supabaseUrl, supabaseKey);
  console.log(`✅ Found ${articles.length} published guides\n`);

  console.log('🔄 Converting guides to test specs...');
  const specs: TestSpec[] = [];
  const testFiles: Array<{ path: string; content: string }> = [];

  for (const article of articles) {
    const spec = guideToTestSpec(article);
    specs.push(spec);

    if (spec.steps.length > 0) {
      const fileContent = generateTestFile(spec, article);
      const filePath = `${article.section.slug}/${article.slug}.spec.ts`;
      testFiles.push({ path: filePath, content: fileContent });

      console.log(`  ✓ ${article.section.title} → ${article.title} (${spec.steps.length} steps)`);
    } else {
      console.log(`  ⊘ ${article.section.title} → ${article.title} (no steps found)`);
    }
  }

  console.log(`\n📝 Generating ${testFiles.length} test files...\n`);

  // Create output directories
  const generatedDir = path.join(outputDir, 'generated');
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
  }

  // Write test files
  for (const { path: filePath, content } of testFiles) {
    const fullPath = path.join(generatedDir, filePath);
    const dirPath = path.dirname(fullPath);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(fullPath, content);
    console.log(`  ✓ Created ${filePath}`);
  }

  // Generate coverage report
  const report = generateCoverageReport(articles, specs);
  const reportPath = path.join(generatedDir, 'COVERAGE_REPORT.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\n📊 Coverage report: ${reportPath}`);

  console.log(`\n✨ Done! Generated ${testFiles.length} test files from ${articles.length} guides.`);
}
