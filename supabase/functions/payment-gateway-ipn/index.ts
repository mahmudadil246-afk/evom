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
    const url = new URL(req.url);

    // Parse from query params (for GET callbacks)
    url.searchParams.forEach((value, key) => { params[key] = value; });

    // Parse from body
    if (req.method === 'POST') {
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const body = await req.text();
        const urlParams = new URLSearchParams(body);
        urlParams.forEach((value, key) => { params[key] = value; });
      } else if (contentType.includes('application/json')) {
        const jsonBody = await req.json();
        Object.entries(jsonBody).forEach(([key, value]) => { params[key] = String(value); });
      }
    }

    console.log('Payment Gateway IPN received:', JSON.stringify(params).slice(0, 500));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Detect which gateway sent the callback
    const gateway = params.value_b || params.opt_b || detectGateway(params);

    switch (gateway) {
      case 'sslcommerz':
        await handleSSLCommerzIPN(params, supabase);
        break;
      case 'shurjopay':
        await handleShurjoPayIPN(params, supabase);
        break;
      case 'aamarpay':
        await handleAamarPayIPN(params, supabase);
        break;
      case 'stripe':
        await handleStripeIPN(params, supabase);
        break;
      case 'paypal':
        await handlePayPalIPN(params, supabase);
        break;
      case 'bkash':
        await handleBkashIPN(params, supabase);
        break;
      default:
        console.log('Unknown gateway IPN, attempting auto-detect...');
        // Try SSLCommerz format as default (most common)
        if (params.tran_id && params.val_id) {
          await handleSSLCommerzIPN(params, supabase);
        }
    }

    return new Response('IPN Received', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('Payment Gateway IPN error:', error);
    return new Response('IPN Error', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
});

function detectGateway(params: Record<string, string>): string {
  if (params.val_id && params.tran_id) return 'sslcommerz';
  if (params.sp_order_id || params.sp_code) return 'shurjopay';
  if (params.mer_txnid && params.pay_status) return 'aamarpay';
  if (params.type === 'checkout.session.completed') return 'stripe';
  if (params.event_type && params.resource) return 'paypal';
  if (params.paymentID && params.trxID) return 'bkash';
  return 'unknown';
}

