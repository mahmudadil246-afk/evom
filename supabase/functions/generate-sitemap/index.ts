import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get store URL from settings or use origin
    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, "") || "https://example.com";

    // Fetch active products
    const { data: products } = await supabase
      .from("products")
      .select("id, updated_at")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    // Fetch active categories
    const { data: categories } = await supabase
      .from("categories")
      .select("slug, updated_at")
      .eq("is_active", true)
      .is("deleted_at", null);

    const staticPages = [
      { path: "/", priority: "1.0", changefreq: "daily" },
      { path: "/products", priority: "0.9", changefreq: "daily" },
      { path: "/contact", priority: "0.5", changefreq: "monthly" },
      { path: "/faq", priority: "0.4", changefreq: "monthly" },
      { path: "/shipping-info", priority: "0.4", changefreq: "monthly" },
      { path: "/returns", priority: "0.4", changefreq: "monthly" },
      { path: "/size-guide", priority: "0.3", changefreq: "monthly" },
      { path: "/privacy", priority: "0.2", changefreq: "yearly" },
      { path: "/terms", priority: "0.2", changefreq: "yearly" },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Static pages
    for (const page of staticPages) {
      xml += `
  <url>
    <loc>${origin}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    }

    // Product pages
    if (products) {
      for (const p of products) {
        xml += `
  <url>
    <loc>${origin}/product/${p.id}</loc>
    <lastmod>${new Date(p.updated_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
    }

    // Category pages
    if (categories) {
      for (const c of categories) {
        xml += `
  <url>
    <loc>${origin}/products?category=${encodeURIComponent(c.slug)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
    }

    xml += `
</urlset>`;

    return new Response(xml, { headers: corsHeaders });
  } catch (error) {
    return new Response(`<error>${error.message}</error>`, {
      status: 500,
      headers: { "Content-Type": "application/xml" },
    });
  }
});
