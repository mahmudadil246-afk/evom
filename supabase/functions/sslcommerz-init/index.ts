import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function delay(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status < 500) return res;
      if (attempt < maxRetries) await delay(1000 * (attempt + 1)); else return res;
    } catch (err) { if (attempt === maxRetries) throw err; await delay(1000 * (attempt + 1)); }
  }
  throw new Error("NETWORK_ERROR: SSLCommerz API unreachable after retries");
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      orderId,
      orderNumber,
      totalAmount,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      customerCity,
      customerPostCode,
      productNames,
      successUrl,
      failUrl,
      cancelUrl,
    } = await req.json();

    const storeId = Deno.env.get('SSLCOMMERZ_STORE_ID');
    const storePassword = Deno.env.get('SSLCOMMERZ_STORE_PASSWORD');

    if (!storeId || !storePassword) {
      throw new Error('SSLCommerz credentials not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Build IPN URL (backend callback)
    const ipnUrl = `${supabaseUrl}/functions/v1/sslcommerz-ipn`;

    const params = new URLSearchParams();
    params.append('store_id', storeId);
    params.append('store_passwd', storePassword);
    params.append('total_amount', totalAmount.toString());
    params.append('currency', 'BDT');
    params.append('tran_id', orderNumber);
    params.append('success_url', successUrl);
    params.append('fail_url', failUrl);
    params.append('cancel_url', cancelUrl);
    params.append('ipn_url', ipnUrl);
    params.append('cus_name', customerName || 'Customer');
    params.append('cus_email', customerEmail || 'customer@example.com');
    params.append('cus_phone', customerPhone || '01700000000');
    params.append('cus_add1', customerAddress || 'N/A');
    params.append('cus_city', customerCity || 'Dhaka');
    params.append('cus_postcode', customerPostCode || '1000');
    params.append('cus_country', 'Bangladesh');
    params.append('shipping_method', 'Courier');
    params.append('ship_name', customerName || 'Customer');
    params.append('ship_add1', customerAddress || 'N/A');
    params.append('ship_city', customerCity || 'Dhaka');
    params.append('ship_postcode', customerPostCode || '1000');
    params.append('ship_country', 'Bangladesh');
    params.append('product_name', productNames || 'Order Items');
    params.append('product_category', 'Fashion');
    params.append('product_profile', 'general');
    params.append('value_a', orderId); // Store order UUID for IPN

    const sslRes = await fetchWithRetry('https://sandbox.sslcommerz.com/gwprocess/v4/api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const sslData = await sslRes.json();

    if (sslData.status === 'SUCCESS' && sslData.GatewayPageURL) {
      // Update order with SSLCommerz session info
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('orders').update({
        notes: `SSLCommerz Session: ${sslData.sessionkey}`,
      }).eq('id', orderId);

      return new Response(JSON.stringify({
        success: true,
        gatewayUrl: sslData.GatewayPageURL,
        sessionKey: sslData.sessionkey,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.error('SSLCommerz init failed:', sslData);
      return new Response(JSON.stringify({
        success: false,
        error: sslData.failedreason || 'Failed to initialize payment',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: unknown) {
    console.error('SSLCommerz init error:', error);
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({
      success: false,
      error: msg,
      code: msg.includes("NETWORK_ERROR") ? "NETWORK_ERROR" : "API_ERROR",
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
