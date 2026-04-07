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
    const {
      gateway, // 'sslcommerz' | 'shurjopay' | 'aamarpay' | 'stripe' | 'paypal' | 'bkash'
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Read gateway credentials from payment_methods table
    const { data: methodConfig, error: configError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('code', gateway)
      .eq('is_active', true)
      .single();

    if (configError || !methodConfig) {
      throw new Error(`Payment method "${gateway}" not found or not active`);
    }

    // Parse config and account_details
    let config: any = {};
    let accountDetails: any = {};
    try {
      config = typeof methodConfig.config === 'string' ? JSON.parse(methodConfig.config) : (methodConfig.config || {});
    } catch { config = {}; }
    try {
      accountDetails = typeof methodConfig.account_details === 'string' ? JSON.parse(methodConfig.account_details) : (methodConfig.account_details || {});
    } catch { accountDetails = {}; }

    const ipnUrl = `${supabaseUrl}/functions/v1/payment-gateway-ipn`;

    let result: any;

    switch (gateway) {
      case 'sslcommerz':
        result = await initSSLCommerz({ config, orderId, orderNumber, totalAmount, customerName, customerEmail, customerPhone, customerAddress, customerCity, customerPostCode, productNames, successUrl, failUrl, cancelUrl, ipnUrl });
        break;
      case 'shurjopay':
        result = await initShurjoPay({ config, orderId, orderNumber, totalAmount, customerName, customerEmail, customerPhone, customerAddress, customerCity, customerPostCode, successUrl, failUrl, cancelUrl });
        break;
      case 'aamarpay':
        result = await initAamarPay({ config, orderId, orderNumber, totalAmount, customerName, customerEmail, customerPhone, successUrl, failUrl, cancelUrl });
        break;
      case 'stripe':
        result = await initStripe({ config, orderId, orderNumber, totalAmount, customerName, customerEmail, productNames, successUrl, cancelUrl });
        break;
      case 'paypal':
        result = await initPayPal({ config, orderId, orderNumber, totalAmount, customerName, customerEmail, successUrl, cancelUrl });
        break;
      case 'bkash':
        result = await initBkash({ config, orderId, orderNumber, totalAmount, customerEmail, customerPhone, successUrl, failUrl, cancelUrl });
        break;
      default:
        throw new Error(`Unsupported gateway: ${gateway}`);
    }

    // Update order with gateway session info
    if (result.success) {
      await supabase.from('orders').update({
        notes: `${gateway.toUpperCase()} Session: ${result.sessionId || 'initiated'}`,
      }).eq('id', orderId);
    }

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Payment gateway init error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ─── SSLCommerz ────────────────────────────────────────────────────────────────
async function initSSLCommerz({ config, orderId, orderNumber, totalAmount, customerName, customerEmail, customerPhone, customerAddress, customerCity, customerPostCode, productNames, successUrl, failUrl, cancelUrl, ipnUrl }: any) {
  // Try DB config first, fall back to env secrets
  const storeId = config.merchant_id || Deno.env.get('SSLCOMMERZ_STORE_ID');
  const storePassword = config.api_key || Deno.env.get('SSLCOMMERZ_STORE_PASSWORD');
  const isTestMode = config.test_mode === 'sandbox' || config.test_mode === true || config.test_mode === 'true';

  if (!storeId || !storePassword) {
    throw new Error('SSLCommerz credentials not configured. Please add Store ID and Store Password in admin settings.');
  }

  const baseApiUrl = isTestMode || !config.test_mode 
    ? 'https://sandbox.sslcommerz.com' 
    : 'https://securepay.sslcommerz.com';

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
  params.append('product_category', 'General');
  params.append('product_profile', 'general');
  params.append('value_a', orderId);
  params.append('value_b', 'sslcommerz');

  const sslRes = await fetch(`${baseApiUrl}/gwprocess/v4/api.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const sslData = await sslRes.json();
  if (sslData.status === 'SUCCESS' && sslData.GatewayPageURL) {
    return { success: true, gatewayUrl: sslData.GatewayPageURL, sessionId: sslData.sessionkey };
  }
  console.error('SSLCommerz init failed:', sslData);
  return { success: false, error: sslData.failedreason || 'Failed to initialize SSLCommerz' };
}

// ─── ShurjoPay ─────────────────────────────────────────────────────────────────
async function initShurjoPay({ config, orderId, orderNumber, totalAmount, customerName, customerEmail, customerPhone, customerAddress, customerCity, customerPostCode, successUrl, failUrl, cancelUrl }: any) {
  const merchantUsername = config.merchant_id;
  const merchantPassword = config.api_key;
  const isTestMode = config.test_mode === 'sandbox' || config.test_mode === true;

  if (!merchantUsername || !merchantPassword) {
    throw new Error('ShurjoPay credentials not configured. Please add Merchant Username and Password in admin settings.');
  }

  const baseUrl = isTestMode 
    ? 'https://sandbox.shurjopayment.com' 
    : 'https://engine.shurjopayment.com';

  // Step 1: Get auth token
  const tokenRes = await fetch(`${baseUrl}/api/get_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: merchantUsername, password: merchantPassword }),
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.token) {
    console.error('ShurjoPay token failed:', tokenData);
    return { success: false, error: 'Failed to authenticate with ShurjoPay' };
  }

  // Step 2: Create payment
  const paymentRes = await fetch(`${baseUrl}/api/secret-pay`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenData.token}`,
    },
    body: JSON.stringify({
      prefix: 'SP',
      token: tokenData.token,
      store_id: tokenData.store_id || 1,
      return_url: successUrl,
      cancel_url: cancelUrl,
      amount: totalAmount,
      order_id: orderNumber,
      currency: 'BDT',
      customer_name: customerName || 'Customer',
      customer_phone: customerPhone || '01700000000',
      customer_email: customerEmail || 'customer@example.com',
      customer_address: customerAddress || 'N/A',
      customer_city: customerCity || 'Dhaka',
      customer_post_code: customerPostCode || '1000',
      client_ip: '127.0.0.1',
      value1: orderId,
      value2: 'shurjopay',
    }),
  });
  const paymentData = await paymentRes.json();

  if (paymentData.checkout_url) {
    return { success: true, gatewayUrl: paymentData.checkout_url, sessionId: paymentData.sp_order_id || orderNumber };
  }
  console.error('ShurjoPay payment init failed:', paymentData);
  return { success: false, error: paymentData.message || 'Failed to create ShurjoPay payment' };
}

// ─── aamarPay ──────────────────────────────────────────────────────────────────
async function initAamarPay({ config, orderId, orderNumber, totalAmount, customerName, customerEmail, customerPhone, successUrl, failUrl, cancelUrl }: any) {
  const storeId = config.merchant_id;
  const signatureKey = config.api_key;
  const isTestMode = config.test_mode === 'sandbox' || config.test_mode === true;

  if (!storeId || !signatureKey) {
    throw new Error('aamarPay credentials not configured. Please add Store ID and Signature Key in admin settings.');
  }

  const baseUrl = isTestMode 
    ? 'https://sandbox.aamarpay.com' 
    : 'https://secure.aamarpay.com';

  const paymentRes = await fetch(`${baseUrl}/jsonpost.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      store_id: storeId,
      signature_key: signatureKey,
      tran_id: orderNumber,
      amount: totalAmount.toString(),
      currency: 'BDT',
      desc: `Order ${orderNumber}`,
      cus_name: customerName || 'Customer',
      cus_email: customerEmail || 'customer@example.com',
      cus_phone: customerPhone || '01700000000',
      cus_add1: 'Bangladesh',
      cus_city: 'Dhaka',
      cus_country: 'Bangladesh',
      success_url: successUrl,
      fail_url: failUrl,
      cancel_url: cancelUrl,
      type: 'json',
      opt_a: orderId,
      opt_b: 'aamarpay',
    }),
  });
  const paymentData = await paymentRes.json();

  if (paymentData.payment_url) {
    return { success: true, gatewayUrl: paymentData.payment_url, sessionId: orderNumber };
  }
  if (paymentData.result === 'true' && paymentData.payment_url) {
    return { success: true, gatewayUrl: paymentData.payment_url, sessionId: orderNumber };
  }
  console.error('aamarPay init failed:', paymentData);
  return { success: false, error: paymentData.error_message || paymentData.reason || 'Failed to initialize aamarPay' };
}

