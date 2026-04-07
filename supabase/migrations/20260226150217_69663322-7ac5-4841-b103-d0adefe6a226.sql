
-- Create site_theme_settings table for storing all UI customization
CREATE TABLE public.site_theme_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_theme_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read theme settings (needed for runtime CSS injection)
CREATE POLICY "Anyone can view theme settings"
  ON public.site_theme_settings
  FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage theme settings"
  ON public.site_theme_settings
  FOR ALL
  USING (has_admin_role(auth.uid()));

-- Insert default theme settings
INSERT INTO public.site_theme_settings (setting_key, setting_value, category, description) VALUES
-- Global Colors
('primary_color', '222 47% 20%', 'colors', 'Primary brand color (HSL)'),
('secondary_color', '210 20% 96%', 'colors', 'Secondary color (HSL)'),
('accent_color', '12 76% 61%', 'colors', 'Accent color (HSL)'),
('background_color', '210 20% 98%', 'colors', 'Background color (HSL)'),
('foreground_color', '222 47% 11%', 'colors', 'Text foreground color (HSL)'),
('muted_color', '215 16% 47%', 'colors', 'Muted text color (HSL)'),
('success_color', '142 71% 45%', 'colors', 'Success color (HSL)'),
('warning_color', '38 92% 50%', 'colors', 'Warning color (HSL)'),
('destructive_color', '0 84% 60%', 'colors', 'Error/destructive color (HSL)'),
('border_color', '214 32% 91%', 'colors', 'Border color (HSL)'),
('card_color', '0 0% 100%', 'colors', 'Card background color (HSL)'),
('link_color', '222 47% 40%', 'colors', 'Link color (HSL)'),
('link_hover_color', '222 47% 30%', 'colors', 'Link hover color (HSL)'),

-- Dark mode colors
('dark_mode_enabled', 'true', 'colors', 'Enable dark mode toggle'),
('dark_primary_color', '12 76% 61%', 'colors', 'Dark mode primary color (HSL)'),
('dark_background_color', '222 47% 8%', 'colors', 'Dark mode background (HSL)'),
('dark_foreground_color', '210 40% 98%', 'colors', 'Dark mode foreground (HSL)'),
('dark_card_color', '222 47% 11%', 'colors', 'Dark mode card (HSL)'),

-- Button Styling
('button_radius', '0.5rem', 'buttons', 'Button border radius'),
('button_shadow', 'false', 'buttons', 'Enable button shadow'),
('button_primary_bg', '222 47% 20%', 'buttons', 'Primary button background (HSL)'),
('button_primary_text', '210 40% 98%', 'buttons', 'Primary button text (HSL)'),
('button_secondary_bg', '210 20% 96%', 'buttons', 'Secondary button background (HSL)'),
('button_destructive_bg', '0 84% 60%', 'buttons', 'Destructive button background (HSL)'),

-- Typography
('heading_font', 'Poppins', 'typography', 'Heading font family'),
('body_font', 'Inter', 'typography', 'Body text font family'),
('font_size_base', '16', 'typography', 'Base font size in px'),
('font_size_h1', '36', 'typography', 'H1 font size in px'),
('font_size_h2', '30', 'typography', 'H2 font size in px'),
('font_size_h3', '24', 'typography', 'H3 font size in px'),
('heading_weight', '600', 'typography', 'Heading font weight'),
('body_weight', '400', 'typography', 'Body font weight'),
('line_height', '1.6', 'typography', 'Body line height'),
('letter_spacing', '0', 'typography', 'Letter spacing in em'),

-- Sidebar
('sidebar_bg', '222 47% 11%', 'sidebar', 'Sidebar background (HSL)'),
('sidebar_text', '210 40% 98%', 'sidebar', 'Sidebar text color (HSL)'),
('sidebar_active', '12 76% 61%', 'sidebar', 'Sidebar active item color (HSL)'),
('sidebar_icon_color', '215 16% 60%', 'sidebar', 'Sidebar icon color (HSL)'),
('sidebar_width', '256', 'sidebar', 'Sidebar expanded width in px'),
('sidebar_collapsed_width', '68', 'sidebar', 'Sidebar collapsed width in px'),

-- Header
('header_bg', '0 0% 100%', 'header', 'Header background (HSL)'),
('header_text', '222 47% 11%', 'header', 'Header text color (HSL)'),
('header_height', '64', 'header', 'Header height in px'),

