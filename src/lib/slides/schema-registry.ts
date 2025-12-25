/**
 * Schema Registry - Centralizes all slide template schemas
 * Converts Zod schemas to JSON Schema for the backend API
 */
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ZodTypeAny } from 'zod';

// General templates
import { Schema as BasicInfoSchema, layoutName as BasicInfoName, layoutDescription as BasicInfoDesc } from '@/components/slides/presentation-templates/general/BasicInfoSlideLayout';
import { Schema as BulletIconsOnlySchema, layoutName as BulletIconsOnlyName, layoutDescription as BulletIconsOnlyDesc } from '@/components/slides/presentation-templates/general/BulletIconsOnlySlideLayout';
import { Schema as BulletWithIconsSchema, layoutName as BulletWithIconsName, layoutDescription as BulletWithIconsDesc } from '@/components/slides/presentation-templates/general/BulletWithIconsSlideLayout';
import { Schema as ChartWithBulletsSchema, layoutName as ChartWithBulletsName, layoutDescription as ChartWithBulletsDesc } from '@/components/slides/presentation-templates/general/ChartWithBulletsSlideLayout';
import { Schema as IntroSchema, layoutName as IntroName, layoutDescription as IntroDesc } from '@/components/slides/presentation-templates/general/IntroSlideLayout';
import { Schema as MetricsSchema, layoutName as MetricsName, layoutDescription as MetricsDesc } from '@/components/slides/presentation-templates/general/MetricsSlideLayout';
import { Schema as MetricsWithImageSchema, layoutName as MetricsWithImageName, layoutDescription as MetricsWithImageDesc } from '@/components/slides/presentation-templates/general/MetricsWithImageSlideLayout';
import { Schema as NumberedBulletsSchema, layoutName as NumberedBulletsName, layoutDescription as NumberedBulletsDesc } from '@/components/slides/presentation-templates/general/NumberedBulletsSlideLayout';
import { Schema as QuoteSchema, layoutName as QuoteName, layoutDescription as QuoteDesc } from '@/components/slides/presentation-templates/general/QuoteSlideLayout';
import { Schema as TableInfoSchema, layoutName as TableInfoName, layoutDescription as TableInfoDesc } from '@/components/slides/presentation-templates/general/TableInfoSlideLayout';
import { Schema as TableOfContentsSchema, layoutName as TableOfContentsName, layoutDescription as TableOfContentsDesc } from '@/components/slides/presentation-templates/general/TableOfContentsSlideLayout';
import { Schema as TeamSchema, layoutName as TeamName, layoutDescription as TeamDesc } from '@/components/slides/presentation-templates/general/TeamSlideLayout';

// Modern templates
import { Schema as ModernIntroSchema, layoutName as ModernIntroName, layoutDescription as ModernIntroDesc } from '@/components/slides/presentation-templates/modern/1IntroSlideLayout';
import { Schema as AboutCompanySchema, layoutName as AboutCompanyName, layoutDescription as AboutCompanyDesc } from '@/components/slides/presentation-templates/modern/2AboutCompanySlideLayout';
import { Schema as ProblemSchema, layoutName as ProblemName, layoutDescription as ProblemDesc } from '@/components/slides/presentation-templates/modern/3ProblemSlideLayout';
import { Schema as SolutionSchema, layoutName as SolutionName, layoutDescription as SolutionDesc } from '@/components/slides/presentation-templates/modern/4SolutionSlideLayout';
import { Schema as ProductOverviewSchema, layoutName as ProductOverviewName, layoutDescription as ProductOverviewDesc } from '@/components/slides/presentation-templates/modern/5ProductOverviewSlideLayout';
import { Schema as MarketSizeSchema, layoutName as MarketSizeName, layoutDescription as MarketSizeDesc } from '@/components/slides/presentation-templates/modern/6MarketSizeSlideLayout';
import { Schema as MarketValidationSchema, layoutName as MarketValidationName, layoutDescription as MarketValidationDesc } from '@/components/slides/presentation-templates/modern/7MarketValidationSlideLayout';
import { Schema as CompanyTractionSchema, layoutName as CompanyTractionName, layoutDescription as CompanyTractionDesc } from '@/components/slides/presentation-templates/modern/8CompanyTractionSlideLayout';
import { Schema as BusinessModelSchema, layoutName as BusinessModelName, layoutDescription as BusinessModelDesc } from '@/components/slides/presentation-templates/modern/9BusinessModelSlideLayout';
import { Schema as ModernTeamSchema, layoutName as ModernTeamName, layoutDescription as ModernTeamDesc } from '@/components/slides/presentation-templates/modern/z10TeamSlideLayout';
import { Schema as ThankYouSchema, layoutName as ThankYouName, layoutDescription as ThankYouDesc } from '@/components/slides/presentation-templates/modern/z11ThankYouSlideLayout';

