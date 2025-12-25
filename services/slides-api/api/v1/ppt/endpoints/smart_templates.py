"""
Smart Templates API - AI-powered template-based presentation generation

This is the new generation system that:
1. Analyzes PPTX templates and extracts design systems
2. Uses AI to intelligently select layouts and generate content
3. Reconstructs PPTX with 99% fidelity to original template
"""

import os
import uuid
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlmodel import Session, select
from sqlalchemy.ext.asyncio import AsyncSession

from services.database import engine, get_async_session
from services.design_system_extractor import DESIGN_SYSTEM_EXTRACTOR, DesignSystem
from services.pptx_builder import build_pptx_from_design_system, SlideContent
from services.ai_slide_generator import generate_slides_with_ai, AISlideGenerator
from services.slide_thumbnail_generator import THUMBNAIL_GENERATOR
from models.sql.template import PptxTemplateModel
from utils.datetime_utils import get_current_utc_datetime
from utils.asset_directory_utils import get_exports_directory


router = APIRouter(prefix="/smart-templates", tags=["Smart Templates"])


# ==================== PYDANTIC MODELS ====================

class DesignSystemResponse(BaseModel):
    id: str
    name: str
    slide_count: int
    layouts: List[dict]
    fonts: List[str]
    theme_colors: dict
    heading_fonts: List[str]
    body_fonts: List[str]


class AnalyzeTemplateResponse(BaseModel):
    success: bool
    template_id: str
    design_system: DesignSystemResponse
    message: str


class GenerateRequest(BaseModel):
    template_id: str
    topic: str
    num_slides: int = 10
    language: str = "fr"
    context: Optional[str] = None
    instructions: Optional[str] = None
    include_images: bool = True


class GenerateResponse(BaseModel):
    success: bool
    presentation_id: str
    file_path: str
    download_url: str
    slides_generated: int
    message: str


class QuickGenerateRequest(BaseModel):
    topic: str
    num_slides: int = 10
    language: str = "fr"
    context: Optional[str] = None
    instructions: Optional[str] = None


# ==================== ENDPOINTS ====================

