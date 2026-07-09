#!/usr/bin/env node
/**
 * Seed script for demo data
 *
 * Creates sample users, blog posts, support tickets, content items, etc.
 * Run: node products/product-one/scripts/seed-demo-data.js
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seedDemoUsers() {
  console.log("\n📝 Creating demo user accounts...");

  const users = [
    { email: "admin@example.com", password: "demo1234", role: "admin", name: "Admin User" },
    { email: "user@example.com", password: "demo1234", role: "user", name: "Demo User" },
    { email: "tester@example.com", password: "demo1234", role: "tester", name: "Test User" },
  ];

  for (const user of users) {
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: { full_name: user.name },
      },
    });

    if (error && !error.message.includes("already registered")) {
      console.error(`  ❌ Error creating ${user.email}:`, error.message);
    } else if (data.user) {
      console.log(`  ✅ Created user: ${user.email} (${user.role})`);

      // Assign role
      await supabase.from("user_roles").upsert({
        user_id: data.user.id,
        role: user.role,
      });
    } else {
      console.log(`  ⚠️  User ${user.email} already exists`);
    }
  }
}

async function seedBlogCategories() {
  console.log("\n📚 Creating blog categories...");

  const categories = [
    { name: "News", slug: "news", description: "Company news and updates" },
    { name: "Tutorials", slug: "tutorials", description: "Step-by-step guides" },
    { name: "Product Updates", slug: "product-updates", description: "New features and improvements" },
    { name: "Best Practices", slug: "best-practices", description: "Tips and recommendations" },
  ];

  const { data, error } = await supabase
    .from("blog_categories")
    .upsert(categories, { onConflict: "slug" })
    .select();

  if (error) {
    console.error("  ❌ Error:", error.message);
  } else {
    console.log(`  ✅ Created ${data.length} categories`);
  }

  return data || [];
}

async function seedBlogPosts(categories) {
  console.log("\n📰 Creating blog posts...");

  const posts = [
    {
      title: "Welcome to Our Platform",
      slug: "welcome-to-our-platform",
      excerpt: "We're excited to announce the launch of our new SaaS platform.",
      content: "<h2>Welcome!</h2><p>This is our very first blog post. We're thrilled to have you here.</p>",
      category_id: categories.find(c => c.slug === "news")?.id,
      published_at: new Date().toISOString(),
      reading_time_minutes: 2,
    },
    {
      title: "Getting Started Guide",
      slug: "getting-started-guide",
      excerpt: "Learn how to set up your account and get started in under 5 minutes.",
      content: "<h2>Quick Start</h2><p>Follow these steps to get started...</p>",
      category_id: categories.find(c => c.slug === "tutorials")?.id,
      published_at: new Date(Date.now() - 86400000).toISOString(),
      reading_time_minutes: 5,
    },
    {
      title: "New Features: Dark Mode & Search",
      slug: "new-features-dark-mode-search",
      excerpt: "Check out our latest features including dark mode support and improved search.",
      content: "<h2>What's New</h2><p>We've added dark mode and enhanced search capabilities.</p>",
      category_id: categories.find(c => c.slug === "product-updates")?.id,
      published_at: new Date(Date.now() - 172800000).toISOString(),
      reading_time_minutes: 3,
    },
  ];

  const { data, error } = await supabase
    .from("blog_posts")
    .upsert(posts, { onConflict: "slug" })
    .select();

  if (error) {
    console.error("  ❌ Error:", error.message);
  } else {
    console.log(`  ✅ Created ${data.length} blog posts`);
  }
}

async function seedSubscriptionPlans() {
  console.log("\n💳 Creating subscription plans...");

  const plans = [
    {
      name: "Free",
      price_monthly: 0,
      price_yearly: 0,
      features: JSON.stringify(["10 projects", "1GB storage", "Community support"]),
      is_active: true,
    },
    {
      name: "Pro",
      price_monthly: 29,
      price_yearly: 290,
      features: JSON.stringify(["Unlimited projects", "50GB storage", "Priority support", "Advanced analytics"]),
      is_active: true,
    },
    {
      name: "Enterprise",
      price_monthly: 99,
      price_yearly: 990,
      features: JSON.stringify(["Unlimited everything", "Dedicated support", "Custom integrations", "SLA"]),
      is_active: true,
    },
  ];

  const { data, error } = await supabase
    .from("subscription_plans")
    .upsert(plans, { onConflict: "name" })
    .select();

  if (error) {
    console.error("  ❌ Error:", error.message);
  } else {
    console.log(`  ✅ Created ${data.length} subscription plans`);
  }
}

async function seedContentIdeas() {
  console.log("\n💡 Creating content ideas...");

  const ideas = [
    { title: "10 Tips for Better Productivity", description: "Share productivity hacks for remote work" },
    { title: "Case Study: Customer Success Story", description: "Interview a successful customer" },
    { title: "Behind the Scenes: Our Tech Stack", description: "Explain the technology we use" },
    { title: "Q&A Session Recording", description: "Record and share a Q&A with the team" },
  ];

  const { data, error } = await supabase
    .from("content_ideas")
    .upsert(ideas, { onConflict: "title" })
    .select();

  if (error) {
    console.error("  ❌ Error:", error.message);
  } else {
    console.log(`  ✅ Created ${data.length} content ideas`);
  }
}

async function seedMessageTemplates() {
  console.log("\n✉️  Creating message templates...");

  const templates = [
    {
      name: "welcome_email",
      type: "email",
      subject: "Welcome to {{app_name}}!",
      body: "<h2>Welcome, {{user_name}}!</h2><p>We're excited to have you on board.</p>",
      description: "Sent when a new user signs up",
      variables: JSON.stringify(["user_name", "app_name"]),
      domain_category: "transactional",
      is_active: true,
    },
    {
      name: "password_reset",
      type: "email",
      subject: "Reset your password",
      body: "<h2>Password Reset</h2><p>Click the link below to reset your password:</p><p><a href='{{reset_url}}'>Reset Password</a></p>",
      description: "Sent when user requests password reset",
      variables: JSON.stringify(["user_name", "reset_url", "expiry_time"]),
      domain_category: "transactional",
      is_active: true,
    },
    {
      name: "support_ticket_created",
      type: "email",
      subject: "Support Ticket #{{ticket_id}} Created",
      body: "<h2>Your ticket has been created</h2><p>We've received your support request and will respond soon.</p>",
      description: "Sent when a support ticket is created",
      variables: JSON.stringify(["user_name", "ticket_id"]),
      domain_category: "support",
      is_active: true,
    },
  ];

  const { data, error } = await supabase
    .from("message_templates")
    .upsert(templates, { onConflict: "name" })
    .select();

  if (error) {
    console.error("  ❌ Error:", error.message);
  } else {
    console.log(`  ✅ Created ${data.length} message templates`);
  }
}

async function seedAppConfig() {
  console.log("\n⚙️  Configuring app settings...");

  const { data: existingApp } = await supabase
    .from("apps")
    .select("id")
    .single();

  if (existingApp) {
    const { error } = await supabase
      .from("apps")
      .update({
        blog_enabled: true,
        guides_enabled: true,
        changelog_enabled: true,
        email_branding_enabled: true,
        referrals_enabled: true,
        sms_enabled: false,
        orgs_enabled: true,
      })
      .eq("id", existingApp.id);

    if (error) {
      console.error("  ❌ Error:", error.message);
    } else {
      console.log("  ✅ Updated app feature flags");
    }
  } else {
    const { error } = await supabase
      .from("apps")
      .insert({
        name: "Demo SaaS",
        blog_enabled: true,
        guides_enabled: true,
        changelog_enabled: true,
        email_branding_enabled: true,
        referrals_enabled: true,
        sms_enabled: false,
        orgs_enabled: true,
      });

    if (error) {
      console.error("  ❌ Error:", error.message);
    } else {
      console.log("  ✅ Created app configuration");
    }
  }
}

async function main() {
  console.log("🌱 Seeding demo data...");
  console.log(`📍 Supabase: ${SUPABASE_URL}\n`);

  try {
    await seedDemoUsers();
    const categories = await seedBlogCategories();
    await seedBlogPosts(categories);
    await seedSubscriptionPlans();
    await seedContentIdeas();
    await seedMessageTemplates();
    await seedAppConfig();

    console.log("\n✅ Demo data seeding complete!");
    console.log("\n📝 Demo accounts:");
    console.log("  • admin@example.com / demo1234 (Admin)");
    console.log("  • user@example.com / demo1234 (User)");
    console.log("  • tester@example.com / demo1234 (Tester)");
    console.log("\n🚀 Run: pnpm dev:product-one");
  } catch (error) {
    console.error("\n❌ Error seeding data:", error);
    process.exit(1);
  }
}

main();
