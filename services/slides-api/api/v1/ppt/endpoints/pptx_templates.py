"""
PPTX Templates API - Professional PowerPoint Template Management

Endpoints for:
- Uploading PPTX templates
- Listing available templates
- Generating presentations from templates
- Exporting with preserved quality
"""

import os
import uuid
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlmodel import Session, select

from services.database import engine
from models.sql.template import PptxTemplateModel
from services.pptx_template_service import PPTX_TEMPLATE_SERVICE
from utils.datetime_utils import get_current_utc_datetime


router = APIRouter(prefix="/pptx-templates", tags=["PPTX Templates"])


# ==================== PYDANTIC MODELS ====================

class TemplateUploadResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    category: str
    slide_count: int
    placeholder_count: int
    fonts: List[str]
    message: str


class TemplateListItem(BaseModel):
    id: str
    name: str
    description: Optional[str]
    category: str
    slide_count: int
    thumbnail_url: Optional[str]
    is_system: bool
    created_at: datetime


class TemplateDetailResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    category: str
    slide_count: int
    placeholder_mapping: List[dict]
    slide_layouts: dict
    fonts: List[str]
    theme_colors: dict


class SlideContent(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    body: Optional[str] = None
    bullets: Optional[List[str]] = None
    image: Optional[dict] = None
    speaker_notes: Optional[str] = None


class GenerateFromTemplateRequest(BaseModel):
    template_id: str
    slides: List[SlideContent]
    output_filename: Optional[str] = None
    options: Optional[dict] = None


class GenerateResponse(BaseModel):
    success: bool
    file_path: str
    download_url: str
    message: str


# ==================== ENDPOINTS ====================

@router.post("/upload", response_model=TemplateUploadResponse)
async def upload_pptx_template(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    category: str = Form("general")
):
    """
    Upload a PPTX file as a reusable template.

    The template will be analyzed to extract:
    - Placeholder positions and types
    - Fonts and colors used
    - Slide layouts

    This allows generating new presentations that maintain
    the original template's professional design.
    """
    # Validate file type
    if not file.filename.endswith(('.pptx', '.PPTX')):
        raise HTTPException(
            status_code=400,
            detail="Only PPTX files are supported"
        )

    # Check file size (max 100MB)
    content = await file.read()
    if len(content) > 100 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds 100MB limit"
        )

    try:
        # Save and analyze template
        result = await PPTX_TEMPLATE_SERVICE.save_template(
            file_content=content,
            name=name,
            description=description,
            category=category
        )

        # Save to database
        with Session(engine) as session:
            template = PptxTemplateModel(
                id=uuid.UUID(result["id"]),
                name=name,
                description=description,
                category=category,
                file_path=result["file_path"],
                file_size=result["file_size"],
                slide_count=result["slide_count"],
                thumbnail_path=result.get("thumbnail_path"),
                placeholder_mapping=result["placeholder_mapping"],
                slide_layouts=result["slide_layouts"],
                fonts=result["fonts"],
                theme_colors=result["theme_colors"],
                is_active=True,
                is_system=False,
                created_at=get_current_utc_datetime(),
                updated_at=get_current_utc_datetime()
            )
            session.add(template)
            session.commit()

        return TemplateUploadResponse(
            id=result["id"],
            name=name,
            description=description,
            category=category,
            slide_count=result["slide_count"],
            placeholder_count=len(result["placeholder_mapping"]),
            fonts=result["fonts"],
            message=f"Template uploaded successfully with {result['slide_count']} slides"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing template: {str(e)}"
        )


@router.get("/list", response_model=List[TemplateListItem])
async def list_templates(
    category: Optional[str] = Query(None),
    include_system: bool = Query(True)
):
    """
    List all available PPTX templates.
    """
    with Session(engine) as session:
        query = select(PptxTemplateModel).where(PptxTemplateModel.is_active == True)

        if category:
            query = query.where(PptxTemplateModel.category == category)

        if not include_system:
            query = query.where(PptxTemplateModel.is_system == False)

        templates = session.exec(query).all()

        return [
            TemplateListItem(
                id=str(t.id),
                name=t.name,
                description=t.description,
                category=t.category,
                slide_count=t.slide_count,
                thumbnail_url=f"/api/v1/ppt/pptx-templates/{t.id}/thumbnail" if t.thumbnail_path else None,
                is_system=t.is_system,
                created_at=t.created_at
            )
            for t in templates
        ]