// Standard templates
import { Schema as StandardIntroSchema, layoutName as StandardIntroName, layoutDescription as StandardIntroDesc } from '@/components/slides/presentation-templates/standard/IntroSlideLayout';
import { Schema as ChartLeftTextRightSchema, layoutName as ChartLeftTextRightName, layoutDescription as ChartLeftTextRightDesc } from '@/components/slides/presentation-templates/standard/ChartLeftTextRightLayout';
import { Schema as ContactSchema, layoutName as ContactName, layoutDescription as ContactDesc } from '@/components/slides/presentation-templates/standard/ContactLayout';
import { Schema as HeadingBulletImageDescSchema, layoutName as HeadingBulletImageDescName, layoutDescription as HeadingBulletImageDescDesc } from '@/components/slides/presentation-templates/standard/HeadingBulletImageDescriptionLayout';
import { Schema as IconBulletDescSchema, layoutName as IconBulletDescName, layoutDescription as IconBulletDescDesc } from '@/components/slides/presentation-templates/standard/IconBulletDescriptionLayout';
import { Schema as IconImageDescSchema, layoutName as IconImageDescName, layoutDescription as IconImageDescDesc } from '@/components/slides/presentation-templates/standard/IconImageDescriptionLayout';
import { Schema as ImageListWithDescSchema, layoutName as ImageListWithDescName, layoutDescription as ImageListWithDescDesc } from '@/components/slides/presentation-templates/standard/ImageListWithDescriptionLayout';
import { Schema as MetricsDescSchema, layoutName as MetricsDescName, layoutDescription as MetricsDescDesc } from '@/components/slides/presentation-templates/standard/MetricsDescriptionLayout';
import { Schema as NumberedBulletSingleImageSchema, layoutName as NumberedBulletSingleImageName, layoutDescription as NumberedBulletSingleImageDesc } from '@/components/slides/presentation-templates/standard/NumberedBulletSingleImageLayout';
import { Schema as StandardTableOfContentsSchema, layoutName as StandardTableOfContentsName, layoutDescription as StandardTableOfContentsDesc } from '@/components/slides/presentation-templates/standard/TableOfContentsLayout';
import { Schema as VisualMetricsSchema, layoutName as VisualMetricsName, layoutDescription as VisualMetricsDesc } from '@/components/slides/presentation-templates/standard/VisualMetricsSlideLayout';

