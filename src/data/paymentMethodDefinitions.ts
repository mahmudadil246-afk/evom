// Payment method definitions - HARDCODED in code
// Only configuration data (account_number, api_key, etc.) goes to database

export interface PaymentMethodDefinition {
  method_id: string;
  name: string;
  name_bn: string;
  icon: string;
  default_logo?: string;
  description: string;
  description_bn: string;
  type: "mobile" | "gateway" | "manual" | "custom";
  configFields: ConfigField[];
  instructions?: string;
  instructions_bn?: string;
}

export interface ConfigField {
  key: string;
  label: string;
  label_bn: string;
  type: "text" | "password" | "select" | "image" | "switch" | "number" | "bank_accounts" | "textarea";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  dependsOn?: string; // Show this field only when dependsOn field equals a specific value
  dependsOnValue?: string; // If set, field shows when dependsOn field equals this value (default: truthy)
}

export interface BankAccount {
  id: string;
  bank_name: string;
  branch_name: string;
  account_name: string;
  account_number: string;
  routing_number?: string;
  swift_code?: string;
}

export const PAYMENT_METHOD_DEFINITIONS: PaymentMethodDefinition[] = [
  // ─── Mobile Payments ────────────────────────────────────────────────────────
  {
    method_id: "bkash",
    name: "bKash",
    name_bn: "বিকাশ",
    icon: "📱",
    default_logo: "/logos/bkash.png?v=2",
    description: "Pay with bKash mobile wallet",
    description_bn: "বিকাশ মোবাইল ওয়ালেটে পেমেন্ট করুন",
    type: "mobile",
    instructions: "Send payment to the bKash number shown and enter transaction ID",
    instructions_bn: "প্রদর্শিত বিকাশ নম্বরে পেমেন্ট করুন এবং ট্রানজেকশন আইডি দিন",
    configFields: [
      {
        key: "payment_mode",
        label: "Payment Mode",
        label_bn: "পেমেন্ট মোড",
        type: "select",
        options: [
          { value: "manual", label: "Manual (Customer submits Transaction ID)" },
          { value: "api", label: "API Gateway (Automatic redirect)" },
        ],
        required: true,
      },
      // Manual mode fields
      {
        key: "account_number",
        label: "bKash Account Number",
        label_bn: "বিকাশ একাউন্ট নম্বর",
        type: "text",
        placeholder: "01XXXXXXXXX",
        required: true,
        dependsOn: "payment_mode",
        dependsOnValue: "manual",
      },
      {
        key: "account_type",
        label: "Account Type",
        label_bn: "একাউন্ট টাইপ",
        type: "select",
        options: [
          { value: "personal", label: "Personal" },
          { value: "agent", label: "Agent" },
          { value: "merchant", label: "Merchant" },
        ],
        dependsOn: "payment_mode",
        dependsOnValue: "manual",
      },
      {
        key: "qr_code_url",
        label: "Payment QR Code",
        label_bn: "পেমেন্ট QR কোড",
        type: "image",
        dependsOn: "payment_mode",
        dependsOnValue: "manual",
      },
      // API mode fields
      {
        key: "app_key",
        label: "App Key",
        label_bn: "অ্যাপ কী",
        type: "text",
        placeholder: "bKash App Key",
        required: true,
        dependsOn: "payment_mode",
        dependsOnValue: "api",
      },
      {
        key: "app_secret",
        label: "App Secret",
        label_bn: "অ্যাপ সিক্রেট",
        type: "password",
        required: true,
        dependsOn: "payment_mode",
        dependsOnValue: "api",
      },
      {
        key: "api_username",
        label: "API Username",
        label_bn: "API ইউজারনেম",
        type: "text",
        required: true,
        dependsOn: "payment_mode",
        dependsOnValue: "api",
      },
      {
        key: "api_password",
        label: "API Password",
        label_bn: "API পাসওয়ার্ড",
        type: "password",
        required: true,
        dependsOn: "payment_mode",
        dependsOnValue: "api",
      },
      {
        key: "test_mode",
        label: "Environment",
        label_bn: "এনভায়রনমেন্ট",
        type: "select",
        options: [
          { value: "sandbox", label: "Sandbox (Test)" },
          { value: "live", label: "Live (Production)" },
        ],
        dependsOn: "payment_mode",
        dependsOnValue: "api",
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },
  {
    method_id: "nagad",
    name: "Nagad",
    name_bn: "নগদ",
    icon: "📱",
    default_logo: "/logos/nagad.png?v=2",
    description: "Pay with Nagad mobile wallet",
    description_bn: "নগদ মোবাইল ওয়ালেটে পেমেন্ট করুন",
    type: "mobile",
    instructions: "Send payment to the Nagad number shown and enter transaction ID",
    instructions_bn: "প্রদর্শিত নগদ নম্বরে পেমেন্ট করুন এবং ট্রানজেকশন আইডি দিন",
    configFields: [
      {
        key: "account_number",
        label: "Account Number",
        label_bn: "একাউন্ট নম্বর",
        type: "text",
        placeholder: "01XXXXXXXXX",
        required: true,
      },
      {
        key: "account_type",
        label: "Account Type",
        label_bn: "একাউন্ট টাইপ",
        type: "select",
        options: [
          { value: "personal", label: "Personal" },
          { value: "agent", label: "Agent" },
          { value: "merchant", label: "Merchant" },
        ],
        required: true,
      },
      {
        key: "qr_code_url",
        label: "Payment QR Code",
        label_bn: "পেমেন্ট QR কোড",
        type: "image",
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },
  {
    method_id: "rocket",
    name: "Rocket",
    name_bn: "রকেট",
    icon: "🚀",
    default_logo: "/logos/rocket.png?v=2",
    description: "Pay with Rocket (DBBL) mobile wallet",
    description_bn: "রকেট (ডাচ-বাংলা) মোবাইল ওয়ালেটে পেমেন্ট করুন",
    type: "mobile",
    instructions: "Send payment to the Rocket number shown and enter transaction ID",
    instructions_bn: "প্রদর্শিত রকেট নম্বরে পেমেন্ট করুন এবং ট্রানজেকশন আইডি দিন",
    configFields: [
      {
        key: "account_number",
        label: "Account Number",
        label_bn: "একাউন্ট নম্বর",
        type: "text",
        placeholder: "01XXXXXXXXX",
        required: true,
      },
      {
        key: "account_type",
        label: "Account Type",
        label_bn: "একাউন্ট টাইপ",
        type: "select",
        options: [
          { value: "personal", label: "Personal" },
          { value: "agent", label: "Agent" },
          { value: "merchant", label: "Merchant" },
        ],
        required: true,
      },
      {
        key: "qr_code_url",
        label: "Payment QR Code",
        label_bn: "পেমেন্ট QR কোড",
        type: "image",
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },
  {
    method_id: "upay",
    name: "Upay",
    name_bn: "উপায়",
    icon: "💸",
    default_logo: "/logos/upay.png?v=2",
    description: "Pay with Upay mobile wallet",
    description_bn: "উপায় মোবাইল ওয়ালেটে পেমেন্ট করুন",
    type: "mobile",
    instructions: "Send payment to the Upay number shown and enter transaction ID",
    instructions_bn: "প্রদর্শিত উপায় নম্বরে পেমেন্ট করুন এবং ট্রানজেকশন আইডি দিন",
    configFields: [
      {
        key: "account_number",
        label: "Account Number",
        label_bn: "একাউন্ট নম্বর",
        type: "text",
        placeholder: "01XXXXXXXXX",
        required: true,
      },
      {
        key: "account_type",
        label: "Account Type",
        label_bn: "একাউন্ট টাইপ",
        type: "select",
        options: [
          { value: "personal", label: "Personal" },
          { value: "agent", label: "Agent" },
          { value: "merchant", label: "Merchant" },
        ],
        required: true,
      },
      {
        key: "qr_code_url",
        label: "Payment QR Code",
        label_bn: "পেমেন্ট QR কোড",
        type: "image",
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },

  // ─── Payment Gateways ────────────────────────────────────────────────────────
  {
    method_id: "sslcommerz",
    name: "SSLCommerz",
    name_bn: "এসএসএল কমার্জ",
    icon: "💳",
    default_logo: "/logos/sslcommerz.png?v=2",
    description: "Pay with credit/debit card via SSLCommerz",
    description_bn: "SSLCommerz এর মাধ্যমে ক্রেডিট/ডেবিট কার্ডে পেমেন্ট করুন",
    type: "gateway",
    configFields: [
      {
        key: "merchant_id",
        label: "Store ID / Merchant ID",
        label_bn: "স্টোর আইডি / মার্চেন্ট আইডি",
        type: "text",
        placeholder: "your_store_id",
        required: true,
      },
      {
        key: "api_key",
        label: "Store Password / API Key",
        label_bn: "স্টোর পাসওয়ার্ড / API কী",
        type: "password",
        required: true,
      },
      {
        key: "secret_key",
        label: "Secret Key",
        label_bn: "সিক্রেট কী",
        type: "password",
        required: true,
      },
      {
        key: "test_mode",
        label: "Environment",
        label_bn: "এনভায়রনমেন্ট",
        type: "select",
        options: [
          { value: "sandbox", label: "Sandbox (Test)" },
          { value: "live", label: "Live (Production)" },
        ],
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },
  {
    method_id: "shurjopay",
    name: "ShurjoPay",
    name_bn: "শুরজোপে",
    icon: "💳",
    default_logo: "/logos/shurjopay.png?v=2",
    description: "Pay via ShurjoPay payment gateway",
    description_bn: "ShurjoPay পেমেন্ট গেটওয়ে দিয়ে পেমেন্ট করুন",
    type: "gateway",
    configFields: [
      {
        key: "merchant_id",
        label: "Merchant Username",
        label_bn: "মার্চেন্ট ইউজারনেম",
        type: "text",
        placeholder: "your_merchant_username",
        required: true,
      },
      {
        key: "api_key",
        label: "Merchant Key / Password",
        label_bn: "মার্চেন্ট কী / পাসওয়ার্ড",
        type: "password",
        required: true,
      },
      {
        key: "test_mode",
        label: "Environment",
        label_bn: "এনভায়রনমেন্ট",
        type: "select",
        options: [
          { value: "sandbox", label: "Sandbox (Test)" },
          { value: "live", label: "Live (Production)" },
        ],
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },
  {
    method_id: "aamarpay",
    name: "aamarPay",
    name_bn: "আমার পে",
    icon: "💳",
    default_logo: "/logos/aamarpay.png?v=2",
    description: "Pay with aamarPay payment gateway",
    description_bn: "aamarPay পেমেন্ট গেটওয়ে দিয়ে পেমেন্ট করুন",
    type: "gateway",
    configFields: [
      {
        key: "merchant_id",
        label: "Store ID",
        label_bn: "স্টোর আইডি",
        type: "text",
        placeholder: "your_store_id",
        required: true,
      },
      {
        key: "api_key",
        label: "Signature Key",
        label_bn: "সিগনেচার কী",
        type: "password",
        required: true,
      },
      {
        key: "test_mode",
        label: "Environment",
        label_bn: "এনভায়রনমেন্ট",
        type: "select",
        options: [
          { value: "sandbox", label: "Sandbox (Test)" },
          { value: "live", label: "Live (Production)" },
        ],
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },
  {
    method_id: "stripe",
    name: "Stripe",
    name_bn: "স্ট্রাইপ",
    icon: "💳",
    default_logo: "/logos/stripe.png?v=2",
    description: "Pay with credit/debit card via Stripe",
    description_bn: "Stripe এর মাধ্যমে ক্রেডিট/ডেবিট কার্ডে পেমেন্ট করুন",
    type: "gateway",
    configFields: [
      {
        key: "merchant_id",
        label: "Publishable Key",
        label_bn: "পাবলিশেবল কী",
        type: "text",
        placeholder: "pk_live_...",
        required: true,
      },
      {
        key: "secret_key",
        label: "Secret Key",
        label_bn: "সিক্রেট কী",
        type: "password",
        placeholder: "sk_live_...",
        required: true,
      },
      {
        key: "api_key",
        label: "Webhook Secret",
        label_bn: "ওয়েবহুক সিক্রেট",
        type: "password",
        placeholder: "whsec_...",
      },
      {
        key: "test_mode",
        label: "Environment",
        label_bn: "এনভায়রনমেন্ট",
        type: "select",
        options: [
          { value: "test", label: "Test Mode" },
          { value: "live", label: "Live (Production)" },
        ],
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },
  {
    method_id: "paypal",
    name: "PayPal",
    name_bn: "পেপাল",
    icon: "🅿️",
    default_logo: "/logos/paypal.png?v=2",
    description: "Pay with PayPal",
    description_bn: "পেপাল দিয়ে পেমেন্ট করুন",
    type: "gateway",
    configFields: [
      {
        key: "merchant_id",
        label: "Client ID",
        label_bn: "ক্লায়েন্ট আইডি",
        type: "text",
        placeholder: "your_client_id",
        required: true,
      },
      {
        key: "secret_key",
        label: "Client Secret",
        label_bn: "ক্লায়েন্ট সিক্রেট",
        type: "password",
        required: true,
      },
      {
        key: "test_mode",
        label: "Environment",
        label_bn: "এনভায়রনমেন্ট",
        type: "select",
        options: [
          { value: "sandbox", label: "Sandbox (Test)" },
          { value: "live", label: "Live (Production)" },
        ],
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },
  {
    method_id: "2checkout",
    name: "2Checkout",
    name_bn: "২চেকআউট",
    icon: "💳",
    default_logo: "/logos/2checkout.png?v=2",
    description: "Pay via 2Checkout payment gateway",
    description_bn: "2Checkout পেমেন্ট গেটওয়ে দিয়ে পেমেন্ট করুন",
    type: "gateway",
    configFields: [
      {
        key: "merchant_id",
        label: "Account Number / Seller ID",
        label_bn: "একাউন্ট নম্বর / সেলার আইডি",
        type: "text",
        placeholder: "your_account_number",
        required: true,
      },
      {
        key: "secret_key",
        label: "Secret Key",
        label_bn: "সিক্রেট কী",
        type: "password",
        required: true,
      },
      {
        key: "test_mode",
        label: "Environment",
        label_bn: "এনভায়রনমেন্ট",
        type: "select",
        options: [
          { value: "sandbox", label: "Sandbox (Test)" },
          { value: "live", label: "Live (Production)" },
        ],
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },
  {
    method_id: "payoneer",
    name: "Payoneer",
    name_bn: "পেওনিয়ার",
    icon: "💳",
    default_logo: "/logos/payoneer.svg?v=2",
    description: "Pay with Payoneer card",
    description_bn: "পেওনিয়ার কার্ড দিয়ে পেমেন্ট করুন",
    type: "gateway",
    configFields: [
      {
        key: "merchant_id",
        label: "Partner ID",
        label_bn: "পার্টনার আইডি",
        type: "text",
        placeholder: "your_partner_id",
        required: true,
      },
      {
        key: "api_key",
        label: "API Username",
        label_bn: "API ইউজারনেম",
        type: "text",
        required: true,
      },
      {
        key: "secret_key",
        label: "API Password",
        label_bn: "API পাসওয়ার্ড",
        type: "password",
        required: true,
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },

  // ─── Manual / Other Methods ───────────────────────────────────────────────────
  {
    method_id: "bank_transfer",
    name: "Bank Transfer",
    name_bn: "ব্যাংক ট্রান্সফার",
    icon: "🏦",
    default_logo: "/logos/bank-transfer.png?v=2",
    description: "Pay via bank transfer (manual)",
    description_bn: "ব্যাংক ট্রান্সফারের মাধ্যমে পেমেন্ট করুন",
    type: "manual",
    instructions: "Transfer to our bank account and enter transaction reference",
    instructions_bn: "আমাদের ব্যাংক একাউন্টে ট্রান্সফার করুন এবং ট্রানজেকশন রেফারেন্স দিন",
    configFields: [
      {
        key: "bank_accounts",
        label: "Bank Accounts",
        label_bn: "ব্যাংক একাউন্ট সমূহ",
        type: "bank_accounts",
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },
  {
    method_id: "cheque",
    name: "Cheque Payment",
    name_bn: "চেক পেমেন্ট",
    icon: "🧾",
    default_logo: "/logos/cheque.png?v=2",
    description: "Pay by cheque deposit or transfer",
    description_bn: "চেক জমা বা ব্যাংক ট্রান্সফারের মাধ্যমে পেমেন্ট করুন",
    type: "manual",
    instructions: "Write a cheque payable to the account shown and deposit to the branch",
    instructions_bn: "প্রদর্শিত একাউন্টে চেক লিখুন এবং শাখায় জমা দিন",
    configFields: [
      {
        key: "payable_to",
        label: "Payable To (Name on Cheque)",
        label_bn: "পেয়েবল টু (চেকে নাম)",
        type: "text",
        placeholder: "Company or Person Name",
        required: true,
      },
      {
        key: "bank_accounts",
        label: "Bank Accounts (Payee Accounts)",
        label_bn: "ব্যাংক একাউন্ট (পেয়ি একাউন্ট)",
        type: "bank_accounts",
      },
      {
        key: "auto_processing_enabled",
        label: "Enable Auto Processing (Future Gateway Integration)",
        label_bn: "অটো প্রসেসিং সক্রিয় করুন (ভবিষ্যৎ গেটওয়ে)",
        type: "switch",
      },
      {
        key: "instructions",
        label: "Custom Instructions for Customer",
        label_bn: "কাস্টমারের জন্য নির্দেশনা",
        type: "textarea",
        placeholder: "Write cheque payable to [Name]. Deposit at any branch of [Bank]...",
      },
      {
        key: "logo_url",
        label: "Custom Logo",
        label_bn: "কাস্টম লোগো",
        type: "image",
      },
    ],
  },
  {
    method_id: "cod",
    name: "Cash on Delivery",
    name_bn: "ক্যাশ অন ডেলিভারি",
    icon: "💵",
    default_logo: "/logos/cod.png?v=2",
    description: "Pay when you receive your order",
    description_bn: "অর্ডার গ্রহণের সময় টাকা দিন",
    type: "manual",
    instructions: "Pay the delivery person when you receive your order",
    instructions_bn: "ডেলিভারি পাওয়ার সময় ডেলিভারি ব্যক্তিকে টাকা দিন",
    configFields: [
      {
        key: "cod_charge_enabled",
        label: "Enable COD Charge",
        label_bn: "COD চার্জ সক্রিয় করুন",
        type: "switch",
      },
      {
        key: "cod_charge_type",
        label: "Charge Type",
        label_bn: "চার্জের ধরন",
        type: "select",
        options: [
          { value: "fixed", label: "Fixed Amount (BDT)" },
          { value: "percentage", label: "Percentage (%)" },
        ],
        dependsOn: "cod_charge_enabled",
      },
      {
        key: "cod_charge_value",
        label: "Charge Amount",
        label_bn: "চার্জের পরিমাণ",
        type: "number",
        placeholder: "0",
        dependsOn: "cod_charge_enabled",
      },
    ],
  },
];

// System method IDs that cannot be deleted
export const SYSTEM_METHOD_IDS = [
  "bkash", "nagad", "rocket", "upay",
  "sslcommerz", "shurjopay", "aamarpay", "stripe", "paypal", "2checkout", "payoneer",
  "bank_transfer", "cheque", "cod",
];

// Get definition by method_id
export function getPaymentMethodDefinition(methodId: string): PaymentMethodDefinition | undefined {
  return PAYMENT_METHOD_DEFINITIONS.find((d) => d.method_id === methodId);
}

// Get methods by type
export function getPaymentMethodsByType(type: PaymentMethodDefinition["type"]): PaymentMethodDefinition[] {
  return PAYMENT_METHOD_DEFINITIONS.filter((d) => d.type === type);
}
