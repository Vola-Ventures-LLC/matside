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
  console.warn("⚠️  No .env file found at root. Skipping blog route fetching.");
  // Write empty array so build doesn't fail
  fs.writeFileSync(
    path.resolve(__dirname, "../blog-routes.json"),
    JSON.stringify([], null, 2)
  );
  process.exit(0);
}

// Check for required env vars
if (!env.VITE_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "⚠️  Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Skipping blog route fetching."
  );
  fs.writeFileSync(
    path.resolve(__dirname, "../blog-routes.json"),
    JSON.stringify([], null, 2)
  );
  process.exit(0);
}

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY // Service role key for build-time access
);

async function fetchBlogRoutes() {
  console.log("📚 Fetching published blog posts for prerendering...");

  try {
    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("slug")
      .eq("status", "published");

    if (error) {
      console.error("❌ Failed to fetch blog posts:", error);
      // Don't fail build - just skip blog prerendering
      fs.writeFileSync(
        path.resolve(__dirname, "../blog-routes.json"),
        JSON.stringify([], null, 2)
      );
      return;
    }

    const routes = (posts || []).map((post) => `/blog/${post.slug}`);

    fs.writeFileSync(
      path.resolve(__dirname, "../blog-routes.json"),
      JSON.stringify(routes, null, 2)
    );

    console.log(`✅ Found ${routes.length} blog posts to prerender`);
    if (routes.length > 0) {
      routes.forEach((route) => console.log(`  - ${route}`));
    }
  } catch (error) {
    console.error("❌ Unexpected error fetching blog routes:", error);
    fs.writeFileSync(
      path.resolve(__dirname, "../blog-routes.json"),
      JSON.stringify([], null, 2)
    );
  }
}

fetchBlogRoutes();
