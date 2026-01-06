import json
import os
import aiohttp
from typing import Literal, Optional
import uuid
from fastapi import HTTPException
from pathvalidate import sanitize_filename
from sqlmodel import Session, select

from models.pptx_models import PptxPresentationModel
from models.presentation_and_path import PresentationAndPath
from models.sql.template import PptxTemplateModel, TemplateModel
from models.sql.presentation import PresentationModel
from services.pptx_presentation_creator import PptxPresentationCreator
from services.pptx_template_service import PPTX_TEMPLATE_SERVICE
from services.temp_file_service import TEMP_FILE_SERVICE
from utils.asset_directory_utils import get_exports_directory
from services.database import engine

# Get the Next.js app URL from environment variable or default to localhost:4000
NEXTJS_URL = os.getenv("NEXTJS_URL", "http://localhost:4000")


async def export_presentation(
    presentation_id: uuid.UUID,
    title: str,
    export_as: Literal["pptx", "pdf"],
    template_id: Optional[str] = None
) -> PresentationAndPath:
    """
    Export a presentation to PPTX or PDF.

    If template_id is provided, uses the professional template-based export
    which preserves the original PPTX template's quality.
    Otherwise, uses the default PPTX generation with template-specific styling.
    """
    if export_as == "pptx":
        # Check if we should use template-based export (custom uploaded templates)
        if template_id:
            return await export_with_template(presentation_id, title, template_id)

        # Try to find a matching custom template automatically
        auto_template = await find_matching_template(presentation_id)
        if auto_template:
            return await export_with_template(presentation_id, title, str(auto_template.id))

        # Use default PPTX generation (now with template-specific colors)
        return await export_basic_pptx(presentation_id, title)

    else:
        # PDF export
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{NEXTJS_URL}/api/export-as-pdf",
                json={
                    "id": str(presentation_id),
                    "title": sanitize_filename(title or str(uuid.uuid4())),
                },
            ) as response:
                response_json = await response.json()

        return PresentationAndPath(
            presentation_id=presentation_id,
            path=response_json["path"],
        )


async def export_with_template(
    presentation_id: uuid.UUID,
    title: str,
    template_id: str
) -> PresentationAndPath:
    """
    Export using a custom uploaded PPTX template.

    This opens the ORIGINAL PPTX template file and ONLY replaces text content.
    All design elements (shapes, images, colors, fonts, positions) are preserved.
    """
    # Get the template
    with Session(engine) as session:
        template = session.get(PptxTemplateModel, uuid.UUID(template_id))
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        template_path = template.file_path

    # Get presentation data formatted for template replacement
    slides_content = await get_presentation_content(presentation_id)

    # Use PptxTemplateService to generate from template
    # This preserves the original PPTX design and only replaces content
    output_filename = sanitize_filename(title or str(uuid.uuid4()))

    output_path = await PPTX_TEMPLATE_SERVICE.generate_from_template(
        template_path=template_path,
        slides_content=slides_content,
        output_filename=output_filename,
        options={}
    )

    return PresentationAndPath(
        presentation_id=presentation_id,
        path=output_path,
    )


async def export_basic_pptx(
    presentation_id: uuid.UUID,
    title: str
) -> PresentationAndPath:
    """
    PPTX export using the built-in templates (General, Modern, Standard, Swift).

    The template-specific colors are now applied in the Next.js API
    (presentation_to_pptx_model) based on the layout_group of each slide.
    """
    # Get the converted PPTX model from the Next.js service
    # This now includes template-specific colors based on layout_group
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"{NEXTJS_URL}/api/presentation_to_pptx_model?id={presentation_id}"
        ) as response:
            if response.status != 200:
                error_text = await response.text()
                print(f"Failed to get PPTX model: {error_text}")
                raise HTTPException(
                    status_code=500,
                    detail="Failed to convert presentation to PPTX model",
                )
            pptx_model_data = await response.json()

    # Create PPTX file using the converted model
    pptx_model = PptxPresentationModel(**pptx_model_data)
    temp_dir = TEMP_FILE_SERVICE.create_temp_dir()
    pptx_creator = PptxPresentationCreator(pptx_model, temp_dir)
    await pptx_creator.create_ppt()

    export_directory = get_exports_directory()
    pptx_path = os.path.join(
        export_directory,
        f"{sanitize_filename(title or str(uuid.uuid4()))}.pptx",
    )
    pptx_creator.save(pptx_path)

    return PresentationAndPath(
        presentation_id=presentation_id,
        path=pptx_path,
    )


