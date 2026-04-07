import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    let params: Record<string, string> = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const body = await req.text();
      const urlParams = new URLSearchParams(body);
      urlParams.forEach((value, key) => { params[key] = value; });
    } else {
      params = await req.json();
    }

    const { tran_id, val_id, status, amount, store_amount, card_type, bank_tran_id, value_a } = params;
    const orderId = value_a; // Our order UUID

    console.log('SSLCommerz IPN received:', { tran_id, status, val_id, orderId });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const storeId = Deno.env.get('SSLCOMMERZ_STORE_ID')!;
    const storePassword = Deno.env.get('SSLCOMMERZ_STORE_PASSWORD')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (status === 'VALID' || status === 'VALIDATED') {
      // Validate the transaction with SSLCommerz
      const validationUrl = `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${storeId}&store_passwd=${storePassword}&format=json`;
      const valRes = await fetch(validationUrl);
      const valData = await valRes.json();

      if (valData.status === 'VALID' || valData.status === 'VALIDATED') {
        // Payment verified — update order
        if (orderId) {
          await supabase.from('orders').update({
            payment_status: 'paid',
            notes: `SSLCommerz Payment Verified | TrxID: ${bank_tran_id || tran_id} | Card: ${card_type || 'N/A'} | Amount: ৳${amount}`,
          }).eq('id', orderId);
        }

        console.log('Payment validated successfully for order:', orderId);
      } else {
        console.error('SSLCommerz validation failed:', valData);
        if (orderId) {
          await supabase.from('orders').update({
            payment_status: 'failed',
            notes: `SSLCommerz validation failed: ${valData.failedreason || 'Unknown'}`,
          }).eq('id', orderId);
        }
      }
    } else if (status === 'FAILED') {
      if (orderId) {
        await supabase.from('orders').update({
          payment_status: 'failed',
          notes: `SSLCommerz payment failed | TrxID: ${tran_id}`,
        }).eq('id', orderId);
      }
    } else if (status === 'CANCELLED') {
      if (orderId) {
        await supabase.from('orders').update({
          payment_status: 'cancelled',
          status: 'cancelled',
          notes: `SSLCommerz payment cancelled by customer | TrxID: ${tran_id}`,
        }).eq('id', orderId);
      }
    }

    return new Response('IPN Received', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('SSLCommerz IPN error:', error);
    return new Response('IPN Error', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
});