// Swift templates
import { Schema as SwiftBulletsWithIconsSchema, layoutName as SwiftBulletsWithIconsName, layoutDescription as SwiftBulletsWithIconsDesc } from '@/components/slides/presentation-templates/swift/BulletsWithIconsTitleDescription';
import { Schema as SwiftIconBulletListSchema, layoutName as SwiftIconBulletListName, layoutDescription as SwiftIconBulletListDesc } from '@/components/slides/presentation-templates/swift/IconBulletListDescription';
import { Schema as SwiftImageListSchema, layoutName as SwiftImageListName, layoutDescription as SwiftImageListDesc } from '@/components/slides/presentation-templates/swift/ImageListDescription';
import { Schema as SwiftIntroSchema, layoutName as SwiftIntroName, layoutDescription as SwiftIntroDesc } from '@/components/slides/presentation-templates/swift/IntroSlideLayout';
import { Schema as SwiftMetricsSchema, layoutName as SwiftMetricsName, layoutDescription as SwiftMetricsDesc } from '@/components/slides/presentation-templates/swift/MetricsNumbers';
import { Schema as SwiftSimpleBulletSchema, layoutName as SwiftSimpleBulletName, layoutDescription as SwiftSimpleBulletDesc } from '@/components/slides/presentation-templates/swift/SimpleBulletPointsLayout';
import { Schema as SwiftTableOfContentsSchema, layoutName as SwiftTableOfContentsName, layoutDescription as SwiftTableOfContentsDesc } from '@/components/slides/presentation-templates/swift/TableOfContents';
import { Schema as SwiftTableOrChartSchema, layoutName as SwiftTableOrChartName, layoutDescription as SwiftTableOrChartDesc } from '@/components/slides/presentation-templates/swift/TableorChart';
import { Schema as SwiftTimelineSchema, layoutName as SwiftTimelineName, layoutDescription as SwiftTimelineDesc } from '@/components/slides/presentation-templates/swift/Timeline';

interface TemplateSchema {
  schema: ZodTypeAny;
  name: string;
  description: string;
}

interface SlideLayoutWithSchema {
  id: string;
  name: string;
  description: string;
  json_schema: Record<string, unknown>;
}

interface TemplateGroup {
  name: string;
  ordered: boolean;
  slides: SlideLayoutWithSchema[];
}

// Registry of all template schemas by group
const schemaRegistry: Record<string, TemplateSchema[]> = {
  general: [
    { schema: BasicInfoSchema, name: BasicInfoName, description: BasicInfoDesc },
    { schema: BulletIconsOnlySchema, name: BulletIconsOnlyName, description: BulletIconsOnlyDesc },
    { schema: BulletWithIconsSchema, name: BulletWithIconsName, description: BulletWithIconsDesc },
    { schema: ChartWithBulletsSchema, name: ChartWithBulletsName, description: ChartWithBulletsDesc },
    { schema: IntroSchema, name: IntroName, description: IntroDesc },
    { schema: MetricsSchema, name: MetricsName, description: MetricsDesc },
    { schema: MetricsWithImageSchema, name: MetricsWithImageName, description: MetricsWithImageDesc },
    { schema: NumberedBulletsSchema, name: NumberedBulletsName, description: NumberedBulletsDesc },
    { schema: QuoteSchema, name: QuoteName, description: QuoteDesc },
    { schema: TableInfoSchema, name: TableInfoName, description: TableInfoDesc },
    { schema: TableOfContentsSchema, name: TableOfContentsName, description: TableOfContentsDesc },
    { schema: TeamSchema, name: TeamName, description: TeamDesc },
  ],
  modern: [
    { schema: ModernIntroSchema, name: ModernIntroName, description: ModernIntroDesc },
    { schema: AboutCompanySchema, name: AboutCompanyName, description: AboutCompanyDesc },
    { schema: ProblemSchema, name: ProblemName, description: ProblemDesc },
    { schema: SolutionSchema, name: SolutionName, description: SolutionDesc },
    { schema: ProductOverviewSchema, name: ProductOverviewName, description: ProductOverviewDesc },
    { schema: MarketSizeSchema, name: MarketSizeName, description: MarketSizeDesc },
    { schema: MarketValidationSchema, name: MarketValidationName, description: MarketValidationDesc },
    { schema: CompanyTractionSchema, name: CompanyTractionName, description: CompanyTractionDesc },
    { schema: BusinessModelSchema, name: BusinessModelName, description: BusinessModelDesc },
    { schema: ModernTeamSchema, name: ModernTeamName, description: ModernTeamDesc },
    { schema: ThankYouSchema, name: ThankYouName, description: ThankYouDesc },
  ],
  standard: [
    { schema: StandardIntroSchema, name: StandardIntroName, description: StandardIntroDesc },
    { schema: ChartLeftTextRightSchema, name: ChartLeftTextRightName, description: ChartLeftTextRightDesc },
    { schema: ContactSchema, name: ContactName, description: ContactDesc },
    { schema: HeadingBulletImageDescSchema, name: HeadingBulletImageDescName, description: HeadingBulletImageDescDesc },
    { schema: IconBulletDescSchema, name: IconBulletDescName, description: IconBulletDescDesc },
    { schema: IconImageDescSchema, name: IconImageDescName, description: IconImageDescDesc },
    { schema: ImageListWithDescSchema, name: ImageListWithDescName, description: ImageListWithDescDesc },
    { schema: MetricsDescSchema, name: MetricsDescName, description: MetricsDescDesc },
    { schema: NumberedBulletSingleImageSchema, name: NumberedBulletSingleImageName, description: NumberedBulletSingleImageDesc },
    { schema: StandardTableOfContentsSchema, name: StandardTableOfContentsName, description: StandardTableOfContentsDesc },
    { schema: VisualMetricsSchema, name: VisualMetricsName, description: VisualMetricsDesc },
  ],
  swift: [
    { schema: SwiftIntroSchema, name: SwiftIntroName, description: SwiftIntroDesc },
    { schema: SwiftBulletsWithIconsSchema, name: SwiftBulletsWithIconsName, description: SwiftBulletsWithIconsDesc },
    { schema: SwiftIconBulletListSchema, name: SwiftIconBulletListName, description: SwiftIconBulletListDesc },
    { schema: SwiftImageListSchema, name: SwiftImageListName, description: SwiftImageListDesc },
    { schema: SwiftMetricsSchema, name: SwiftMetricsName, description: SwiftMetricsDesc },
    { schema: SwiftSimpleBulletSchema, name: SwiftSimpleBulletName, description: SwiftSimpleBulletDesc },
    { schema: SwiftTableOfContentsSchema, name: SwiftTableOfContentsName, description: SwiftTableOfContentsDesc },
    { schema: SwiftTableOrChartSchema, name: SwiftTableOrChartName, description: SwiftTableOrChartDesc },
    { schema: SwiftTimelineSchema, name: SwiftTimelineName, description: SwiftTimelineDesc },
  ],
};

