import { NextResponse } from 'next/server';
import { getTemplateGroup, getAvailableGroups } from '@/lib/slides/schema-registry';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group');

    if (!group) {
      // Return list of available groups
      const groups = getAvailableGroups();
      return NextResponse.json({ groups });
    }

    // Get the template group with properly converted JSON schemas
    const templateGroup = await getTemplateGroup(group);

    if (!templateGroup) {
      return NextResponse.json(
        { error: `Template group '${group}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(templateGroup);
  } catch (error) {
    console.error('Error loading template:', error);
    return NextResponse.json(
      { error: 'Failed to load template' },
      { status: 500 }
    );
  }
}