@router.get("/{template_id}", response_model=TemplateDetailResponse)
async def get_template_details(template_id: str):
    """
    Get detailed information about a template including placeholder mapping.
    """
    with Session(engine) as session:
        template = session.get(PptxTemplateModel, uuid.UUID(template_id))

        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

        return TemplateDetailResponse(
            id=str(template.id),
            name=template.name,
            description=template.description,
            category=template.category,
            slide_count=template.slide_count,
            placeholder_mapping=template.placeholder_mapping or [],
            slide_layouts=template.slide_layouts or {},
            fonts=template.fonts or [],
            theme_colors=template.theme_colors or {}
        )


@router.post("/generate", response_model=GenerateResponse)
async def generate_from_template(request: GenerateFromTemplateRequest):
    """
    Generate a new PPTX presentation from a template.

    The original template design is preserved while
    replacing content in placeholders.
    """
    with Session(engine) as session:
        template = session.get(PptxTemplateModel, uuid.UUID(request.template_id))

        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

        # Prepare slides content
        slides_content = [slide.model_dump() for slide in request.slides]

        # Generate output filename
        output_filename = request.output_filename or f"presentation_{uuid.uuid4().hex[:8]}"

        try:
            # Generate the presentation
            output_path = await PPTX_TEMPLATE_SERVICE.generate_from_template(
                template_path=template.file_path,
                slides_content=slides_content,
                output_filename=output_filename,
                options=request.options
            )

            return GenerateResponse(
                success=True,
                file_path=output_path,
                download_url=f"/api/v1/ppt/pptx-templates/download/{os.path.basename(output_path)}",
                message="Presentation generated successfully"
            )

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error generating presentation: {str(e)}"
            )


@router.get("/download/{filename}")
async def download_generated_pptx(filename: str):
    """
    Download a generated PPTX file.
    """
    from utils.asset_directory_utils import get_exports_directory

    file_path = os.path.join(get_exports_directory(), filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )


@router.get("/{template_id}/thumbnail")
async def get_template_thumbnail(template_id: str):
    """
    Get the thumbnail image for a template.
    """
    with Session(engine) as session:
        template = session.get(PptxTemplateModel, uuid.UUID(template_id))

        if not template or not template.thumbnail_path:
            raise HTTPException(status_code=404, detail="Thumbnail not found")

        if not os.path.exists(template.thumbnail_path):
            raise HTTPException(status_code=404, detail="Thumbnail file not found")

        return FileResponse(
            path=template.thumbnail_path,
            media_type="image/png"
        )


@router.delete("/{template_id}")
async def delete_template(template_id: str):
    """
    Delete a template (soft delete - marks as inactive).
    """
    with Session(engine) as session:
        template = session.get(PptxTemplateModel, uuid.UUID(template_id))

        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

        if template.is_system:
            raise HTTPException(status_code=403, detail="Cannot delete system templates")

        template.is_active = False
        template.updated_at = get_current_utc_datetime()
        session.add(template)
        session.commit()

        return {"message": "Template deleted successfully"}


@router.post("/{template_id}/analyze")
async def reanalyze_template(template_id: str):
    """
    Re-analyze a template to update placeholder mapping.
    """
    with Session(engine) as session:
        template = session.get(PptxTemplateModel, uuid.UUID(template_id))

        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

        # Re-analyze
        analysis = PPTX_TEMPLATE_SERVICE.analyze_template(template.file_path)

        # Update template
        template.placeholder_mapping = analysis["placeholder_mapping"]
        template.slide_layouts = analysis["slide_layouts"]
        template.fonts = analysis["fonts"]
        template.theme_colors = analysis["theme_colors"]
        template.updated_at = get_current_utc_datetime()

        session.add(template)
        session.commit()

        return {
            "message": "Template re-analyzed successfully",
            "placeholder_count": len(analysis["placeholder_mapping"]),
            "fonts": analysis["fonts"]
        }
