import {
  Layout, Megaphone, Truck, Grid3X3, Package, Star, Zap, Mail, Image,
  HelpCircle, Phone, Shield, Scale, Ruler, FileText, MessageSquare,
  type LucideIcon,
} from "lucide-react";

export interface SectionDef {
  key: string;
  label: string;
  icon: LucideIcon;
  defaultEnabled: boolean;
  defaultTitle?: string;
  defaultSubtitle?: string;
  defaultBadge?: string;
  defaultContent?: Record<string, any>;
  editableFields: ("title" | "subtitle" | "badge" | "image" | "content")[];
  contentSchema?: Record<string, "text" | "textarea" | "number" | "boolean" | "json" | "faq_list" | "card_list" | "section_list" | "step_list" | "string_list" | "size_table" | "shipping_rate_list" | "courier_list" | "link_list" | "social_link_list" | "image_upload">;
}

export interface PageDef {
  slug: string;
  label: string;
  icon: LucideIcon;
  storePath: string;
  sections: SectionDef[];
}

export const siteContentRegistry: PageDef[] = [
  {
    slug: "homepage",
    label: "Homepage",
    icon: Layout,
    storePath: "/",
    sections: [
      {
        key: "hero_carousel",
        label: "Hero Carousel",
        icon: Image,
        defaultEnabled: true,
        editableFields: ["content"],
        contentSchema: { autoplay: "boolean", autoplay_delay: "number", show_arrows: "boolean" },
        defaultContent: { autoplay: true, autoplay_delay: 5000, show_arrows: true },
      },
      {
        key: "feature_bar",
        label: "Feature Bar (Trust Badges)",
        icon: Truck,
        defaultEnabled: true,
        editableFields: ["content"],
        contentSchema: { features: "card_list" },
      },
      {
        key: "brand_marquee",
        label: "Brand Logos Marquee",
        icon: Star,
        defaultEnabled: true,
        editableFields: [],
      },
      {
        key: "categories_grid",
        label: "Categories Grid",
        icon: Grid3X3,
        defaultEnabled: true,
        defaultTitle: "Shop by Category",
        editableFields: ["title", "subtitle", "content"],
        contentSchema: { categories: "card_list" },
      },
      {
        key: "new_arrivals",
        label: "New Arrivals",
        icon: Package,
        defaultEnabled: true,
        defaultTitle: "New Arrivals",
        defaultBadge: "New",
        editableFields: ["title", "subtitle", "badge", "content"],
        contentSchema: { product_count: "number" },
        defaultContent: { product_count: 8 },
      },
      {
        key: "promo_banners",
        label: "Promo Banners",
        icon: Layout,
        defaultEnabled: true,
        editableFields: ["content"],
        contentSchema: { banners: "card_list" },
      },
      {
        key: "trending_products",
        label: "Trending Products",
        icon: Star,
        defaultEnabled: true,
        editableFields: ["content"],
        contentSchema: { count: "number" },
        defaultContent: { count: 4 },
      },
      {
        key: "best_sellers",
        label: "Best Sellers",
        icon: Star,
        defaultEnabled: true,
        defaultTitle: "Best Sellers",
        editableFields: ["title", "subtitle", "badge"],
      },
      {
        key: "flash_sale",
        label: "Flash Sale (Countdown)",
        icon: Zap,
        defaultEnabled: true,
        defaultTitle: "Flash Sale",
        defaultBadge: "⚡ Flash Sale",
        editableFields: ["title", "subtitle", "badge", "content"],
        contentSchema: { end_time: "text", product_count: "number" },
        defaultContent: { product_count: 4 },
      },
      {
        key: "testimonials",
        label: "Testimonials",
        icon: MessageSquare,
        defaultEnabled: true,
        defaultTitle: "What Customers Say",
        editableFields: ["title", "subtitle", "content"],
        contentSchema: { testimonials: "card_list" },
      },
      {
        key: "recently_viewed",
        label: "Recently Viewed",
        icon: Package,
        defaultEnabled: true,
        editableFields: [],
      },
      {
        key: "newsletter",
        label: "Newsletter",
        icon: Mail,
        defaultEnabled: true,
        defaultTitle: "Subscribe Newsletter",
        editableFields: ["title", "content"],
        contentSchema: { placeholder: "text", button_text: "text" },
      },
      {
        key: "announcement",
        label: "Announcement Bar",
        icon: Megaphone,
        defaultEnabled: false,
        editableFields: ["title", "content"],
        contentSchema: { link: "text", link_text: "text" },
      },
    ],
  },
  {
    slug: "faq",
    label: "FAQ Page",
    icon: HelpCircle,
    storePath: "/faq",
    sections: [
      {
        key: "main_content",
        label: "Page Content",
        icon: FileText,
        defaultEnabled: true,
        defaultTitle: "Frequently Asked Questions",
        defaultSubtitle: "Find answers to the most common questions about our products, shipping, payments, and more.",
        editableFields: ["title", "subtitle", "content"],
        contentSchema: { hero_badge: "text", faqs: "faq_list" },
        defaultContent: {
          hero_badge: "Help Center",
          faqs: [
            { question: "How do I track my order?", answer: "You can track your order by visiting our Track Order page and entering your order number. You'll receive tracking updates via email and SMS.", category: "orders" },
            { question: "How long does delivery take?", answer: "Inside Dhaka delivery takes 1-2 business days. Outside Dhaka takes 3-5 business days. You'll get an estimated delivery date at checkout.", category: "shipping" },
            { question: "What payment methods do you accept?", answer: "We accept bKash, Nagad, Rocket, bank transfers, and Cash on Delivery (COD). All digital payments are secured and encrypted.", category: "payment" },
            { question: "Can I pay Cash on Delivery?", answer: "Yes! COD is available for most locations. A small COD fee may apply depending on your area.", category: "payment" },
            { question: "How do I return a product?", answer: "You can initiate a return within 7 days of delivery from your account dashboard. The product must be unused and in original packaging.", category: "returns" },
            { question: "When will I get my refund?", answer: "Refunds are processed within 5-7 business days after we receive and inspect the returned item. The amount will be credited to your original payment method.", category: "returns" },
            { question: "How do I find my size?", answer: "Check our Size Guide page for detailed measurements. Each product page also has a size chart specific to that item.", category: "general" },
            { question: "Can I change or cancel my order?", answer: "You can modify or cancel your order within 1 hour of placing it. After that, the order enters processing and cannot be changed.", category: "orders" },
            { question: "How do I create an account?", answer: "Click the Login button at the top of the page and select 'Sign Up'. You can register with your email address and set a password.", category: "account" },
            { question: "Is my personal information safe?", answer: "Yes, we use industry-standard encryption to protect your data. We never share your personal information with third parties without consent.", category: "account" },
            { question: "Do you offer free shipping?", answer: "Yes! Orders above ৳1,500 qualify for free shipping inside Dhaka. Outside Dhaka, free shipping applies on orders above ৳2,500.", category: "shipping" },
            { question: "How do I apply a coupon code?", answer: "Enter your coupon code in the 'Promo Code' field at checkout and click Apply. The discount will be reflected in your order total.", category: "payment" },
          ],
        },
      },
    ],
  },
  {
    slug: "contact",
    label: "Contact Page",
    icon: Phone,
    storePath: "/contact",
    sections: [
      {
        key: "main_content",
        label: "Page Content",
        icon: FileText,
        defaultEnabled: true,
        defaultTitle: "Contact Us",
        defaultSubtitle: "Have a question or need help? We'd love to hear from you.",
        editableFields: ["title", "subtitle", "content"],
        contentSchema: { cards: "card_list", form_title: "text", faqs: "faq_list" },
        defaultContent: {
          form_title: "Send Us a Message",
          cards: [
            { icon: "map-pin", title: "Visit Us", text: "Dhaka, Bangladesh" },
            { icon: "phone", title: "Call Us", text: "+880 1XXX-XXXXXX" },
            { icon: "mail", title: "Email Us", text: "hello@gmail.com" },
            { icon: "clock", title: "Business Hours", text: "Sun - Thu: 10AM - 8PM\nFri - Sat: Closed" },
          ],
          faqs: [
            { q: "How can I track my order?", a: "You can track your order by going to your Account > Orders section or using the Track Order page with your order number.", category: "orders" },
            { q: "What is your return policy?", a: "We accept returns within 7 days of delivery. Items must be in original condition with tags attached. Visit our Returns page for more details.", category: "returns" },
            { q: "How long does shipping take?", a: "Standard shipping takes 3-5 business days within Dhaka and 5-7 business days outside Dhaka.", category: "shipping" },
            { q: "How do I contact customer support?", a: "You can reach us through this contact form, via phone, email, or WhatsApp. We respond within 24 hours.", category: "general" },
            { q: "Can I change or cancel my order?", a: "You can modify or cancel your order within 1 hour of placing it. After that, please contact us immediately.", category: "orders" },
          ],
        },
      },
    ],
  },
  {
    slug: "privacy",
    label: "Privacy Policy",
    icon: Shield,
    storePath: "/privacy",
    sections: [
      {
        key: "main_content",
        label: "Page Content",
        icon: FileText,
        defaultEnabled: true,
        defaultTitle: "Privacy Policy",
        defaultSubtitle: "Your privacy is important to us. Learn how we collect, use, and protect your personal information.",
        editableFields: ["title", "subtitle", "content"],
        contentSchema: { sections: "section_list", last_updated: "text" },
        defaultContent: {
          last_updated: "January 2024",
          sections: [
            {
              heading: "Information We Collect",
              body: "We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.",
              list: ["Personal details (name, email, phone number, address)", "Payment information (processed securely, never stored on our servers)", "Order history and preferences", "Device information and browsing data"],
              icon: "database",
            },
            {
              heading: "How We Use Your Information",
              body: "We use the information we collect to provide, maintain, and improve our services.",
              list: ["Process and fulfill your orders", "Send order confirmations and shipping updates", "Respond to your comments and questions", "Personalize your shopping experience", "Send promotional communications (with your consent)"],
              icon: "eye",
            },
            {
              heading: "Cookies & Tracking",
              body: "We use cookies and similar tracking technologies to enhance your browsing experience and analyze site traffic.",
              list: ["Essential cookies for site functionality", "Analytics cookies to understand usage patterns", "Preference cookies to remember your settings"],
              extra: "You can manage cookie preferences through your browser settings at any time.",
              icon: "cookie",
            },
            {
              heading: "Your Rights",
              body: "You have the right to access, correct, or delete your personal information at any time.",
              list: ["Request a copy of your personal data", "Update or correct inaccurate information", "Request deletion of your account and data", "Opt out of marketing communications", "Withdraw consent for data processing"],
              icon: "usercheck",
            },
            {
              heading: "Data Security",
              body: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, or destruction.",
              list: ["SSL/TLS encryption for all data transfers", "Secure payment processing through trusted providers", "Regular security audits and updates", "Limited employee access to personal data"],
              icon: "shield",
            },
            {
              heading: "Contact Us",
              body: "If you have any questions about this Privacy Policy or our data practices, please contact us.",
              extra: "Email: hello@gmail.com",
              icon: "mail",
            },
          ],
        },
      },
    ],
  },
  {
    slug: "terms",
    label: "Terms & Conditions",
    icon: Scale,
    storePath: "/terms",
    sections: [
      {
        key: "main_content",
        label: "Page Content",
        icon: FileText,
        defaultEnabled: true,
        defaultTitle: "Terms of Service",
        defaultSubtitle: "Please read these terms carefully before using our services.",
        editableFields: ["title", "subtitle", "content"],
        contentSchema: { sections: "section_list", last_updated: "text" },
        defaultContent: {
          last_updated: "January 2024",
          sections: [
            {
              heading: "Account Terms",
              body: "By creating an account on our platform, you agree to the following terms and conditions.",
              list: ["You must be at least 18 years old to create an account", "You are responsible for maintaining account security", "One account per person — duplicate accounts may be removed", "You must provide accurate and up-to-date information"],
              icon: "usercheck",
            },
            {
              heading: "Orders & Payments",
              body: "All orders are subject to product availability and confirmation of the order price.",
              list: ["Prices are displayed in BDT and include applicable taxes", "We reserve the right to refuse or cancel any order", "Payment must be completed before order processing", "Digital payment transactions are processed through secure third-party providers"],
              icon: "creditcard",
            },
            {
              heading: "Shipping & Delivery",
              body: "We strive to deliver your orders within the estimated delivery time, but delays may occasionally occur.",
              list: ["Delivery times are estimates, not guarantees", "Shipping costs are calculated at checkout based on location", "Risk of loss transfers to you upon delivery", "You must provide accurate delivery address information"],
              icon: "truck",
            },
            {
              heading: "Returns & Refunds",
              body: "We want you to be completely satisfied with your purchase. Our return policy allows returns within the specified period.",
              list: ["Items must be returned within 7 days of delivery", "Products must be unused and in original packaging", "Refunds are processed within 5-7 business days", "Certain items (undergarments, customized products) are non-returnable"],
              icon: "rotateccw",
            },
            {
              heading: "Intellectual Property",
              body: "All content on this website, including text, graphics, logos, and images, is the property of our company and protected by intellectual property laws.",
              list: ["Content may not be reproduced without written permission", "Our trademarks may not be used without authorization", "User-generated content grants us a non-exclusive license"],
              icon: "bookopen",
            },
            {
              heading: "Limitation of Liability",
              body: "To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, or consequential damages arising from your use of our services.",
              extra: "This limitation applies to damages of any kind, including but not limited to, loss of revenue, data, or profits.",
              icon: "shieldcheck",
            },
          ],
        },
      },
    ],
  },
  {
    slug: "returns",
    label: "Returns & Exchange",
    icon: Package,
    storePath: "/returns",
    sections: [
      {
        key: "main_content",
        label: "Page Content",
        icon: FileText,
        defaultEnabled: true,
        defaultTitle: "Returns & Exchange Policy",
        defaultSubtitle: "Easy returns and exchanges within 7 days. Your satisfaction is our priority.",
        editableFields: ["title", "subtitle", "content"],
        contentSchema: { eligible: "string_list", not_eligible: "string_list", steps: "step_list", refund_info: "string_list", exchange_text: "textarea", faqs: "faq_list" },
        defaultContent: {
          eligible: [
            "Unused items with original tags and packaging",
            "Items received damaged or defective",
            "Wrong item received",
            "Items that don't match the product description",
            "Items returned within 7 days of delivery",
          ],
          not_eligible: [
            "Items used, washed, or altered",
            "Undergarments and intimate apparel",
            "Items without original tags or packaging",
            "Items returned after 7 days of delivery",
            "Gift cards and vouchers",
            "Items marked as 'Final Sale'",
          ],
          steps: [
            { title: "Contact Us", text: "Reach out via our Contact page or call us to initiate a return request." },
            { title: "Get Approval", text: "Our team will review your request and send you a return authorization within 24 hours." },
            { title: "Ship the Item", text: "Pack the item securely with original tags and packaging, then ship it to us." },
            { title: "Refund Processed", text: "Once we receive and inspect the item, your refund will be processed within 3-5 business days." },
          ],
          refund_info: [
            "Refunds are processed within 3-5 business days after inspection",
            "Original payment method will be refunded",
            "Shipping charges are non-refundable unless item was defective",
            "You will receive an email confirmation once refund is processed",
            "Bank processing time may add 2-3 additional business days",
          ],
          exchange_text: "We offer hassle-free exchanges for different sizes or colors, subject to stock availability. Contact us within 7 days of delivery to arrange an exchange. The exchanged item must be unused with original tags and packaging.",
          faqs: [
            { question: "How long do I have to return an item?", answer: "You have 7 days from the date of delivery to initiate a return request. Items must be unused and in original packaging.", category: "Returns" },
            { question: "How do I start a return?", answer: "Contact us through our Contact page, call us, or visit your Account > Returns section if you're a registered user.", category: "Returns" },
            { question: "Can I exchange instead of return?", answer: "Yes! We offer exchanges for different sizes or colors, subject to availability. Contact us to arrange an exchange.", category: "Exchange" },
            { question: "Who pays for return shipping?", answer: "If the item is defective or we made an error, we cover shipping. For other returns, the customer is responsible for shipping costs.", category: "Shipping" },
            { question: "When will I get my refund?", answer: "Refunds are processed within 3-5 business days after we receive and inspect the returned item. Bank processing may add 2-3 days.", category: "Refund" },
            { question: "Can I return a sale item?", answer: "Items marked as 'Final Sale' cannot be returned. Other discounted items follow the standard return policy.", category: "Returns" },
          ],
        },
      },
    ],
  },
  {
    slug: "shipping-info",
    label: "Shipping Info",
    icon: Truck,
    storePath: "/shipping-info",
    sections: [
      {
        key: "main_content",
        label: "Page Content",
        icon: FileText,
        defaultEnabled: true,
        defaultTitle: "Shipping Information",
        defaultSubtitle: "Everything you need to know about our delivery process",
        editableFields: ["title", "subtitle", "content"],
        contentSchema: { delivery_options: "step_list", delivery_areas: "step_list", processing_text: "textarea", tracking_text: "textarea", notes: "string_list", faqs: "faq_list", shipping_costs: "shipping_rate_list", courier_partners: "courier_list" },
        defaultContent: {
          delivery_options: [
            { title: "Standard Delivery", text: "3-5 business days for orders within Dhaka. 5-7 business days for outside Dhaka." },
            { title: "Express Delivery", text: "1-2 business days. Available for Dhaka city only. Additional charges apply." },
            { title: "Same Day Delivery", text: "Order before 12 PM for same-day delivery within Dhaka. Subject to availability." },
          ],
          delivery_areas: [
            { title: "Inside Dhaka", text: "All areas within Dhaka city corporation. Delivery within 2-3 business days." },
            { title: "Outside Dhaka", text: "All major districts across Bangladesh. Delivery within 5-7 business days." },
            { title: "Remote Areas", text: "Char, Haor, and hill tract areas may take 7-10 business days." },
          ],
          shipping_costs: [
            { area: "inside_dhaka", label: "Inside Dhaka", cost: 60, days: "2-3 days" },
            { area: "outside_dhaka", label: "Outside Dhaka (Division Cities)", cost: 120, days: "3-5 days" },
            { area: "suburban", label: "Suburban Areas", cost: 150, days: "5-7 days" },
            { area: "remote", label: "Remote / Hill Tract Areas", cost: 200, days: "7-10 days" },
          ],
          processing_text: "Orders are typically processed within 24 hours during business days. Orders placed on weekends or holidays will be processed on the next business day.",
          tracking_text: "Once your order is shipped, you'll receive an SMS and email with your tracking number. Use our Track Order page to get real-time updates on your delivery status.",
          notes: [
            "Delivery times are estimates and may vary during peak seasons or holidays.",
            "Cash on delivery (COD) is available for all areas.",
            "Free shipping on orders above ৳2,000.",
            "Fragile items are packaged with extra care at no additional cost.",
          ],
          courier_partners: [
            { name: "Steadfast", logo: "/logos/steadfast.svg" },
            { name: "Pathao", logo: "/logos/pathao.svg" },
            { name: "RedX", logo: "/logos/redx.svg" },
            { name: "Paperfly", logo: "/logos/paperfly.svg" },
            { name: "eCourier", logo: "/logos/ecourier.svg" },
          ],
          faqs: [
            { q: "How much does shipping cost?", a: "Shipping costs vary by location. Inside Dhaka starts at ৳60, and outside Dhaka starts at ৳120. Free shipping on orders over ৳2,000.", category: "cost" },
            { q: "How long does delivery take?", a: "Inside Dhaka: 2-3 business days. Outside Dhaka: 3-7 business days. Remote areas may take up to 10 days.", category: "time" },
            { q: "Can I track my order?", a: "Yes! Once your order is shipped, you'll receive a tracking number via SMS and email. You can also track it on our Track Order page.", category: "tracking" },
            { q: "Do you deliver outside Bangladesh?", a: "Currently we only deliver within Bangladesh. International shipping is coming soon!", category: "area" },
            { q: "What if my package is damaged?", a: "If your package arrives damaged, please contact us within 24 hours with photos. We'll arrange a replacement or refund.", category: "issue" },
            { q: "Can I change my delivery address?", a: "You can change your delivery address before the order is shipped. Contact our support team immediately.", category: "issue" },
          ],
        },
      },
    ],
  },
  {
    slug: "size-guide",
    label: "Size Guide",
    icon: Ruler,
    storePath: "/size-guide",
    sections: [
      {
        key: "main_content",
        label: "Page Content",
        icon: FileText,
        defaultEnabled: true,
        defaultTitle: "Size Guide",
        defaultSubtitle: "Find your perfect fit with our comprehensive size charts and measurement guide.",
        editableFields: ["title", "subtitle", "content"],
        contentSchema: { mens_sizes: "size_table", womens_sizes: "size_table", how_to_measure: "step_list", tips: "string_list", faqs: "faq_list" },
        defaultContent: {
          mens_sizes: [
            { size: "S", chest: "36\"", waist: "30\"", hip: "37\"", chest_cm: "91", waist_cm: "76", hip_cm: "94" },
            { size: "M", chest: "38\"", waist: "32\"", hip: "39\"", chest_cm: "97", waist_cm: "81", hip_cm: "99" },
            { size: "L", chest: "40\"", waist: "34\"", hip: "41\"", chest_cm: "102", waist_cm: "86", hip_cm: "104" },
            { size: "XL", chest: "42\"", waist: "36\"", hip: "43\"", chest_cm: "107", waist_cm: "91", hip_cm: "109" },
            { size: "XXL", chest: "44\"", waist: "38\"", hip: "45\"", chest_cm: "112", waist_cm: "97", hip_cm: "114" },
          ],
          womens_sizes: [
            { size: "S", bust: "32\"", waist: "26\"", hip: "35\"", bust_cm: "81", waist_cm: "66", hip_cm: "89" },
            { size: "M", bust: "34\"", waist: "28\"", hip: "37\"", bust_cm: "86", waist_cm: "71", hip_cm: "94" },
            { size: "L", bust: "36\"", waist: "30\"", hip: "39\"", bust_cm: "91", waist_cm: "76", hip_cm: "99" },
            { size: "XL", bust: "38\"", waist: "32\"", hip: "41\"", bust_cm: "97", waist_cm: "81", hip_cm: "104" },
            { size: "XXL", bust: "40\"", waist: "34\"", hip: "43\"", bust_cm: "102", waist_cm: "86", hip_cm: "109" },
          ],
          how_to_measure: [
            { title: "Chest / Bust", text: "Measure around the fullest part of your chest/bust, keeping the tape parallel to the floor." },
            { title: "Waist", text: "Measure around the narrowest part of your natural waistline, usually just above the belly button." },
            { title: "Hip", text: "Stand with feet together and measure around the fullest part of your hips and buttocks." },
          ],
          tips: [
            "Wear lightweight clothing or measure over undergarments for the most accurate results",
            "Keep the measuring tape snug but not tight — you should be able to fit one finger underneath",
            "If you're between sizes, we recommend sizing up for a more comfortable fit",
            "For tops, focus on chest/bust measurement; for bottoms, focus on waist and hip",
            "Measurements may vary slightly between styles — check product-specific size notes if available",
          ],
          faqs: [
            { question: "What if I'm between two sizes?", answer: "If you're between sizes, we recommend going with the larger size for a comfortable fit. You can always exchange if it doesn't fit right.", category: "Fit" },
            { question: "How do I measure myself at home?", answer: "Use a soft measuring tape. Stand straight and measure around the fullest part of your body. For best results, have someone else take the measurements for you.", category: "Measuring" },
            { question: "Do sizes vary between products?", answer: "Sizes may vary slightly between different styles and product types. Always check the product-specific size notes when available.", category: "Fit" },
            { question: "Can I exchange if the size doesn't fit?", answer: "Yes! We offer free exchanges within 7 days of delivery. Visit our Returns page for more details.", category: "Exchange" },
            { question: "Are measurements in cm or inches?", answer: "Our size charts show both cm and inches. Use the toggle on the size chart to switch between units.", category: "Measuring" },
          ],
        },
      },
    ],
  },
];

