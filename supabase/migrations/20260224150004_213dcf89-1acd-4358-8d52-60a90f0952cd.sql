
-- Create page_contents table for storing editable content for store pages
CREATE TABLE public.page_contents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_slug TEXT NOT NULL UNIQUE,
  title TEXT,
  subtitle TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_contents ENABLE ROW LEVEL SECURITY;

-- Public read access (store pages need to read)
CREATE POLICY "Anyone can read page contents"
ON public.page_contents FOR SELECT
USING (true);

-- Only authenticated admins can modify (we'll rely on app-level role checks)
CREATE POLICY "Authenticated users can update page contents"
ON public.page_contents FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert page contents"
ON public.page_contents FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete page contents"
ON public.page_contents FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Seed default content for all store pages
INSERT INTO public.page_contents (page_slug, title, subtitle, content) VALUES
('faq', 'Frequently Asked Questions', 'Find answers to common questions about our products, shipping, returns, and more.', '{
  "faqs": [
    {"question": "How do I track my order?", "answer": "You can track your order by visiting our Track Order page and entering your order number. You''ll receive tracking updates via email and SMS once your order is shipped."},
    {"question": "What payment methods do you accept?", "answer": "We accept bKash, Nagad, Rocket, bank transfers, and Cash on Delivery (COD). All online payments are secure and encrypted."},
    {"question": "How long does delivery take?", "answer": "Delivery times vary by location. Inside Dhaka: 1-2 business days. Outside Dhaka: 3-5 business days. Express delivery options are available at checkout."},
    {"question": "What is your return policy?", "answer": "We offer a 7-day return policy for unused items in original packaging. Please visit our Returns & Exchange page for detailed instructions."},
    {"question": "How do I find my size?", "answer": "Check our Size Guide page for detailed measurements. If you''re between sizes, we recommend going up a size for a comfortable fit."},
    {"question": "Can I cancel my order?", "answer": "Orders can be cancelled within 2 hours of placement. After that, please wait for delivery and initiate a return if needed."},
    {"question": "Do you offer international shipping?", "answer": "Currently, we only ship within Bangladesh. We''re working on expanding to international markets soon!"},
    {"question": "How can I contact customer support?", "answer": "You can reach us via email at hello@ektaclothing.com, call us at +880 1XXX-XXXXXX, or use the contact form on our Contact page."},
    {"question": "Are the product colors accurate?", "answer": "We try our best to display accurate colors, but slight variations may occur due to screen settings. If you have any concerns, feel free to contact us before ordering."},
    {"question": "Do you have a physical store?", "answer": "Yes! Visit us at 123 Fashion Street, Dhanmondi, Dhaka 1205. Our store is open Saturday to Thursday, 10AM - 8PM."}
  ]
}'::jsonb),

('contact', 'Contact Us', 'Have questions? We''d love to hear from you. Send us a message and we''ll respond as soon as possible.', '{
  "form_title": "Send us a message",
  "cards": [
    {"icon": "map-pin", "title": "Visit Us", "text": "123 Fashion Street, Dhanmondi\nDhaka 1205, Bangladesh"},
    {"icon": "phone", "title": "Call Us", "text": "+880 1XXX-XXXXXX"},
    {"icon": "mail", "title": "Email Us", "text": "hello@ektaclothing.com"},
    {"icon": "clock", "title": "Business Hours", "text": "Saturday - Thursday: 10AM - 8PM\nFriday: Closed"}
  ]
}'::jsonb),

('privacy', 'Privacy Policy', 'Last updated: January 2024', '{
  "sections": [
    {"heading": "1. Information We Collect", "body": "We collect information you provide directly to us, such as:", "list": ["Name, email address, and phone number", "Shipping and billing addresses", "Payment information (processed securely by our payment partners)", "Order history and preferences", "Communications with our customer service team"]},
    {"heading": "2. How We Use Your Information", "body": "We use the information we collect to:", "list": ["Process and fulfill your orders", "Send order confirmations and shipping updates", "Respond to your questions and requests", "Send promotional emails (with your consent)", "Improve our products and services", "Prevent fraud and maintain security"]},
    {"heading": "3. Information Sharing", "body": "We do not sell your personal information. We may share your information with:", "list": ["Shipping partners to deliver your orders", "Payment processors to handle transactions", "Service providers who assist our operations", "Legal authorities when required by law"]},
    {"heading": "4. Data Security", "body": "We implement appropriate security measures to protect your personal information. All payment transactions are encrypted using SSL technology. However, no method of transmission over the internet is 100% secure."},
    {"heading": "5. Cookies", "body": "We use cookies to enhance your browsing experience, remember your preferences, and analyze site traffic. You can control cookies through your browser settings."},
    {"heading": "6. Your Rights", "body": "You have the right to:", "list": ["Access your personal information", "Correct inaccurate data", "Request deletion of your data", "Opt-out of marketing communications"]},
    {"heading": "7. Contact Us", "body": "If you have questions about this Privacy Policy, please contact us at:\nEmail: hello@ektaclothing.com\nPhone: +880 1XXX-XXXXXX\nAddress: 123 Fashion Street, Dhanmondi, Dhaka 1205"}
  ]
}'::jsonb),

('terms', 'Terms of Service', 'Last updated: January 2024', '{
  "sections": [
    {"heading": "1. Acceptance of Terms", "body": "By accessing and using Ekta Clothing''s website, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website."},
    {"heading": "2. Products and Pricing", "body": "All products are subject to availability. We reserve the right to:", "list": ["Limit quantities available for purchase", "Discontinue products at any time", "Correct pricing errors", "Refuse orders in cases of suspected fraud"], "extra": "Prices are displayed in Bangladeshi Taka (৳) and include applicable taxes."},
    {"heading": "3. Orders and Payment", "body": "When you place an order, you agree to provide accurate and complete information. Payment must be made at the time of order unless Cash on Delivery is selected. We accept bKash, Nagad, Rocket, bank transfers, and COD."},
    {"heading": "4. Shipping and Delivery", "body": "We will make every effort to deliver your order within the estimated timeframe. However, delivery dates are not guaranteed. Risk of loss passes to you upon delivery. Please refer to our Shipping Information page for details."},
    {"heading": "5. Returns and Refunds", "body": "We accept returns within 7 days of delivery for eligible items. Please review our Returns & Exchange policy for complete details on eligibility and procedures."},
    {"heading": "6. Intellectual Property", "body": "All content on this website, including images, text, logos, and designs, is the property of Ekta Clothing and is protected by copyright laws. You may not use, reproduce, or distribute any content without our written permission."},
    {"heading": "7. User Accounts", "body": "You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Notify us immediately of any unauthorized use."},
    {"heading": "8. Limitation of Liability", "body": "Ekta Clothing shall not be liable for any indirect, incidental, or consequential damages arising from your use of our website or products. Our liability is limited to the amount paid for the specific product in question."},
    {"heading": "9. Changes to Terms", "body": "We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the website constitutes acceptance of the modified terms."},
    {"heading": "10. Contact Information", "body": "For questions about these Terms of Service, please contact us at:\nEmail: hello@ektaclothing.com\nPhone: +880 1XXX-XXXXXX\nAddress: 123 Fashion Street, Dhanmondi, Dhaka 1205"}
  ]
}'::jsonb),

('returns', 'Returns & Exchange', 'We want you to be completely satisfied with your purchase. Here''s everything you need to know about returns and exchanges.', '{
  "policy_title": "7-Day Return Policy",
  "policy_text": "You have 7 days from the delivery date to return or exchange your items. Items must be unused, unwashed, and in original packaging with all tags attached.",
  "eligible": ["Unused items in original condition", "Items with original tags and packaging", "Wrong size or color received", "Defective or damaged products", "Items that don''t match the description"],
  "not_eligible": ["Items worn, washed, or altered", "Items without original tags", "Intimate wear and undergarments", "Sale items marked as final sale", "Items returned after 7 days"],
  "steps": [
    {"title": "Contact Us", "text": "Email us at hello@ektaclothing.com with your order number and reason for return"},
    {"title": "Pack & Ship", "text": "Pack items securely in original packaging. We''ll arrange pickup or provide shipping label"},
    {"title": "Get Refund", "text": "Refund processed within 5-7 business days after we receive and inspect items"}
  ],
  "exchange_text": "Want a different size or color? We offer free exchanges! Simply contact us within 7 days of delivery and we''ll arrange the exchange. If the new item costs more, you''ll pay the difference. If it costs less, we''ll refund the difference.",
  "refund_info": [
    "Refunds are processed to the original payment method",
    "bKash/Nagad refunds: 2-3 business days",
    "Bank transfer refunds: 5-7 business days",
    "Original shipping charges are non-refundable (except for defective items)"
  ]
}'::jsonb),

('shipping-info', 'Shipping Information', 'Everything you need to know about our shipping policies and delivery times.', '{
  "delivery_options": [
    {"title": "Express Delivery", "text": "1-2 business days • ৳80"},
    {"title": "Standard Delivery", "text": "3-5 business days • ৳60"},
    {"title": "Free Shipping", "text": "5-7 business days • Orders over ৳2000"}
  ],
  "delivery_areas": [
    {"title": "Inside Dhaka", "text": "All areas covered with express option available"},
    {"title": "Outside Dhaka", "text": "All 64 districts covered via courier partners"},
    {"title": "Remote Areas", "text": "May take additional 1-2 days"}
  ],
  "processing_text": "Orders placed before 2 PM are processed the same day. Orders placed after 2 PM or on holidays will be processed the next business day. You''ll receive a confirmation email with tracking details once your order ships.",
  "tracking_text": "Once your order ships, you''ll receive an SMS and email with your tracking number. You can track your order status anytime using our Track Order page. Our delivery partners will also contact you before delivery.",
  "notes": [
    "Delivery times are estimates and may vary during peak seasons",
    "Cash on Delivery (COD) is available for all orders",
    "Please ensure someone is available to receive the package",
    "Signature may be required upon delivery"
  ]
}'::jsonb),

('size-guide', 'Size Guide', 'Find your perfect fit with our comprehensive size guide. All measurements are in inches.', '{
  "mens_sizes": [
    {"size": "S", "chest": "36-38", "waist": "28-30", "hip": "36-38"},
    {"size": "M", "chest": "38-40", "waist": "30-32", "hip": "38-40"},
    {"size": "L", "chest": "40-42", "waist": "32-34", "hip": "40-42"},
    {"size": "XL", "chest": "42-44", "waist": "34-36", "hip": "42-44"},
    {"size": "XXL", "chest": "44-46", "waist": "36-38", "hip": "44-46"}
  ],
  "womens_sizes": [
    {"size": "XS", "bust": "32-33", "waist": "24-25", "hip": "34-35"},
    {"size": "S", "bust": "34-35", "waist": "26-27", "hip": "36-37"},
    {"size": "M", "bust": "36-37", "waist": "28-29", "hip": "38-39"},
    {"size": "L", "bust": "38-40", "waist": "30-32", "hip": "40-42"},
    {"size": "XL", "bust": "41-43", "waist": "33-35", "hip": "43-45"}
  ],
  "how_to_measure": [
    {"title": "Chest/Bust", "text": "Measure around the fullest part of your chest/bust, keeping the tape horizontal."},
    {"title": "Waist", "text": "Measure around your natural waistline, the narrowest part of your torso."},
    {"title": "Hip", "text": "Measure around the fullest part of your hips, about 8 inches below your waist."}
  ],
  "tips": [
    "If you''re between sizes, we recommend going up a size for a more comfortable fit",
    "Our clothes are designed with a regular fit unless otherwise noted",
    "Check individual product pages for specific fit recommendations",
    "Still unsure? Contact us and we''ll help you find the perfect size!"
  ]
}'::jsonb),

('testimonials', 'What Our Customers Say', 'Real reviews from real customers', '{
  "testimonials": [
    {"name": "Fatima Rahman", "role": "Regular Customer", "avatar": "F", "rating": 5, "review": "Amazing quality clothes! I ordered a saree and kurti set, both were exactly as shown. The fabric is excellent and stitching is perfect. Will definitely order again!"},
    {"name": "Karim Ahmed", "role": "Verified Buyer", "avatar": "K", "rating": 5, "review": "The panjabi I ordered for Eid was absolutely stunning. Fast delivery, well packed and great quality. My whole family loved it. Highly recommend!"},
    {"name": "Nadia Islam", "role": "Fashion Blogger", "avatar": "N", "rating": 4, "review": "Great selection of women''s clothing. The tops and jeans are very stylish and true to size. Customer service was also very helpful when I had a question."},
    {"name": "Rahim Chowdhury", "role": "Loyal Customer", "avatar": "R", "rating": 5, "review": "Been shopping here for 2 years now. Always consistent quality, fair prices and super fast delivery. The baby collection is absolutely adorable!"},
    {"name": "Sadia Begum", "role": "Verified Buyer", "avatar": "S", "rating": 5, "review": "The accessories collection is amazing! Got a beautiful handbag and matching jewelry set. Both items are premium quality at a very reasonable price."}
  ]
}'::jsonb),

('promo-banners', 'Promotional Banners', NULL, '{
  "banners": [
    {"badge": "Summer 2024", "title": "Summer Collection", "subtitle": "Light & breezy styles for the season", "cta_text": "Shop Now", "cta_link": "/products?filter=new", "image": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=600&fit=crop", "overlay": "rgba(200,100,0,0.3)"},
    {"badge": "Hot Deals", "title": "Up to 50% Off", "subtitle": "Limited time offer on selected items", "cta_text": "Grab Deal", "cta_link": "/products?filter=sale", "image": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=600&fit=crop", "overlay": "rgba(100,0,150,0.4)"}
  ]
}'::jsonb);
