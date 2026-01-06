import { NextRequest, NextResponse } from "next/server";
import {
  PptxPresentationModel,
  PptxSlideModel,
  PptxTextBoxModel,
  PptxAutoShapeBoxModel,
  PptxPictureBoxModel,
  PptxFillModel,
  PptxFontModel,
  PptxAlignment,
  PptxShapeType,
  PptxObjectFitEnum,
} from "@/types/slides/pptx_models";

const SLIDES_API_URL = process.env.SLIDES_API_URL || "http://localhost:8000";

// Slide dimensions
const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;

// Template color schemes - matching the React templates
interface TemplateColors {
  primary: string;        // Primary accent color
  titleColor: string;     // Title text color
  bodyColor: string;      // Body text color
  mutedColor: string;     // Muted/secondary text
  backgroundColor: string; // Slide background
  fontFamily: string;     // Primary font
}

const TEMPLATE_SCHEMES: Record<string, TemplateColors> = {
  general: {
    primary: "9333EA",       // Purple
    titleColor: "111827",    // Dark gray
    bodyColor: "4B5563",     // Gray
    mutedColor: "6B7280",    // Muted gray
    backgroundColor: "FFFFFF",
    fontFamily: "Inter",
  },
  modern: {
    primary: "1E4CD9",       // Blue
    titleColor: "1E4CD9",    // Blue (titles are blue in modern)
    bodyColor: "374151",     // Dark gray
    mutedColor: "6B7280",    // Muted gray
    backgroundColor: "FFFFFF",
    fontFamily: "Montserrat",
  },
  standard: {
    primary: "1B8C2D",       // Green
    titleColor: "111827",    // Dark gray
    bodyColor: "4B5563",     // Gray
    mutedColor: "6B7280",    // Muted gray
    backgroundColor: "FFFFFF",
    fontFamily: "Playfair Display",
  },
  swift: {
    primary: "0EA5E9",       // Sky blue (using a more visible blue)
    titleColor: "111827",    // Dark gray
    bodyColor: "4B5563",     // Gray
    mutedColor: "6B7280",    // Muted gray
    backgroundColor: "FFFFFF",
    fontFamily: "Inter",
  },
};

// Get template colors with fallback to general
function getTemplateColors(layoutGroup: string): TemplateColors {
  const normalizedGroup = layoutGroup?.toLowerCase() || "general";
  return TEMPLATE_SCHEMES[normalizedGroup] || TEMPLATE_SCHEMES.general;
}

interface SlideData {
  id: string;
  presentation: string;
  layout_group: string;
  layout: string;
  index: number;
  content: Record<string, unknown>;
  html_content?: string;
  speaker_note?: string;
  properties?: Record<string, unknown>;
}

interface PresentationWithSlides {
  id: string;
  content: string;
  n_slides: number;
  language: string;
  title?: string;
  slides: SlideData[];
}