-- Cards & Containers
('card_radius', '0.75rem', 'cards', 'Card border radius'),
('card_shadow', 'md', 'cards', 'Card shadow intensity (none/sm/md/lg)'),
('card_border', 'true', 'cards', 'Show card border'),
('card_hover_effect', 'shadow', 'cards', 'Card hover effect (none/shadow/scale/glow)'),
('container_max_width', '1440', 'cards', 'Container max width in px'),

-- Shadows & Borders
('global_radius', '0.75rem', 'shadows', 'Global border radius'),
('shadow_intensity', 'md', 'shadows', 'Shadow intensity (none/sm/md/lg)'),
('border_style', 'solid', 'shadows', 'Border style'),
('divider_color', '214 32% 91%', 'shadows', 'Divider color (HSL)'),

-- Store Frontend
('store_primary', '280 85% 55%', 'store', 'Store primary color (HSL)'),
('store_secondary', '340 85% 60%', 'store', 'Store secondary color (HSL)'),
('store_accent', '45 100% 55%', 'store', 'Store accent color (HSL)'),
('store_bg', '270 30% 98%', 'store', 'Store background (HSL)'),
('product_card_columns', '4', 'store', 'Product grid columns'),
('product_card_gap', '24', 'store', 'Product card gap in px'),
('badge_new_color', '142 71% 45%', 'store', 'New badge color (HSL)'),
('badge_sale_color', '0 84% 60%', 'store', 'Sale badge color (HSL)'),
('footer_bg', '222 47% 11%', 'store', 'Footer background (HSL)'),
('footer_text', '210 40% 98%', 'store', 'Footer text color (HSL)'),

-- Form Elements
('input_radius', '0.5rem', 'forms', 'Input border radius'),
('input_border_color', '214 32% 91%', 'forms', 'Input border color (HSL)'),
('input_focus_color', '222 47% 20%', 'forms', 'Input focus ring color (HSL)'),
('switch_accent', '222 47% 20%', 'forms', 'Switch/Checkbox accent (HSL)'),
('label_color', '222 47% 11%', 'forms', 'Label text color (HSL)'),

-- Badges & Tags
('badge_default_bg', '210 20% 96%', 'badges', 'Default badge bg (HSL)'),
('badge_success_bg', '142 71% 45%', 'badges', 'Success badge bg (HSL)'),
('badge_warning_bg', '38 92% 50%', 'badges', 'Warning badge bg (HSL)'),
('badge_error_bg', '0 84% 60%', 'badges', 'Error badge bg (HSL)'),
('badge_shape', 'pill', 'badges', 'Badge shape (rounded/pill/square)'),

-- Navigation & Tabs
('tab_active_color', '222 47% 20%', 'navigation', 'Tab active color (HSL)'),
('tab_inactive_color', '215 16% 47%', 'navigation', 'Tab inactive color (HSL)'),
('tab_style', 'underline', 'navigation', 'Tab style (underline/pill)'),
('pagination_style', 'rounded', 'navigation', 'Pagination style (rounded/square)'),

-- Modals
('modal_overlay_opacity', '0.5', 'modals', 'Modal overlay opacity'),
('modal_radius', '0.75rem', 'modals', 'Modal border radius'),
('modal_shadow', 'lg', 'modals', 'Modal shadow (sm/md/lg)'),

-- Toast
('toast_position', 'bottom-right', 'toast', 'Toast position'),
('toast_duration', '4000', 'toast', 'Toast duration in ms'),
('toast_success_bg', '142 71% 45%', 'toast', 'Toast success bg (HSL)'),
('toast_error_bg', '0 84% 60%', 'toast', 'Toast error bg (HSL)'),

-- Charts
('chart_color_1', '12 76% 61%', 'charts', 'Chart color 1 (HSL)'),
('chart_color_2', '222 47% 40%', 'charts', 'Chart color 2 (HSL)'),
('chart_color_3', '142 71% 45%', 'charts', 'Chart color 3 (HSL)'),
('chart_color_4', '38 92% 50%', 'charts', 'Chart color 4 (HSL)'),
('chart_color_5', '280 65% 60%', 'charts', 'Chart color 5 (HSL)'),
('chart_grid_color', '214 32% 91%', 'charts', 'Chart grid line color (HSL)'),

-- Spacing & Layout
('page_padding', '24', 'spacing', 'Global page padding in px'),
('section_gap', '32', 'spacing', 'Section gap in px'),

-- Logo & Branding
('brand_name', 'Ekta', 'branding', 'Brand/Site name'),
('logo_url', '', 'branding', 'Logo image URL'),
('favicon_url', '', 'branding', 'Favicon URL'),

-- Custom CSS
('custom_css', '', 'custom', 'Custom CSS override');