// Header & Footer definitions — used by Site Settings page, NOT Content Manager
export const siteSettingsRegistry: PageDef[] = [
  {
    slug: "header",
    label: "Header",
    icon: Layout,
    storePath: "/",
    sections: [
      {
        key: "main_content",
        label: "Header Settings",
        icon: Layout,
        defaultEnabled: true,
        editableFields: ["content"],
        contentSchema: {
          store_name: "text",
          store_logo: "image_upload",
          store_favicon: "image_upload",
        },
        defaultContent: {},
      },
    ],
  },
  {
    slug: "footer",
    label: "Footer",
    icon: FileText,
    storePath: "/",
    sections: [
      {
        key: "main_content",
        label: "Footer Settings",
        icon: FileText,
        defaultEnabled: true,
        editableFields: ["content"],
        contentSchema: {
          store_description: "textarea",
          store_email: "text",
          store_phone: "text",
          store_address: "text",
          store_city: "text",
          store_postal_code: "text",
          social_links: "social_link_list",
          shop_links: "link_list",
          help_links: "link_list",
          copyright_text: "text",
        },
        defaultContent: {
          store_description: "Premium fashion for the modern Bangladeshi. Quality meets style at affordable prices.",
          store_email: "contact@democlothing.com",
          store_phone: "+880 1700-000000",
          store_address: "123 Fashion Street, Gulshan",
          store_city: "Dhaka",
          store_postal_code: "1212",
          social_links: [
            { label: "Facebook", href: "https://facebook.com/", logo: "" },
            { label: "Pinterest", href: "https://pinterest.com/", logo: "" },
            { label: "Twitter", href: "https://twitter.com/", logo: "" },
            { label: "YouTube", href: "https://youtube.com/", logo: "" },
          ],
          shop_links: [
            { label: "All Products", href: "/products" },
            { label: "New Arrivals", href: "/products?filter=new" },
            { label: "Sale", href: "/products?filter=sale" },
          ],
          help_links: [
            { label: "Contact Us", href: "/contact" },
            { label: "Track Order", href: "/track-order" },
            { label: "FAQs", href: "/faq" },
            { label: "Shipping Info", href: "/shipping-info" },
            { label: "Returns & Exchange", href: "/returns" },
            { label: "Size Guide", href: "/size-guide" },
          ],
          copyright_text: "All rights reserved.",
        },
      },
    ],
  },
];

// Combined lookup: checks both registries
function getAllPageDefs(): PageDef[] {
  return [...siteContentRegistry, ...siteSettingsRegistry];
}

export function getPageDef(slug: string): PageDef | undefined {
  return getAllPageDefs().find((p) => p.slug === slug);
}

export function getSectionDef(pageSlug: string, sectionKey: string): SectionDef | undefined {
  return getPageDef(pageSlug)?.sections.find((s) => s.key === sectionKey);
}
