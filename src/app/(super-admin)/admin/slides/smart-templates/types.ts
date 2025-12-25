export interface SmartTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  slide_count: number;
  fonts?: string[];
  thumbnail_url?: string;
  created_at: string;
}

export interface PlaceholderInfo {
  idx: number;
  type: string;
  name?: string;
  position?: { left: number; top: number; left_inches?: number; top_inches?: number };
  size?: { width: number; height: number; width_inches?: number; height_inches?: number };
  max_chars?: number;
  max_lines?: number;
  is_static?: boolean;  // True if this is a static text shape (not a native placeholder)
  current_text?: string | null;  // Current text content
  shape_id?: number | null;  // Shape ID for targeting during generation
}

export interface DesignSystemLayout {
  index: number;
  name: string;
  type: string;
  recommended_for: string[];
  placeholders: PlaceholderInfo[];
}

export interface DesignSystem {
  id: string;
  name: string;
  slide_count: number;
  dimensions?: {
    width_inches: number;
    height_inches: number;
  };
  colors?: {
    theme: Record<string, string>;
    accent: string[];
    text: Record<string, string>;
    background: string[];
  };
  typography?: {
    heading_fonts: string[];
    body_fonts: string[];
    font_sizes: Record<string, number>;
    all_fonts: string[];
  };
  layouts: DesignSystemLayout[];
  fonts?: string[];
  theme_colors?: Record<string, string>;
  heading_fonts?: string[];
  body_fonts?: string[];
}

export interface GenerateRequest {
  template_id: string;
  topic: string;
  num_slides: number;
  language: string;
  context?: string;
  instructions?: string;
  include_images?: boolean;
}

export interface GenerateResponse {
  success: boolean;
  presentation_id: string;
  file_path: string;
  download_url: string;
  slides_generated: number;
  message: string;
}