@router.post("/analyze", response_model=AnalyzeTemplateResponse)
async def analyze_template(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    category: str = Form("general")
):
    """
    Analyze a PPTX template and extract its complete design system.

    This extracts:
    - All colors (theme, accent, text, background)
    - Typography (fonts, sizes, weights)
    - Layout patterns with semantic meaning
    - Placeholder constraints
    - Shape styles

    The design system enables 99% faithful reproduction.
    """
    # Validate file
    if not file.filename.endswith(('.pptx', '.PPTX')):
        raise HTTPException(status_code=400, detail="Only PPTX files are supported")

    content = await file.read()
    if len(content) > 100 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 100MB)")

    try:
        # Save file temporarily
        template_id = str(uuid.uuid4())
        templates_dir = os.path.join(os.getenv("APP_DATA_DIRECTORY", "/tmp"), "smart_templates")
        os.makedirs(templates_dir, exist_ok=True)

        template_path = os.path.join(templates_dir, f"{template_id}.pptx")
        with open(template_path, "wb") as f:
            f.write(content)

        # Extract design system
        design_system = DESIGN_SYSTEM_EXTRACTOR.extract(template_path, name)

        # Save to database
        with Session(engine) as session:
            template = PptxTemplateModel(
                id=uuid.UUID(template_id),
                name=name,
                description=description,
                category=category,
                file_path=template_path,
                file_size=len(content),
                slide_count=len(design_system.layouts),
                placeholder_mapping=[],  # Will be populated from design system
                slide_layouts={
                    layout.layout_type.value: idx
                    for idx, layout in enumerate(design_system.layouts)
                },
                fonts=design_system.fonts_used,
                theme_colors=design_system.theme_colors,
                is_active=True,
                is_system=False,
                created_at=get_current_utc_datetime(),
                updated_at=get_current_utc_datetime()
            )
            session.add(template)
            session.commit()

        # Build response
        design_response = DesignSystemResponse(
            id=design_system.id,
            name=design_system.name,
            slide_count=len(design_system.layouts),
            layouts=[
                {
                    "index": l.index,
                    "name": l.name,
                    "type": l.layout_type.value,
                    "recommended_for": l.recommended_for,
                    "placeholders": [
                        {
                            "idx": p.idx,
                            "type": p.type,
                            "name": p.name,
                            "position": p.position,
                            "size": p.size,
                            "max_chars": p.max_chars,
                            "max_lines": p.max_lines,
                            "is_static": p.is_static,
                            "current_text": p.current_text,
                            "shape_id": p.shape_id,
                        }
                        for p in l.placeholders
                    ]
                }
                for l in design_system.layouts
            ],
            fonts=design_system.fonts_used,
            theme_colors=design_system.theme_colors,
            heading_fonts=design_system.heading_fonts,
            body_fonts=design_system.body_fonts
        )

        return AnalyzeTemplateResponse(
            success=True,
            template_id=template_id,
            design_system=design_response,
            message=f"Template analyzed: {len(design_system.layouts)} layouts extracted"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing template: {str(e)}")


@router.post("/generate", response_model=GenerateResponse)
async def generate_from_template(request: GenerateRequest):
    """
    Generate a complete presentation using AI and a smart template.

    The AI will:
    1. Analyze the topic and create an outline
    2. Select the best layout for each slide
    3. Generate content adapted to layout constraints
    4. Build PPTX with 99% fidelity to original template
    """
    # Get template
    with Session(engine) as session:
        template = session.get(PptxTemplateModel, uuid.UUID(request.template_id))
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        template_path = template.file_path

    try:
        # Extract design system
        design_system = DESIGN_SYSTEM_EXTRACTOR.extract(template_path, template.name)

        # Generate content with AI
        slides_content = await generate_slides_with_ai(
            design_system=design_system,
            topic=request.topic,
            num_slides=request.num_slides,
            language=request.language,
            context=request.context,
            instructions=request.instructions
        )

        if not slides_content:
            raise HTTPException(status_code=500, detail="AI failed to generate content")

        # Build PPTX
        presentation_id = str(uuid.uuid4())
        output_dir = get_exports_directory()
        os.makedirs(output_dir, exist_ok=True)

        output_path = await build_pptx_from_design_system(
            design_system=design_system,
            template_path=template_path,
            slides_content=slides_content,
            output_filename=f"presentation_{presentation_id[:8]}",
            output_dir=output_dir
        )

        return GenerateResponse(
            success=True,
            presentation_id=presentation_id,
            file_path=output_path,
            download_url=f"/api/v1/ppt/smart-templates/download/{os.path.basename(output_path)}",
            slides_generated=len(slides_content),
            message=f"Generated {len(slides_content)} slides successfully"
        )

    except Exception as e:
        import traceback
        print(f"Error generating presentation: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error generating presentation: {str(e)}")


@router.post("/generate-from-content", response_model=GenerateResponse)
async def generate_from_content(
    template_id: str = Form(...),
    slides_content: str = Form(...),  # JSON string
):
    """
    Generate PPTX from provided content using a template.

    Use this when you already have the slide content and just want
    to apply a template's styling.
    """
    import json

    # Get template
    with Session(engine) as session:
        template = session.get(PptxTemplateModel, uuid.UUID(template_id))
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        template_path = template.file_path

    try:
        # Parse content
        content = json.loads(slides_content)
        if not isinstance(content, list):
            content = [content]

        # Extract design system
        design_system = DESIGN_SYSTEM_EXTRACTOR.extract(template_path, template.name)

        # Build PPTX
        presentation_id = str(uuid.uuid4())
        output_dir = get_exports_directory()

        output_path = await build_pptx_from_design_system(
            design_system=design_system,
            template_path=template_path,
            slides_content=content,
            output_filename=f"presentation_{presentation_id[:8]}",
            output_dir=output_dir
        )

        return GenerateResponse(
            success=True,
            presentation_id=presentation_id,
            file_path=output_path,
            download_url=f"/api/v1/ppt/smart-templates/download/{os.path.basename(output_path)}",
            slides_generated=len(content),
            message=f"Built {len(content)} slides from content"
        )

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in slides_content")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building presentation: {str(e)}")


@router.get("/download/{filename}")
async def download_presentation(filename: str):
    """Download a generated presentation"""
    file_path = os.path.join(get_exports_directory(), filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )


@router.get("/templates")
async def list_smart_templates():
    """List all available smart templates"""
    with Session(engine) as session:
        templates = session.exec(
            select(PptxTemplateModel).where(PptxTemplateModel.is_active == True)
        ).all()

        result = []
        for t in templates:
            template_data = {
                "id": str(t.id),
                "name": t.name,
                "description": t.description,
                "category": t.category,
                "slide_count": t.slide_count,
                "fonts": t.fonts,
                "created_at": t.created_at,
                "thumbnail_url": None
            }

            # Get first slide thumbnail if available
            thumb_base64 = THUMBNAIL_GENERATOR.get_thumbnail_base64(str(t.id), 0)
            if thumb_base64:
                template_data["thumbnail_url"] = f"data:image/png;base64,{thumb_base64}"
            elif t.file_path and os.path.exists(t.file_path):
                # Generate thumbnails if they don't exist
                try:
                    THUMBNAIL_GENERATOR.generate_thumbnails(t.file_path, str(t.id), width=1920, height=1080)
                    thumb_base64 = THUMBNAIL_GENERATOR.get_thumbnail_base64(str(t.id), 0)
                    if thumb_base64:
                        template_data["thumbnail_url"] = f"data:image/png;base64,{thumb_base64}"
                except Exception as e:
                    print(f"Error generating thumbnail for template {t.id}: {e}")

            result.append(template_data)

        return result


