import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tpfyezfosamfuswfkwjt.supabase.co',
  'sb_publishable_0cIXpbbK3hZ6DVDA4OuOoQ_PWETcRI2'
);

async function checkGuides() {
  // Check sections
  const { data: sections, error: sectionsError } = await supabase
    .from('guide_sections')
    .select('*');
  
  console.log('\n📁 Guide Sections:');
  if (sectionsError) {
    console.log('  Error:', sectionsError.message);
  } else {
    console.log(`  Found: ${sections?.length || 0} sections`);
    sections?.forEach(s => console.log(`    - ${s.title} (${s.slug})`));
  }

  // Check articles (all statuses)
  const { data: articles, error: articlesError } = await supabase
    .from('guide_articles')
    .select('*');
  
  console.log('\n📄 Guide Articles:');
  if (articlesError) {
    console.log('  Error:', articlesError.message);
  } else {
    console.log(`  Found: ${articles?.length || 0} articles`);
    const byStatus = articles?.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});
    console.log('  By status:', byStatus);
  }
}

checkGuides();
