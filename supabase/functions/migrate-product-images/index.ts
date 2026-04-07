import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function base64ToUint8Array(base64: string): { data: Uint8Array; mimeType: string } {
  const match = base64.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid base64 string");
  const mimeType = match[1];
  const raw = atob(match[2]);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return { data: arr, mimeType };
}

function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mime] || "jpg";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get products with base64 images
    const { data: products, error } = await supabase
      .from("products")
      .select("id, images")
      .not("images", "is", null);

    if (error) throw error;

    let migratedCount = 0;
    let imageCount = 0;

    for (const product of products || []) {
      const imgs: string[] = product.images || [];
      const hasBase64 = imgs.some((img: string) => img.startsWith("data:"));
      if (!hasBase64) continue;

      const newImages: string[] = [];

      for (const img of imgs) {
        if (!img.startsWith("data:")) {
          newImages.push(img);
          continue;
        }

        try {
          const { data: bytes, mimeType } = base64ToUint8Array(img);
          const ext = mimeToExt(mimeType);
          const fileName = `products/${crypto.randomUUID()}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(fileName, bytes, {
              contentType: mimeType,
              cacheControl: "31536000",
              upsert: false,
            });

          if (uploadError) {
            console.error(`Upload failed for product ${product.id}:`, uploadError);
            newImages.push(img); // keep original on failure
            continue;
          }

          const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(fileName);

          newImages.push(urlData.publicUrl);
          imageCount++;
        } catch (e) {
          console.error(`Error processing image for product ${product.id}:`, e);
          newImages.push(img);
        }
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({ images: newImages })
        .eq("id", product.id);

      if (!updateError) migratedCount++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        migratedProducts: migratedCount,
        migratedImages: imageCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
