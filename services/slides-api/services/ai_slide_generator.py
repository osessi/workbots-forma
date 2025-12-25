"""
AI Slide Generator - Intelligent content generation and layout selection

This service uses LLMs to:
1. Analyze content and determine optimal slide structure
2. Select best layouts from available templates
3. Generate content adapted to layout constraints
4. Handle dynamic content (variable bullet counts, text lengths)
"""

import os
import json
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict
from enum import Enum

from anthropic import Anthropic
from openai import OpenAI

from services.design_system_extractor import DesignSystem, SlideLayoutInfo, LayoutType


class LLMProvider(str, Enum):
    ANTHROPIC = "anthropic"
    OPENAI = "openai"


@dataclass
class GeneratedSlide:
    """Generated slide content"""
    slide_index: int
    layout_index: int
    layout_type: str
    title: Optional[str] = None
    subtitle: Optional[str] = None
    body: Optional[str] = None
    bullets: Optional[List[str]] = None
    image_prompt: Optional[str] = None
    speaker_notes: Optional[str] = None


@dataclass
class PresentationPlan:
    """Complete presentation plan"""
    title: str
    total_slides: int
    slides: List[GeneratedSlide]
    modules: Optional[List[Dict]] = None  # For long presentations


class AISlideGenerator:
    """
    AI-powered slide content generation and layout selection.

    Uses Claude or GPT to intelligently create presentations
    that match the design system constraints.
    """

    def __init__(self, design_system: DesignSystem):
        """
        Initialize generator with design system.

        Args:
            design_system: Extracted design system from template
        """
        self.design_system = design_system
        self.provider = self._get_provider()
        self.client = self._get_client()

    def _get_provider(self) -> LLMProvider:
        """Determine which LLM provider to use"""
        llm = os.getenv("LLM", "anthropic").lower()
        if llm == "openai":
            return LLMProvider.OPENAI
        return LLMProvider.ANTHROPIC

    def _get_client(self):
        """Get appropriate LLM client"""
        if self.provider == LLMProvider.OPENAI:
            return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        else:
            return Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    async def generate_presentation(
        self,
        topic: str,
        num_slides: int,
        language: str = "fr",
        context: Optional[str] = None,
        instructions: Optional[str] = None,
        include_images: bool = True,
    ) -> PresentationPlan:
        """
        Generate a complete presentation plan.

        Args:
            topic: Main topic/subject
            num_slides: Number of slides to generate
            language: Output language
            context: Additional context/documents
            instructions: Specific instructions
            include_images: Whether to include image prompts

        Returns:
            PresentationPlan with all slides
        """
        # Build layout descriptions for the prompt
        layout_descriptions = self._build_layout_descriptions()

        # Generate the presentation plan
        prompt = self._build_generation_prompt(
            topic=topic,
            num_slides=num_slides,
            language=language,
            context=context,
            instructions=instructions,
            layout_descriptions=layout_descriptions,
            include_images=include_images
        )

        response = await self._call_llm(prompt)
        plan = self._parse_response(response, num_slides)

        return plan

    async def adapt_content_to_layout(
        self,
        content: Dict[str, Any],
        layout: SlideLayoutInfo
    ) -> Dict[str, Any]:
        """
        Adapt content to fit a specific layout's constraints.

        Args:
            content: Raw content dict
            layout: Target layout info

        Returns:
            Adapted content that fits the layout
        """
        # Get constraints from layout
        constraints = self._get_layout_constraints(layout)

        prompt = f"""Adapte ce contenu pour qu'il rentre dans les contraintes suivantes:

Contraintes du layout:
- Titre: max {constraints.get('max_title_chars', 50)} caractères
- Corps: max {constraints.get('max_body_chars', 300)} caractères
- Bullets: max {constraints.get('max_bullets', 5)} points, max {constraints.get('max_bullet_chars', 80)} caractères chacun

Contenu original:
{json.dumps(content, ensure_ascii=False, indent=2)}

Retourne le contenu adapté en JSON avec les mêmes clés."""

        response = await self._call_llm(prompt)

        try:
            # Parse JSON from response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                return json.loads(response[json_start:json_end])
        except Exception:
            pass

        return content

    def select_best_layout(
        self,
        content_type: str,
        has_image: bool = False,
        bullet_count: int = 0
    ) -> int:
        """
        Select the best layout index for given content.

        Args:
            content_type: Type of content (intro, bullets, etc.)
            has_image: Whether content includes an image
            bullet_count: Number of bullet points

        Returns:
            Best layout index
        """
        # Map content types to layout types
        type_mapping = {
            'introduction': LayoutType.TITLE,
            'title': LayoutType.TITLE,
            'section': LayoutType.SECTION,
            'bullets': LayoutType.BULLETS,
            'key_points': LayoutType.BULLETS,
            'comparison': LayoutType.COMPARISON,
            'quote': LayoutType.QUOTE,
            'conclusion': LayoutType.CLOSING,
            'thank_you': LayoutType.CLOSING,
        }

        target_type = type_mapping.get(content_type.lower(), LayoutType.CONTENT)

        # If has image, prefer image layouts
        if has_image:
            for idx, layout in enumerate(self.design_system.layouts):
                if layout.layout_type in [LayoutType.IMAGE_LEFT, LayoutType.IMAGE_RIGHT]:
                    return idx

        # Find matching layout type
        for idx, layout in enumerate(self.design_system.layouts):
            if layout.layout_type == target_type:
                return idx

        # Default to content layout
        for idx, layout in enumerate(self.design_system.layouts):
            if layout.layout_type == LayoutType.CONTENT:
                return idx

        return min(1, len(self.design_system.layouts) - 1)

    def _build_layout_descriptions(self) -> str:
        """Build descriptions of available layouts for the prompt"""
        descriptions = []

        for idx, layout in enumerate(self.design_system.layouts):
            placeholders = []
            for ph in layout.placeholders:
                ph_desc = f"- {ph.type}: max ~{ph.max_chars or 200} caractères"
                if ph.max_lines:
                    ph_desc += f", {ph.max_lines} lignes"
                placeholders.append(ph_desc)

            desc = f"""Layout {idx} - "{layout.name}" (Type: {layout.layout_type.value})
Recommandé pour: {', '.join(layout.recommended_for)}
Éléments:
{chr(10).join(placeholders)}"""
            descriptions.append(desc)

        return "\n\n".join(descriptions)

    def _build_generation_prompt(
        self,
        topic: str,
        num_slides: int,
        language: str,
        context: Optional[str],
        instructions: Optional[str],
        layout_descriptions: str,
        include_images: bool
    ) -> str:
        """Build the main generation prompt"""
        image_instruction = """
Pour chaque slide qui bénéficierait d'une image, génère un "image_prompt"
décrivant l'image idéale en anglais (pour génération IA).
""" if include_images else ""

        return f"""Tu es un expert en création de présentations professionnelles.

TÂCHE: Crée une présentation de {num_slides} slides sur le sujet suivant:
"{topic}"

LANGUE: {language}

LAYOUTS DISPONIBLES:
{layout_descriptions}

INSTRUCTIONS SPÉCIFIQUES:
{instructions or "Aucune instruction particulière"}

CONTEXTE ADDITIONNEL:
{context or "Aucun contexte additionnel"}

{image_instruction}

RÈGLES:
1. Choisis le layout le plus approprié pour chaque slide
2. Respecte les contraintes de caractères de chaque layout
3. Les bullets doivent être concis et percutants
4. Le titre de chaque slide doit être accrocheur
5. Varie les types de layouts pour une présentation dynamique
6. Commence par un titre/intro, termine par une conclusion

RÉPONDS EN JSON avec cette structure exacte:
{{
  "title": "Titre de la présentation",
  "slides": [
    {{
      "slide_index": 0,
      "layout_index": <numéro du layout choisi>,
      "layout_type": "<type du layout>",
      "title": "Titre du slide",
      "subtitle": "Sous-titre optionnel",
      "body": "Corps de texte si applicable",
      "bullets": ["Point 1", "Point 2", ...],
      "image_prompt": "Description de l'image en anglais",
      "speaker_notes": "Notes pour le présentateur"
    }},
    ...
  ]
}}

Génère exactement {num_slides} slides."""

    async def _call_llm(self, prompt: str) -> str:
        """Call the LLM and get response"""
        if self.provider == LLMProvider.OPENAI:
            response = self.client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o"),
                messages=[
                    {"role": "system", "content": "Tu es un expert en création de présentations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=4000
            )
            return response.choices[0].message.content
        else:
            response = self.client.messages.create(
                model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),
                max_tokens=4000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            return response.content[0].text

    def _parse_response(self, response: str, expected_slides: int) -> PresentationPlan:
        """Parse LLM response into PresentationPlan"""
        try:
            # Find JSON in response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1

            if json_start >= 0 and json_end > json_start:
                data = json.loads(response[json_start:json_end])

                slides = []
                for slide_data in data.get('slides', []):
                    slide = GeneratedSlide(
                        slide_index=slide_data.get('slide_index', len(slides)),
                        layout_index=slide_data.get('layout_index', 1),
                        layout_type=slide_data.get('layout_type', 'content'),
                        title=slide_data.get('title'),
                        subtitle=slide_data.get('subtitle'),
                        body=slide_data.get('body'),
                        bullets=slide_data.get('bullets'),
                        image_prompt=slide_data.get('image_prompt'),
                        speaker_notes=slide_data.get('speaker_notes'),
                    )
                    slides.append(slide)

                return PresentationPlan(
                    title=data.get('title', 'Présentation'),
                    total_slides=len(slides),
                    slides=slides
                )
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")

        # Return empty plan if parsing fails
        return PresentationPlan(
            title="Présentation",
            total_slides=0,
            slides=[]
        )

    def _get_layout_constraints(self, layout: SlideLayoutInfo) -> Dict[str, int]:
        """Get content constraints from layout"""
        constraints = {
            'max_title_chars': 60,
            'max_body_chars': 400,
            'max_bullets': 6,
            'max_bullet_chars': 100,
        }

        for ph in layout.placeholders:
            if ph.type in ['title', 'center_title']:
                constraints['max_title_chars'] = ph.max_chars or 60
            elif ph.type == 'body':
                constraints['max_body_chars'] = ph.max_chars or 400
                constraints['max_bullets'] = ph.max_lines or 6

        return constraints


async def generate_slides_with_ai(
    design_system: DesignSystem,
    topic: str,
    num_slides: int,
    language: str = "fr",
    context: Optional[str] = None,
    instructions: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Convenience function to generate slides using AI.

    Args:
        design_system: Design system from template
        topic: Presentation topic
        num_slides: Number of slides
        language: Output language
        context: Additional context
        instructions: Specific instructions

    Returns:
        List of slide content dicts ready for PPTX builder
    """
    generator = AISlideGenerator(design_system)
    plan = await generator.generate_presentation(
        topic=topic,
        num_slides=num_slides,
        language=language,
        context=context,
        instructions=instructions
    )

    # Convert to dict format for builder
    slides_content = []
    for slide in plan.slides:
        content = {
            'title': slide.title,
            'subtitle': slide.subtitle,
            'body': slide.body,
            'bullets': slide.bullets,
            'image_prompt': slide.image_prompt,
            'speaker_notes': slide.speaker_notes,
            'layout_index': slide.layout_index,
            'layout_type': slide.layout_type,
        }
        slides_content.append(content)

    return slides_content