async def get_presentation_content(presentation_id: uuid.UUID) -> list:
    """
    Get presentation content formatted for template replacement.
    """
    async with aiohttp.ClientSession() as session:
        # Get presentation data from FastAPI backend
        async with session.get(
            f"http://localhost:8000/api/v1/ppt/presentation/{presentation_id}"
        ) as response:
            if response.status != 200:
                raise HTTPException(status_code=500, detail="Failed to get presentation")
            presentation = await response.json()

    slides_content = []
    for slide in presentation.get("slides", []):
        content = slide.get("content", {})

        # Extract content fields
        slide_data = {
            "title": content.get("title", ""),
            "subtitle": content.get("subtitle", ""),
            "body": content.get("description", content.get("body", "")),
            "speaker_notes": slide.get("speaker_note", content.get("__speaker_note__", ""))
        }

        # Handle bullets
        bullets = content.get("bullets", [])
        if bullets:
            slide_data["bullets"] = [
                b.get("title", b.get("text", str(b))) if isinstance(b, dict) else str(b)
                for b in bullets
            ]

        # Handle image
        image = content.get("image", {})
        if image and image.get("__image_url__"):
            slide_data["image"] = {
                "url": image.get("__image_url__"),
                "prompt": image.get("__image_prompt__", "")
            }

        slides_content.append(slide_data)

    return slides_content


async def find_matching_template(presentation_id: uuid.UUID) -> Optional[PptxTemplateModel]:
    """
    Try to find a matching PPTX template for the presentation.

    Looks for:
    1. Custom templates uploaded via Smart Templates (format: "custom-{uuid}")
    2. Built-in templates stored in Smart Templates (general, modern, standard, swift)

    Returns None only if no matching template is found.
    """
    with Session(engine) as session:
        # Get the presentation to find its layout
        presentation = session.get(PresentationModel, presentation_id)
        if not presentation or not presentation.layout:
            return None

        layout_name = presentation.layout.get("name", "")

        # Check if this is a custom template (format: "custom-{template_uuid}")
        if layout_name.startswith("custom-"):
            template_id_str = layout_name.replace("custom-", "")
            try:
                template_id = uuid.UUID(template_id_str)

                # Get the TemplateModel which has the pptx_template_id link
                template_meta = session.get(TemplateModel, template_id)
                if template_meta and template_meta.pptx_template_id:
                    # Get the actual PPTX template
                    pptx_template = session.get(PptxTemplateModel, template_meta.pptx_template_id)
                    if pptx_template:
                        return pptx_template
            except (ValueError, TypeError):
                # Invalid UUID format
                pass

        # Check for built-in templates (general, modern, standard, swift)
        # These are stored in Smart Templates with category="builtin"
        builtin_names = {
            "general": "Général",
            "modern": "Moderne",
            "standard": "Standard",
            "swift": "Swift"
        }

        if layout_name.lower() in builtin_names:
            template_display_name = builtin_names[layout_name.lower()]
            # Look for the built-in PPTX template
            pptx_template = session.exec(
                select(PptxTemplateModel).where(
                    PptxTemplateModel.name == template_display_name,
                    PptxTemplateModel.is_active == True
                )
            ).first()

            if pptx_template:
                return pptx_template

        # No matching template found
        return None
