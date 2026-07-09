import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from root .env
const envPath = path.resolve(__dirname, "../../../.env");

let env = {};
try {
  const envContent = fs.readFileSync(envPath, "utf-8");
  env = Object.fromEntries(
    envContent
      .split("\n")
      .filter((line) => line.trim() && !line.startsWith("#"))
      .map((line) => {
        const [key, ...values] = line.split("=");
        return [key?.trim(), values.join("=")?.trim()];
      })
      .filter(([key, value]) => key && value)
  );
} catch (error) {
  console.warn("⚠️  No .env file found. Skipping sitemap generation.");
  process.exit(0);
}

// Check for required env vars
if (!env.VITE_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "⚠️  Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Skipping sitemap generation."
  );
  process.exit(0);
}

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// TODO: Update with your actual production domain
const DOMAIN = "https://your-domain.com";

async function generateSitemap() {
  console.log("🗺️  Generating sitemap.xml...");

  try {
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("status", "published");

    const staticPages = [
      { url: "/", priority: "1.0", changefreq: "monthly" },
      { url: "/blog", priority: "0.8", changefreq: "weekly" },
      { url: "/privacy", priority: "0.3", changefreq: "yearly" },
      { url: "/terms", priority: "0.3", changefreq: "yearly" },
    ];

    const blogPages = (posts || []).map((post) => ({
      url: `/blog/${post.slug}`,
      lastmod: post.updated_at,
      priority: "0.6",
      changefreq: "monthly",
    }));

    const allPages = [...staticPages, ...blogPages];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${DOMAIN}${page.url}</loc>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ""}
    <changefreq>${page.changefreq || "monthly"}</changefreq>
    <priority>${page.priority || "0.5"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    const distPath = path.resolve(__dirname, "../dist/sitemap.xml");
    fs.writeFileSync(distPath, sitemap);
    console.log(`✅ Sitemap generated with ${allPages.length} pages`);
  } catch (error) {
    console.error("❌ Failed to generate sitemap:", error);
    // Don't fail build
    process.exit(0);
  }
}

generateSitemap();