// ─── Stripe ────────────────────────────────────────────────────────────────────
async function initStripe({ config, orderId, orderNumber, totalAmount, customerName, customerEmail, productNames, successUrl, cancelUrl }: any) {
  const secretKey = config.secret_key;

  if (!secretKey) {
    throw new Error('Stripe Secret Key not configured. Please add it in admin settings.');
  }

  // Create Stripe Checkout Session
  const params = new URLSearchParams();
  params.append('payment_method_types[]', 'card');
  params.append('mode', 'payment');
  params.append('success_url', `${successUrl}&session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', cancelUrl);
  params.append('client_reference_id', orderId);
  params.append('customer_email', customerEmail || '');
  params.append('line_items[0][price_data][currency]', 'bdt');
  params.append('line_items[0][price_data][unit_amount]', Math.round(totalAmount * 100).toString());
  params.append('line_items[0][price_data][product_data][name]', `Order ${orderNumber}`);
  params.append('line_items[0][price_data][product_data][description]', productNames || 'Order Items');
  params.append('line_items[0][quantity]', '1');
  params.append('metadata[order_id]', orderId);
  params.append('metadata[order_number]', orderNumber);
  params.append('metadata[gateway]', 'stripe');

  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  const sessionData = await stripeRes.json();

  if (sessionData.url) {
    return { success: true, gatewayUrl: sessionData.url, sessionId: sessionData.id };
  }
  console.error('Stripe session creation failed:', sessionData);
  return { success: false, error: sessionData.error?.message || 'Failed to create Stripe checkout session' };
}

// ─── PayPal ────────────────────────────────────────────────────────────────────
async function initPayPal({ config, orderId, orderNumber, totalAmount, customerName, customerEmail, successUrl, cancelUrl }: any) {
  const clientId = config.merchant_id;
  const clientSecret = config.secret_key;
  const isTestMode = config.test_mode === 'sandbox' || config.test_mode === true;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured. Please add Client ID and Client Secret in admin settings.');
  }

  const baseUrl = isTestMode 
    ? 'https://api-m.sandbox.paypal.com' 
    : 'https://api-m.paypal.com';

  // Step 1: Get access token
  const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    console.error('PayPal token failed:', tokenData);
    return { success: false, error: 'Failed to authenticate with PayPal' };
  }

  // Step 2: Create order
  const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: orderId,
        description: `Order ${orderNumber}`,
        custom_id: orderId,
        amount: {
          currency_code: 'USD',
          value: totalAmount.toFixed(2),
        },
      }],
      application_context: {
        return_url: successUrl,
        cancel_url: cancelUrl,
        brand_name: 'Store',
        user_action: 'PAY_NOW',
      },
    }),
  });
  const orderData = await orderRes.json();

  const approveLink = orderData.links?.find((l: any) => l.rel === 'approve');
  if (approveLink?.href) {
    return { success: true, gatewayUrl: approveLink.href, sessionId: orderData.id };
  }
  console.error('PayPal order creation failed:', orderData);
  return { success: false, error: orderData.details?.[0]?.description || 'Failed to create PayPal order' };
}

// ─── bKash (API Mode) ─────────────────────────────────────────────────────────
async function initBkash({ config, orderId, orderNumber, totalAmount, customerEmail, customerPhone, successUrl, failUrl, cancelUrl }: any) {
  const appKey = config.app_key;
  const appSecret = config.app_secret;
  const username = config.api_username;
  const password = config.api_password;
  const isTestMode = config.test_mode === 'sandbox' || config.test_mode === true;

  // Check if bKash is in manual mode - skip API
  if (config.payment_mode === 'manual' || !config.payment_mode) {
    return { success: false, error: 'bKash is configured in manual mode. Customer should send payment manually.' };
  }

  if (!appKey || !appSecret || !username || !password) {
    throw new Error('bKash API credentials not configured. Please add App Key, App Secret, Username and Password in admin settings.');
  }

  const baseUrl = isTestMode 
    ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta' 
    : 'https://tokenized.pay.bka.sh/v1.2.0-beta';

  // Step 1: Grant token
  const tokenRes = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'username': username,
      'password': password,
    },
    body: JSON.stringify({ app_key: appKey, app_secret: appSecret }),
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.id_token) {
    console.error('bKash token grant failed:', tokenData);
    return { success: false, error: tokenData.statusMessage || 'Failed to authenticate with bKash' };
  }

  // Step 2: Create payment
  const paymentRes = await fetch(`${baseUrl}/tokenized/checkout/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': tokenData.id_token,
      'X-APP-Key': appKey,
    },
    body: JSON.stringify({
      mode: '0011',
      payerReference: customerPhone || customerEmail || orderId,
      callbackURL: successUrl,
      amount: totalAmount.toString(),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: orderNumber,
    }),
  });
  const paymentData = await paymentRes.json();

  if (paymentData.bkashURL) {
    return { success: true, gatewayUrl: paymentData.bkashURL, sessionId: paymentData.paymentID };
  }
  console.error('bKash payment create failed:', paymentData);
  return { success: false, error: paymentData.statusMessage || 'Failed to create bKash payment' };
}