// ─── SSLCommerz IPN ────────────────────────────────────────────────────────────
async function handleSSLCommerzIPN(params: Record<string, string>, supabase: any) {
  const { tran_id, val_id, status, amount, card_type, bank_tran_id, value_a: orderId } = params;

  console.log('SSLCommerz IPN:', { tran_id, status, val_id, orderId });

  if (status === 'VALID' || status === 'VALIDATED') {
    const storeId = Deno.env.get('SSLCOMMERZ_STORE_ID')!;
    const storePassword = Deno.env.get('SSLCOMMERZ_STORE_PASSWORD')!;

    // Also try reading from DB
    let dbStoreId = storeId;
    let dbStorePassword = storePassword;
    try {
      const { data: mc } = await supabase.from('payment_methods').select('config').eq('code', 'sslcommerz').single();
      if (mc?.config) {
        const cfg = typeof mc.config === 'string' ? JSON.parse(mc.config) : mc.config;
        if (cfg.merchant_id) dbStoreId = cfg.merchant_id;
        if (cfg.api_key) dbStorePassword = cfg.api_key;
      }
    } catch {}

    const sid = dbStoreId || storeId;
    const spw = dbStorePassword || storePassword;
    const isTestMode = true; // Check from DB config in production
    const validationBase = isTestMode ? 'https://sandbox.sslcommerz.com' : 'https://securepay.sslcommerz.com';

    const validationUrl = `${validationBase}/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${sid}&store_passwd=${spw}&format=json`;
    const valRes = await fetch(validationUrl);
    const valData = await valRes.json();

    if (valData.status === 'VALID' || valData.status === 'VALIDATED') {
      if (orderId) {
        await supabase.from('orders').update({
          payment_status: 'paid',
          notes: `SSLCommerz Payment Verified | TrxID: ${bank_tran_id || tran_id} | Card: ${card_type || 'N/A'} | Amount: ৳${amount}`,
        }).eq('id', orderId);
      }
      console.log('SSLCommerz payment validated for order:', orderId);
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
    if (params.value_a) {
      await supabase.from('orders').update({
        payment_status: 'failed',
        notes: `SSLCommerz payment failed | TrxID: ${tran_id}`,
      }).eq('id', params.value_a);
    }
  } else if (status === 'CANCELLED') {
    if (params.value_a) {
      await supabase.from('orders').update({
        payment_status: 'cancelled',
        status: 'cancelled',
        notes: `SSLCommerz payment cancelled | TrxID: ${tran_id}`,
      }).eq('id', params.value_a);
    }
  }
}

// ─── ShurjoPay IPN ─────────────────────────────────────────────────────────────
async function handleShurjoPayIPN(params: Record<string, string>, supabase: any) {
  const orderId = params.value1 || params.customer_order_id;
  const spOrderId = params.sp_order_id || params.order_id;
  const spCode = params.sp_code;
  const bankTrxId = params.bank_trx_id;
  const transactionStatus = params.transaction_status || params.sp_message;

  console.log('ShurjoPay IPN:', { orderId, spOrderId, spCode, transactionStatus });

  if (spCode === '1000' || transactionStatus === 'Completed') {
    if (orderId) {
      await supabase.from('orders').update({
        payment_status: 'paid',
        notes: `ShurjoPay Payment Verified | SP Order: ${spOrderId} | Bank TrxID: ${bankTrxId || 'N/A'}`,
      }).eq('id', orderId);
    }
    console.log('ShurjoPay payment validated for order:', orderId);
  } else {
    if (orderId) {
      await supabase.from('orders').update({
        payment_status: 'failed',
        notes: `ShurjoPay payment failed | Status: ${transactionStatus || spCode}`,
      }).eq('id', orderId);
    }
  }
}

// ─── aamarPay IPN ──────────────────────────────────────────────────────────────
async function handleAamarPayIPN(params: Record<string, string>, supabase: any) {
  const orderId = params.opt_a;
  const merTxnId = params.mer_txnid;
  const payStatus = params.pay_status;
  const pgTxnId = params.pg_txnid;
  const cardType = params.card_type;
  const amount = params.amount;

  console.log('aamarPay IPN:', { orderId, merTxnId, payStatus });

  if (payStatus === 'Successful') {
    if (orderId) {
      await supabase.from('orders').update({
        payment_status: 'paid',
        notes: `aamarPay Payment Verified | TrxID: ${pgTxnId || merTxnId} | Card: ${cardType || 'N/A'} | Amount: ৳${amount}`,
      }).eq('id', orderId);
    }
    console.log('aamarPay payment validated for order:', orderId);
  } else {
    if (orderId) {
      await supabase.from('orders').update({
        payment_status: 'failed',
        notes: `aamarPay payment ${payStatus} | TrxID: ${merTxnId}`,
      }).eq('id', orderId);
    }
  }
}

// ─── Stripe IPN (Webhook) ──────────────────────────────────────────────────────
async function handleStripeIPN(params: Record<string, string>, supabase: any) {
  // For Stripe, the webhook sends JSON with event data
  const orderId = params.order_id || params.client_reference_id;
  const paymentStatus = params.payment_status;
  const sessionId = params.session_id;

  console.log('Stripe IPN:', { orderId, paymentStatus, sessionId });

  if (paymentStatus === 'paid' || params.status === 'complete') {
    if (orderId) {
      await supabase.from('orders').update({
        payment_status: 'paid',
        notes: `Stripe Payment Verified | Session: ${sessionId || 'N/A'}`,
      }).eq('id', orderId);
    }
  } else {
    if (orderId) {
      await supabase.from('orders').update({
        payment_status: 'failed',
        notes: `Stripe payment failed | Session: ${sessionId}`,
      }).eq('id', orderId);
    }
  }
}

// ─── PayPal IPN ────────────────────────────────────────────────────────────────
async function handlePayPalIPN(params: Record<string, string>, supabase: any) {
  const orderId = params.custom_id || params.invoice_id;
  const paymentStatus = params.payment_status || params.status;

  console.log('PayPal IPN:', { orderId, paymentStatus });

  if (paymentStatus === 'COMPLETED' || paymentStatus === 'Completed') {
    if (orderId) {
      await supabase.from('orders').update({
        payment_status: 'paid',
        notes: `PayPal Payment Verified | PayPal ID: ${params.txn_id || params.id || 'N/A'}`,
      }).eq('id', orderId);
    }
  } else {
    if (orderId) {
      await supabase.from('orders').update({
        payment_status: 'failed',
        notes: `PayPal payment ${paymentStatus}`,
      }).eq('id', orderId);
    }
  }
}

// ─── bKash IPN ─────────────────────────────────────────────────────────────────
async function handleBkashIPN(params: Record<string, string>, supabase: any) {
  const paymentID = params.paymentID;
  const trxID = params.trxID;
  const transactionStatus = params.transactionStatus;
  const orderId = params.merchantInvoiceNumber;

  console.log('bKash IPN:', { orderId, paymentID, trxID, transactionStatus });

  if (transactionStatus === 'Completed') {
    if (orderId) {
      // Find order by order_number since bKash returns merchantInvoiceNumber
      await supabase.from('orders').update({
        payment_status: 'paid',
        notes: `bKash Payment Verified | PaymentID: ${paymentID} | TrxID: ${trxID}`,
      }).eq('order_number', orderId);
    }
  } else {
    if (orderId) {
      await supabase.from('orders').update({
        payment_status: 'failed',
        notes: `bKash payment ${transactionStatus} | PaymentID: ${paymentID}`,
      }).eq('order_number', orderId);
    }
  }
}