// Helper to convert hex color to 6-digit format
function normalizeColor(color: string): string {
  if (!color) return "000000";
  // Remove # if present
  const hex = color.replace("#", "");
  // Expand 3-digit hex
  if (hex.length === 3) {
    return hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return hex.padEnd(6, "0").slice(0, 6);
}

// Convert slide content to PPTX shapes
function convertSlideContentToPptxShapes(
  content: Record<string, unknown>,
  layoutGroup: string
): (PptxTextBoxModel | PptxAutoShapeBoxModel | PptxPictureBoxModel)[] {
  const shapes: (PptxTextBoxModel | PptxAutoShapeBoxModel | PptxPictureBoxModel)[] = [];

  // Get template-specific colors
  const colors = getTemplateColors(layoutGroup);

  // Default font settings using template colors
  const defaultFont: PptxFontModel = {
    name: colors.fontFamily,
    size: 24,
    font_weight: 400,
    italic: false,
    color: colors.bodyColor,
  };

  // Background shape (full slide)
  const bgShape: PptxAutoShapeBoxModel = {
    shape_type: "autoshape",
    type: PptxShapeType.RECTANGLE,
    position: { left: 0, top: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT },
    text_wrap: false,
    fill: { color: colors.backgroundColor, opacity: 1.0 },
  };
  shapes.push(bgShape);

  // Add accent bar at the top (template-specific color)
  const accentBar: PptxAutoShapeBoxModel = {
    shape_type: "autoshape",
    type: PptxShapeType.RECTANGLE,
    position: { left: 0, top: 0, width: SLIDE_WIDTH, height: 8 },
    text_wrap: false,
    fill: { color: colors.primary, opacity: 1.0 },
  };
  shapes.push(accentBar);

  // Extract common fields
  const title = content.title as string | undefined;
  const description = content.description as string | undefined;
  const presenterName = content.presenterName as string | undefined;
  const presentationDate = content.presentationDate as string | undefined;
  const image = content.image as { __image_url__?: string; __image_prompt__?: string } | undefined;
  const bullets = content.bullets as Array<{ title?: string; description?: string; icon?: string }> | undefined;

  let currentY = 60;

  // Title
  if (title) {
    const titleShape: PptxTextBoxModel = {
      shape_type: "textbox",
      position: { left: 80, top: currentY, width: SLIDE_WIDTH - 160, height: 80 },
      text_wrap: true,
      paragraphs: [
        {
          text: title,
          alignment: PptxAlignment.LEFT,
          font: {
            ...defaultFont,
            size: 48,
            font_weight: 700,
            color: colors.titleColor,
          },
        },
      ],
    };
    shapes.push(titleShape);
    currentY += 90;

    // Add accent underline below title (template-specific color)
    const titleUnderline: PptxAutoShapeBoxModel = {
      shape_type: "autoshape",
      type: PptxShapeType.RECTANGLE,
      position: { left: 80, top: currentY, width: 100, height: 4 },
      text_wrap: false,
      fill: { color: colors.primary, opacity: 1.0 },
    };
    shapes.push(titleUnderline);
    currentY += 20;
  }

  // Description
  if (description) {
    const descShape: PptxTextBoxModel = {
      shape_type: "textbox",
      position: { left: 80, top: currentY, width: SLIDE_WIDTH / 2 - 100, height: 120 },
      text_wrap: true,
      paragraphs: [
        {
          text: description,
          alignment: PptxAlignment.LEFT,
          font: {
            ...defaultFont,
            size: 18,
            color: colors.bodyColor,
          },
        },
      ],
    };
    shapes.push(descShape);
    currentY += 140;
  }

  // Image
  if (image && image.__image_url__) {
    const imageShape: PptxPictureBoxModel = {
      shape_type: "picture",
      position: {
        left: SLIDE_WIDTH / 2 + 40,
        top: 120,
        width: SLIDE_WIDTH / 2 - 120,
        height: 400,
      },
      clip: true,
      object_fit: { fit: PptxObjectFitEnum.COVER },
      picture: {
        is_network: image.__image_url__.startsWith("http"),
        path: image.__image_url__,
      },
    };
    shapes.push(imageShape);
  }

  // Bullets
  if (bullets && Array.isArray(bullets)) {
    const bulletStartY = currentY;
    const bulletHeight = 70;
    const bulletWidth = SLIDE_WIDTH / 2 - 100;

    bullets.forEach((bullet, index) => {
      const bulletY = bulletStartY + index * bulletHeight;

      // Bullet number circle with template accent color
      const bulletCircle: PptxAutoShapeBoxModel = {
        shape_type: "autoshape",
        type: PptxShapeType.OVAL,
        position: { left: 80, top: bulletY + 2, width: 28, height: 28 },
        text_wrap: false,
        fill: { color: colors.primary, opacity: 1.0 },
      };
      shapes.push(bulletCircle);

      // Bullet number
      const bulletNumber: PptxTextBoxModel = {
        shape_type: "textbox",
        position: { left: 80, top: bulletY + 4, width: 28, height: 24 },
        text_wrap: false,
        paragraphs: [
          {
            text: String(index + 1),
            alignment: PptxAlignment.CENTER,
            font: {
              ...defaultFont,
              size: 14,
              font_weight: 700,
              color: "FFFFFF",
            },
          },
        ],
      };
      shapes.push(bulletNumber);

      // Bullet title
      if (bullet.title) {
        const bulletTitleShape: PptxTextBoxModel = {
          shape_type: "textbox",
          position: { left: 120, top: bulletY, width: bulletWidth, height: 30 },
          text_wrap: true,
          paragraphs: [
            {
              text: bullet.title,
              alignment: PptxAlignment.LEFT,
              font: {
                ...defaultFont,
                size: 20,
                font_weight: 600,
                color: colors.titleColor,
              },
            },
          ],
        };
        shapes.push(bulletTitleShape);
      }

      // Bullet description
      if (bullet.description) {
        const bulletDescShape: PptxTextBoxModel = {
          shape_type: "textbox",
          position: { left: 120, top: bulletY + 30, width: bulletWidth - 20, height: 35 },
          text_wrap: true,
          paragraphs: [
            {
              text: bullet.description,
              alignment: PptxAlignment.LEFT,
              font: {
                ...defaultFont,
                size: 14,
                color: colors.mutedColor,
              },
            },
          ],
        };
        shapes.push(bulletDescShape);
      }
    });
  }

  // Presenter info at bottom with accent styling
  if (presenterName || presentationDate) {
    // Presenter card background
    const presenterBg: PptxAutoShapeBoxModel = {
      shape_type: "autoshape",
      type: PptxShapeType.ROUNDED_RECTANGLE,
      position: { left: 80, top: SLIDE_HEIGHT - 100, width: 300, height: 70 },
      text_wrap: false,
      fill: { color: "F3F4F6", opacity: 1.0 },
    };
    shapes.push(presenterBg);

    // Presenter initials circle
    const initialsCircle: PptxAutoShapeBoxModel = {
      shape_type: "autoshape",
      type: PptxShapeType.OVAL,
      position: { left: 95, top: SLIDE_HEIGHT - 85, width: 40, height: 40 },
      text_wrap: false,
      fill: { color: colors.primary, opacity: 1.0 },
    };
    shapes.push(initialsCircle);

    // Presenter initials text
    const initials = presenterName
      ? presenterName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
      : "PR";
    const initialsText: PptxTextBoxModel = {
      shape_type: "textbox",
      position: { left: 95, top: SLIDE_HEIGHT - 82, width: 40, height: 34 },
      text_wrap: false,
      paragraphs: [
        {
          text: initials,
          alignment: PptxAlignment.CENTER,
          font: {
            ...defaultFont,
            size: 14,
            font_weight: 700,
            color: "FFFFFF",
          },
        },
      ],
    };
    shapes.push(initialsText);

    // Presenter name
    if (presenterName) {
      const presenterNameShape: PptxTextBoxModel = {
        shape_type: "textbox",
        position: { left: 145, top: SLIDE_HEIGHT - 88, width: 220, height: 25 },
        text_wrap: true,
        paragraphs: [
          {
            text: presenterName,
            alignment: PptxAlignment.LEFT,
            font: {
              ...defaultFont,
              size: 16,
              font_weight: 600,
              color: colors.titleColor,
            },
          },
        ],
      };
      shapes.push(presenterNameShape);
    }

    // Presentation date
    if (presentationDate) {
      const dateShape: PptxTextBoxModel = {
        shape_type: "textbox",
        position: { left: 145, top: SLIDE_HEIGHT - 65, width: 220, height: 25 },
        text_wrap: true,
        paragraphs: [
          {
            text: presentationDate,
            alignment: PptxAlignment.LEFT,
            font: {
              ...defaultFont,
              size: 13,
              color: colors.mutedColor,
            },
          },
        ],
      };
      shapes.push(dateShape);
    }
  }

  return shapes;
}

// Convert presentation to PPTX model
function convertPresentationToPptxModel(presentation: PresentationWithSlides): PptxPresentationModel {
  const slides: PptxSlideModel[] = presentation.slides.map((slide) => {
    const shapes = convertSlideContentToPptxShapes(
      slide.content as Record<string, unknown>,
      slide.layout_group
    );

    const pptxSlide: PptxSlideModel = {
      shapes,
      note: slide.speaker_note,
      background: { color: "FFFFFF", opacity: 1.0 },
    };

    return pptxSlide;
  });

  return {
    name: presentation.title || "Presentation",
    slides,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    // Fetch presentation from FastAPI backend
    const response = await fetch(`${SLIDES_API_URL}/api/v1/ppt/presentation/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch presentation:", errorText);
      return NextResponse.json(
        { error: `Failed to fetch presentation: ${errorText}` },
        { status: response.status }
      );
    }

    const presentation: PresentationWithSlides = await response.json();

    // Convert to PPTX model
    const pptxModel = convertPresentationToPptxModel(presentation);

    return NextResponse.json(pptxModel);
  } catch (error) {
    console.error("Error in /api/presentation_to_pptx_model:", error);
    return NextResponse.json(
      {
        error: "Failed to convert presentation to PPTX model",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