/**
 * Convert a Zod schema to JSON Schema
 */
function convertToJsonSchema(zodSchema: ZodTypeAny): Record<string, unknown> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsonSchema = zodToJsonSchema(zodSchema as any, {
      $refStrategy: 'none',
      target: 'jsonSchema7',
    });

    // Remove $schema and other meta fields that the backend doesn't need
    const { $schema, ...cleanSchema } = jsonSchema as Record<string, unknown>;
    return cleanSchema;
  } catch (error) {
    console.error('Error converting schema:', error);
    return { type: 'object', properties: {} };
  }
}

/**
 * Get all templates for a specific group with their JSON schemas
 */
export function getTemplateGroup(groupName: string): TemplateGroup | null {
  const normalizedName = groupName.toLowerCase();
  const schemas = schemaRegistry[normalizedName];

  if (!schemas) {
    return null;
  }

  const slides: SlideLayoutWithSchema[] = schemas.map((item, index) => ({
    id: String(index),
    name: item.name,
    description: item.description,
    json_schema: convertToJsonSchema(item.schema),
  }));

  return {
    name: normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1),
    ordered: normalizedName === 'modern', // Modern templates are ordered
    slides,
  };
}

/**
 * Get all available template group names
 */
export function getAvailableGroups(): string[] {
  return Object.keys(schemaRegistry);
}

/**
 * Get a specific template's JSON schema by group and index
 */
export function getTemplateSchema(groupName: string, index: number): Record<string, unknown> | null {
  const normalizedName = groupName.toLowerCase();
  const schemas = schemaRegistry[normalizedName];

  if (!schemas || index < 0 || index >= schemas.length) {
    return null;
  }

  return convertToJsonSchema(schemas[index].schema);
}