@router.get("/templates/{template_id}/design-system")
async def get_template_design_system(template_id: str):
    """Get the full design system for a template"""
    with Session(engine) as session:
        template = session.get(PptxTemplateModel, uuid.UUID(template_id))
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

    try:
        design_system = DESIGN_SYSTEM_EXTRACTOR.extract(template.file_path, template.name)

        return {
            "id": design_system.id,
            "name": design_system.name,
            "dimensions": {
                "width_inches": design_system.slide_width_inches,
                "height_inches": design_system.slide_height_inches
            },
            "colors": {
                "theme": design_system.theme_colors,
                "accent": design_system.accent_colors,
                "text": design_system.text_colors,
                "background": design_system.background_colors
            },
            "typography": {
                "heading_fonts": design_system.heading_fonts,
                "body_fonts": design_system.body_fonts,
                "font_sizes": design_system.font_sizes,
                "all_fonts": design_system.fonts_used
            },
            "layouts": [
                {
                    "index": l.index,
                    "name": l.name,
                    "type": l.layout_type.value,
                    "recommended_for": l.recommended_for,
                    "placeholders": [
                        {
                            "idx": p.idx,
                            "type": p.type,
                            "name": p.name,
                            "position": p.position,
                            "size": p.size,
                            "max_chars": p.max_chars,
                            "max_lines": p.max_lines,
                            "is_static": p.is_static,
                            "current_text": p.current_text,
                            "shape_id": p.shape_id,
                        }
                        for p in l.placeholders
                    ]
                }
                for l in design_system.layouts
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting design system: {str(e)}")


@router.delete("/templates/{template_id}")
async def delete_smart_template(template_id: str):
    """Delete a smart template"""
    with Session(engine) as session:
        template = session.get(PptxTemplateModel, uuid.UUID(template_id))
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

        if template.is_system:
            raise HTTPException(status_code=403, detail="Cannot delete system templates")

        # Soft delete
        template.is_active = False
        template.updated_at = get_current_utc_datetime()
        session.add(template)
        session.commit()

    return {"message": "Template deleted successfully"}


class UpdateLayoutRequest(BaseModel):
    layout_index: int
    layout: dict


@router.put("/templates/{template_id}/layouts")
async def update_template_layout(template_id: str, request: UpdateLayoutRequest):
    """
    Update a specific layout in the template's design system.

    This allows editing placeholder positions, sizes, and properties
    which will be applied when generating new presentations.
    """
    with Session(engine) as session:
        template = session.get(PptxTemplateModel, uuid.UUID(template_id))
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

        # Get current slide_layouts or initialize
        slide_layouts = template.slide_layouts or {}

        # Store the custom layout modifications
        if "custom_layouts" not in slide_layouts:
            slide_layouts["custom_layouts"] = {}

        slide_layouts["custom_layouts"][str(request.layout_index)] = request.layout

        # Update template
        template.slide_layouts = slide_layouts
        template.updated_at = get_current_utc_datetime()
        session.add(template)
        session.commit()
        session.refresh(template)

    return {
        "success": True,
        "message": f"Layout {request.layout_index} updated successfully",
        "layout": request.layout
    }


@router.get("/templates/{template_id}/thumbnails")
async def get_template_thumbnails(template_id: str):
    """
    Get thumbnail images for all slides in a template.

    Returns base64 encoded PNG images for each slide.
    """
    with Session(engine) as session:
        template = session.get(PptxTemplateModel, uuid.UUID(template_id))
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

    try:
        # Check if thumbnails already exist
        thumb_path = THUMBNAIL_GENERATOR.get_thumbnail_path(template_id, 0)

        # Generate thumbnails if they don't exist
        if not thumb_path:
            THUMBNAIL_GENERATOR.generate_thumbnails(
                template.file_path,
                template_id,
                width=1920,
                height=1080
            )

        # Get all thumbnails as base64
        thumbnails = []
        idx = 0
        while True:
            thumb_base64 = THUMBNAIL_GENERATOR.get_thumbnail_base64(template_id, idx)
            if thumb_base64:
                thumbnails.append({
                    "index": idx,
                    "image": f"data:image/png;base64,{thumb_base64}"
                })
                idx += 1
            else:
                break

        return {
            "template_id": template_id,
            "thumbnails": thumbnails,
            "count": len(thumbnails)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating thumbnails: {str(e)}")


@router.get("/templates/{template_id}/thumbnails/{slide_index}")
async def get_slide_thumbnail(template_id: str, slide_index: int):
    """
    Get thumbnail image for a specific slide.

    Returns the PNG image file directly.
    """
    with Session(engine) as session:
        template = session.get(PptxTemplateModel, uuid.UUID(template_id))
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

    # Check if thumbnail exists, generate if not
    thumb_path = THUMBNAIL_GENERATOR.get_thumbnail_path(template_id, slide_index)

    if not thumb_path:
        # Generate all thumbnails
        THUMBNAIL_GENERATOR.generate_thumbnails(
            template.file_path,
            template_id,
            width=1920,
            height=1080
        )
        thumb_path = THUMBNAIL_GENERATOR.get_thumbnail_path(template_id, slide_index)

    if not thumb_path:
        raise HTTPException(status_code=404, detail="Slide thumbnail not found")

    return FileResponse(
        path=thumb_path,
        media_type="image/png",
        filename=f"slide_{slide_index}.png"
    )
