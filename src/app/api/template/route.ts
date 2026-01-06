// ===========================================
// API Route: GET /api/template?group=<template_name>
// Returns layout schemas for slide generation backend
// ===========================================

import { NextRequest, NextResponse } from "next/server";

// Schema des layouts pour chaque groupe de templates
const TEMPLATE_LAYOUTS: Record<string, {
  name: string;
  ordered: boolean;
  slides: Array<{
    id: string;
    name: string;
    description: string;
    json_schema: Record<string, unknown>;
  }>;
}> = {
  general: {
    name: "General",
    ordered: false,
    slides: [
      {
        id: "general-intro-slide",
        name: "Intro Slide",
        description: "A clean slide layout with title, description text, presenter info, and a supporting image.",
        json_schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              minLength: 3,
              maxLength: 40,
              description: "Main title of the slide"
            },
            description: {
              type: "string",
              minLength: 10,
              maxLength: 150,
              description: "Main description text content"
            },
            presenterName: {
              type: "string",
              minLength: 2,
              maxLength: 50,
              description: "Name of the presenter"
            },
            presentationDate: {
              type: "string",
              minLength: 2,
              maxLength: 50,
              description: "Date of the presentation"
            },
            image: {
              type: "object",
              properties: {
                __image_url__: { type: "string" },
                __image_prompt__: { type: "string", description: "Image description for generation" }
              }
            }
          },
          required: ["title", "description"]
        }
      },
      {
        id: "general-bullets-with-icons",
        name: "Bullet Points with Icons",
        description: "Slide with title and bullet points, each with an icon and description.",
        json_schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              minLength: 3,
              maxLength: 60,
              description: "Main title of the slide"
            },
            bullets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Bullet point title" },
                  description: { type: "string", description: "Bullet point description" },
                  icon: { type: "string", description: "Icon name from Lucide icons" }
                },
                required: ["title", "description"]
              },
              minItems: 2,
              maxItems: 6
            }
          },
          required: ["title", "bullets"]
        }
      },
      {
        id: "general-basic-info",
        name: "Basic Info",
        description: "Simple slide with title, description, and optional image.",
        json_schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              minLength: 3,
              maxLength: 60,
              description: "Main title of the slide"
            },
            description: {
              type: "string",
              minLength: 10,
              maxLength: 300,
              description: "Main content text"
            },
            image: {
              type: "object",
              properties: {
                __image_url__: { type: "string" },
                __image_prompt__: { type: "string" }
              }
            }
          },
          required: ["title", "description"]
        }
      },
      {
        id: "general-numbered-bullets",
        name: "Numbered Bullets",
        description: "Slide with numbered list of key points.",
        json_schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              minLength: 3,
              maxLength: 60,
              description: "Main title of the slide"
            },
            bullets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Point title" },
                  description: { type: "string", description: "Point description" }
                },
                required: ["title", "description"]
              },
              minItems: 2,
              maxItems: 5
            }
          },
          required: ["title", "bullets"]
        }
      },
      {
        id: "general-quote",
        name: "Quote Slide",
        description: "Slide featuring a prominent quote with attribution.",
        json_schema: {
          type: "object",
          properties: {
            quote: {
              type: "string",
              minLength: 10,
              maxLength: 200,
              description: "The quote text"
            },
            author: {
              type: "string",
              minLength: 2,
              maxLength: 50,
              description: "Quote author name"
            },
            authorTitle: {
              type: "string",
              maxLength: 50,
              description: "Author's title or role"
            }
          },
          required: ["quote", "author"]
        }
      },
      {
        id: "general-metrics",
        name: "Metrics Slide",
        description: "Slide displaying key metrics and statistics.",
        json_schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              minLength: 3,
              maxLength: 60,
              description: "Slide title"
            },
            metrics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  value: { type: "string", description: "Metric value (e.g., '95%', '$1.2M')" },
                  label: { type: "string", description: "Metric label" },
                  description: { type: "string", description: "Brief description" }
                },
                required: ["value", "label"]
              },
              minItems: 2,
              maxItems: 4
            }
          },
          required: ["title", "metrics"]
        }
      },
      {
        id: "general-table-of-contents",
        name: "Table of Contents",
        description: "Slide showing presentation outline or agenda.",
        json_schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              default: "Sommaire",
              description: "Slide title"
            },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Section title" },
                  description: { type: "string", description: "Brief description" }
                },
                required: ["title"]
              },
              minItems: 2,
              maxItems: 8
            }
          },
          required: ["title", "items"]
        }
      },
      {
        id: "general-team",
        name: "Team Slide",
        description: "Slide showcasing team members.",
        json_schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              default: "Notre équipe",
              description: "Slide title"
            },
            members: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Team member name" },
                  role: { type: "string", description: "Role or title" },
                  image: {
                    type: "object",
                    properties: {
                      __image_url__: { type: "string" },
                      __image_prompt__: { type: "string" }
                    }
                  }
                },
                required: ["name", "role"]
              },
              minItems: 2,
              maxItems: 6
            }
          },
          required: ["title", "members"]
        }
      }
    ]
  },
  modern: {
    name: "Modern",
    ordered: false,
    slides: [
      {
        id: "modern-intro-slide",
        name: "Modern Intro",
        description: "Dark-themed intro slide with bold typography.",
        json_schema: {
          type: "object",
          properties: {
            title: { type: "string", minLength: 3, maxLength: 50, description: "Main title" },
            subtitle: { type: "string", maxLength: 100, description: "Subtitle or tagline" },
            presenterName: { type: "string", description: "Presenter name" },
            presentationDate: { type: "string", description: "Date" },
            image: {
              type: "object",
              properties: {
                __image_url__: { type: "string" },
                __image_prompt__: { type: "string" }
              }
            }
          },
          required: ["title"]
        }
      },
      {
        id: "modern-bullets",
        name: "Modern Bullets",
        description: "Clean bullet points with modern styling.",
        json_schema: {
          type: "object",
          properties: {
            title: { type: "string", minLength: 3, maxLength: 60, description: "Slide title" },
            bullets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" }
                },
                required: ["title"]
              },
              minItems: 2,
              maxItems: 5
            }
          },
          required: ["title", "bullets"]
        }
      },
      {
        id: "modern-problem",
        name: "Problem Statement",
        description: "Slide highlighting a problem or challenge.",
        json_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Problem title" },
            description: { type: "string", description: "Problem description" },
            points: {
              type: "array",
              items: { type: "string" },
              description: "Key problem points"
            }
          },
          required: ["title", "description"]
        }
      },
      {
        id: "modern-solution",
        name: "Solution",
        description: "Slide presenting a solution.",
        json_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Solution title" },
            description: { type: "string", description: "Solution description" },
            benefits: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" }
                }
              }
            }
          },
          required: ["title", "description"]
        }
      },
      {
        id: "modern-metrics",
        name: "Modern Metrics",
        description: "Key metrics with modern dark theme.",
        json_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Section title" },
            metrics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  value: { type: "string" },
                  label: { type: "string" },
                  change: { type: "string", description: "Change indicator like +15%" }
                }
              },
              minItems: 2,
              maxItems: 4
            }
          },
          required: ["metrics"]
        }
      }
    ]
  },
  standard: {
    name: "Standard",
    ordered: false,
    slides: [
      {
        id: "standard-intro-slide",
        name: "Standard Intro",
        description: "Professional intro slide with classic layout.",
        json_schema: {
          type: "object",
          properties: {
            title: { type: "string", minLength: 3, maxLength: 50, description: "Presentation title" },
            subtitle: { type: "string", maxLength: 100, description: "Subtitle" },
            presenterName: { type: "string", description: "Presenter" },
            presentationDate: { type: "string", description: "Date" }
          },
          required: ["title"]
        }
      },
      {
        id: "standard-bullets",
        name: "Standard Bullets",
        description: "Classic bullet point slide.",
        json_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Slide title" },
            bullets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" }
                }
              },
              minItems: 2,
              maxItems: 6
            }
          },
          required: ["title", "bullets"]
        }
      },
      {
        id: "standard-two-column",
        name: "Two Column",
        description: "Two-column layout for comparison.",
        json_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Slide title" },
            leftColumn: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" }
              }
            },
            rightColumn: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" }
              }
            }
          },
          required: ["title"]
        }
      },
      {
        id: "standard-image-text",
        name: "Image with Text",
        description: "Image alongside text content.",
        json_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Slide title" },
            description: { type: "string", description: "Content text" },
            image: {
              type: "object",
              properties: {
                __image_url__: { type: "string" },
                __image_prompt__: { type: "string" }
              }
            }
          },
          required: ["title", "description"]
        }
      }
    ]
  },
  swift: {
    name: "Swift",
    ordered: false,
    slides: [
      {
        id: "swift-intro-slide",
        name: "Swift Intro",
        description: "Minimalist intro with warm colors.",
        json_schema: {
          type: "object",
          properties: {
            title: { type: "string", minLength: 3, maxLength: 40, description: "Title" },
            tagline: { type: "string", maxLength: 80, description: "Tagline" },
            presenterName: { type: "string", description: "Presenter" }
          },
          required: ["title"]
        }
      },
      {
        id: "swift-bullets",
        name: "Swift Bullets",
        description: "Dynamic bullet points.",
        json_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Slide title" },
            bullets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  icon: { type: "string" }
                }
              },
              minItems: 2,
              maxItems: 4
            }
          },
          required: ["title", "bullets"]
        }
      },
      {
        id: "swift-highlight",
        name: "Highlight",
        description: "Single key message highlight.",
        json_schema: {
          type: "object",
          properties: {
            headline: { type: "string", description: "Main headline" },
            subtext: { type: "string", description: "Supporting text" }
          },
          required: ["headline"]
        }
      },
      {
        id: "swift-closing",
        name: "Closing Slide",
        description: "Conclusion or call-to-action slide.",
        json_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Closing message" },
            callToAction: { type: "string", description: "Call to action text" },
            contactInfo: { type: "string", description: "Contact information" }
          },
          required: ["title"]
        }
      }
    ]
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get("group") || "general";

    const layout = TEMPLATE_LAYOUTS[group.toLowerCase()];

    if (!layout) {
      return NextResponse.json(
        { error: `Template group '${group}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(layout);
  } catch (error) {
    console.error("Error in /api/template:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du template" },
      { status: 500 }
    );
  }
}
