from datetime import datetime
from typing import Optional, List
import uuid
from sqlalchemy import Column, DateTime, JSON
from sqlmodel import SQLModel, Field

from utils.datetime_utils import get_current_utc_datetime


class TemplateModel(SQLModel, table=True):
    __tablename__ = "templates"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        description="UUID for the template (matches presentation_id)",
    )
    name: str = Field(description="Human friendly template name")
    description: Optional[str] = Field(
        default=None, description="Optional template description"
    )
    # Link to original PPTX template for high-quality export
    pptx_template_id: Optional[uuid.UUID] = Field(
        default=None,
        description="Reference to PptxTemplateModel for high-quality PPTX export"
    )
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), nullable=False, default=get_current_utc_datetime
        ),
    )


class PptxTemplateModel(SQLModel, table=True):
    """
    Stores PPTX template files for high-quality export.
    The original PPTX file is preserved and used as a base for content replacement.
    """
    __tablename__ = "pptx_templates"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        description="Unique identifier for the PPTX template",
    )
    name: str = Field(description="Template display name")
    description: Optional[str] = Field(
        default=None, description="Template description"
    )
    category: str = Field(
        default="general", description="Template category (general, business, education, etc.)"
    )

    # File storage
    file_path: str = Field(description="Path to the original PPTX file")
    file_size: int = Field(default=0, description="File size in bytes")

    # Template metadata
    slide_count: int = Field(default=0, description="Number of slides in template")
    thumbnail_path: Optional[str] = Field(
        default=None, description="Path to template thumbnail image"
    )

    # Placeholder mapping - stores info about editable regions
    # Format: [{"slide_index": 0, "shape_name": "Title", "placeholder_type": "title", "default_text": "..."}]
    placeholder_mapping: Optional[List[dict]] = Field(
        default=None,
        sa_column=Column(JSON),
        description="Mapping of placeholder shapes for content replacement"
    )

    # Slide layout info - which slide to use for which purpose
    # Format: {"intro": 0, "content": 1, "bullets": 2, "conclusion": 3}
    slide_layouts: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSON),
        description="Mapping of slide indices to layout purposes"
    )

    # Fonts used in template
    fonts: Optional[List[str]] = Field(
        default=None,
        sa_column=Column(JSON),
        description="List of fonts used in the template"
    )

    # Theme colors extracted from template
    theme_colors: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSON),
        description="Theme colors extracted from template"
    )

    is_active: bool = Field(default=True, description="Whether template is available for use")
    is_system: bool = Field(default=False, description="System template vs user uploaded")

    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), nullable=False, default=get_current_utc_datetime
        ),
    )
    updated_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), nullable=False, default=get_current_utc_datetime
        ),
    )
