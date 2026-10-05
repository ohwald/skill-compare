---
name: baoyu-xhs-images
description: Xiaohongshu (Little Red Book) infographic series generator with multiple style options. Breaks down content into 1-10 cartoon-style infographics. Use when user asks to create "小红书图片", "XHS images", or "RedNote infographics".
---

# Xiaohongshu Infographic Series Generator

Break down complex content into eye-catching infographic series for Xiaohongshu with multiple style options.

## Usage

```bash
# Auto-select style and layout based on content
/baoyu-xhs-images posts/ai-future/article.md

# Specify style
/baoyu-xhs-images posts/ai-future/article.md --style notion

# Specify layout
/baoyu-xhs-images posts/ai-future/article.md --layout dense

# Combine style and layout
/baoyu-xhs-images posts/ai-future/article.md --style tech --layout list

# Direct content input
/baoyu-xhs-images
[paste content]

# Direct input with options
/baoyu-xhs-images --style bold --layout comparison
[paste content]
```

## Options

| Option | Description |
|--------|-------------|
| `--style <name>` | Visual style (see Style Gallery) |
| `--layout <name>` | Information layout (see Layout Gallery) |

## Two Dimensions

| Dimension | Controls | Options |
|-----------|----------|---------|
| **Style** | Visual aesthetics: colors, lines, decorations | cute, fresh, tech, warm, bold, minimal, retro, pop, notion |
| **Layout** | Information structure: density, arrangement | sparse, balanced, dense, list, comparison, flow |

Style × Layout can be freely combined. Example: `--style notion --layout dense` creates an intellectual-looking knowledge card with high information density.

## Style Gallery

| Style | Description |
|-------|-------------|
| `cute` (Default) | Sweet, adorable, girly - classic Xiaohongshu aesthetic |
| `fresh` | Clean, refreshing, natural |
| `tech` | Modern, smart, digital |
| `warm` | Cozy, friendly, approachable |
| `bold` | High impact, attention-grabbing |
| `minimal` | Ultra-clean, sophisticated |
| `retro` | Vintage, nostalgic, trendy |
| `pop` | Vibrant, energetic, eye-catching |
| `notion` | Minimalist hand-drawn line art, intellectual |

Detailed style definitions: `references/styles/<style>.md`

## Layout Gallery

| Layout | Description |
|--------|-------------|
| `sparse` (Default) | Minimal information, maximum impact (1-2 points) |
| `balanced` | Standard content layout (3-4 points) |
| `dense` | High information density, knowledge card style (5-8 points) |
| `list` | Enumeration and ranking format (4-7 items) |
| `comparison` | Side-by-side contrast layout |
| `flow` | Process and timeline layout (3-6 steps) |

Detailed layout definitions: `references/layouts/<layout>.md`

## Auto Style Selection

When no `--style` is specified, analyze content to select:

| Content Signals | Selected Style |
|----------------|----------------|
| Beauty, fashion, cute, girl, pink | `cute` |
| Health, nature, clean, fresh, organic | `fresh` |
| Tech, AI, code, digital, app, tool | `tech` |
| Life, story, emotion, feeling, warm | `warm` |
| Warning, important, must, critical | `bold` |
| Professional, business, elegant, simple | `minimal` |
| Classic, vintage, old, traditional | `retro` |
| Fun, exciting, wow, amazing | `pop` |
| Knowledge, concept, productivity, SaaS, notion | `notion` |

## Auto Layout Selection

When no `--layout` is specified, analyze content structure to select:

| Content Signals | Selected Layout |
|----------------|-----------------|
| Single quote, one key point, cover | `sparse` |
| 3-4 points, explanation, tutorial | `balanced` |
| 5+ points, summary, cheat sheet, 干货 | `dense` |
| Numbered items, top N, checklist, steps | `list` |
| vs, compare, before/after, pros/cons | `comparison` |
| Process, flow, timeline, steps with order | `flow` |

**Layout by Position**:
| Position | Recommended Layout |
|----------|-------------------|
| Cover | `sparse` |
| Content | `balanced` or content-appropriate |
| Ending | `sparse` or `balanced` |

## File Management

### With Article Path

Save to `xhs-images/` subdirectory in the same folder as the article:

```
posts/ai-future/
├── article.md
└── xhs-images/
    ├── outline.md
    ├── prompts/
    │   ├── 01-cover.md
    │   ├── 02-content-1.md
    │   └── ...
    ├── 01-cover.png
    ├── 02-content-1.png
    └── 03-ending.png
```

### Without Article Path (Pasted Content)

Save to `xhs-outputs/YYYY-MM-DD/[topic-slug]/`:

```
xhs-outputs/
└── 2026-01-13/
    └── ai-agent-guide/
        ├── source.md           # Saved pasted content
        ├── outline.md
        ├── prompts/
        │   ├── 01-cover.md
        │   └── ...
        ├── 01-cover.png
        └── 02-ending.png
```

## Workflow

### Step 1: Analyze Content & Select Style/Layout

1. **Save source content** (if not already a file):
   - If user provides a file path: use as-is
   - If user pastes content: save to `source.md` in target directory
2. Read content
3. If `--style` specified, use that style; otherwise auto-select 3 candidates
4. If `--layout` specified, use that layout; otherwise auto-select per image
5. **Language detection**:
   - Detect **source language** from content
   - Detect **user language** from conversation context
   - Note if source_language ≠ user_language (will ask in Step 4)
6. Determine image count based on content complexity:

| Content Type | Image Count |
|-------------|-------------|
| Simple opinion / single topic | 2-3 |
| Medium complexity / tutorial | 4-6 |
| Deep dive / multi-dimensional | 7-10 |

**Note**: Layout can vary per image in a series. Cover typically uses `sparse`, content pages use `balanced`/`dense`/`list` as appropriate.

### Step 2: Generate Outline

Plan for each image with style and layout specifications:

```markdown
# Xiaohongshu Infographic Series Outline

**Topic**: [topic description]
**Style**: [selected style]
**Default Layout**: [selected layout or "varies"]
**Image Count**: N
**Generated**: YYYY-MM-DD HH:mm

---

## Image 1 of N

**Position**: Cover
**Layout**: sparse
**Core Message**: [one-liner]
**Filename**: 01-cover.png

**Text Content**:
- Title: xxx
- Subtitle: xxx

**Visual Concept**: [style + layout appropriate description]

---

## Image 2 of N

**Position**: Content
**Layout**: [balanced/dense/list/comparison/flow]
**Core Message**: [one-liner]
**Filename**: 02-xxx.png

**Text Content**:
- Title: xxx
- Points: [list based on layout density]

**Visual Concept**: [description matching style + layout]

---
...
```

### Step 3: Save Outline

Save outline as `outline.md`.

### Step 4: Review & Confirm

**Purpose**: Let user confirm all options in a single step before image generation.

**IMPORTANT**: Present ALL options in a single confirmation step using AskUserQuestion. Do NOT interrupt workflow with multiple separate confirmations.

1. **Generate 3 style variants** (if style not specified):
   - Analyze content to select 3 most suitable styles
   - Generate complete outline for each style variant
   - Save as `outline-{style}.md` (e.g., `outline-cute.md`, `outline-notion.md`, `outline-tech.md`)

2. **Determine which questions to ask**:

   | Question | When to Ask |
   |----------|-------------|
   | Style variant | Always (required) |
   | Default layout | Always (offer common options) |
   | Language | Only if `source_language ≠ user_language` |

3. **Present options** (use AskUserQuestion with all applicable questions):

   **Question 1 (Style)** - always:
   - Style A (recommended): [style name] - [brief description]
   - Style B: [style name] - [brief description]
   - Style C: [style name] - [brief description]
   - Custom: Provide custom style reference

   **Question 2 (Layout)** - always:
   - sparse (Recommended for cover) - minimal info, maximum impact
   - balanced - standard 3-4 points
   - dense - high info density, knowledge cards
   - list / comparison / flow - special formats

   **Question 3 (Language)** - only if source ≠ user language:
   - [Source language] (matches content)
   - [User language] (your preference)

   **Language handling**:
   - If source language = user language: Just inform user (e.g., "Images will be in Chinese")
   - If different: Ask which language to use

4. **Apply selection**:
   - Copy selected `outline-{style}.md` to `outline.md`
   - If custom style provided, generate new outline with that style
   - If different language selected, regenerate outline in that language
   - User may edit `outline.md` directly for fine-tuning
   - If modified, reload outline before proceeding

5. **Proceed only after explicit user confirmation**

### Step 5: Generate Images One by One

For each image, create a prompt file with style and layout specifications.

**Prompt Format**:

```markdown
Infographic theme: [topic]
Style: [style name]
Layout: [layout name]
Position: [cover/content/ending]

Visual composition:
- Main visual: [style-appropriate description]
- Arrangement: [layout-specific structure]
- Decorative elements: [style-specific decorations]

Color scheme:
- Primary: [style primary color]
- Background: [style background color]
- Accent: [style accent color]

Text content:
- Title: 「xxx」(large, prominent)
- Key points: [based on layout density]

Layout instructions: [layout-specific guidance]
Style notes: [style-specific characteristics]
```

**Layout-Specific Instructions**:

| Layout | Arrangement Instructions |
|--------|-------------------------|
| `sparse` | Single focal point centered, 1-2 text elements, maximum breathing room |
| `balanced` | Title at top, 3-4 points in clear sections, moderate spacing |
| `dense` | Grid or multi-section layout, 5-8 points, compact but organized |
| `list` | Vertical numbered/bulleted list, consistent item spacing, clear hierarchy |
| `comparison` | Two-column split, clear divider, mirrored structure left/right |
| `flow` | Horizontal or vertical flow with arrows, connected nodes/steps |

**Image Generation Skill Selection**:
1. Check available image generation skills
2. If multiple skills available, ask user to choose

**Session Management**:
If the image generation skill supports `--sessionId`:
1. Generate a unique session ID at the start (e.g., `xhs-{topic-slug}-{timestamp}`)
2. Use the same session ID for all images in the series
3. This ensures style consistency across all generated images

**Generation Flow**:
1. Call selected image generation skill with prompt file, output path, and session ID
2. Confirm generation success
3. Report progress: "Generated X/N"
4. Continue to next

**All prompts are written in the user's confirmed language preference.**

### Step 6: Completion Report

```
Xiaohongshu Infographic Series Complete!

Topic: [topic]
Style: [style name]
Layout: [layout name or "varies"]
Location: [directory path]
Images: N total

- 01-cover.png ✓ Cover (sparse)
- 02-content-1.png ✓ Content (balanced)
- 03-content-2.png ✓ Content (dense)
- 04-ending.png ✓ Ending (sparse)

Outline: outline.md
```

## Content Breakdown Principles

1. **Cover (Image 1)**: Strong visual impact, core title, attention hook → `sparse` layout
2. **Content (Middle)**: Core points per image, density varies by content → `balanced`/`dense`/`list`/`comparison`/`flow`
3. **Ending (Last)**: Summary / call-to-action / memorable quote → `sparse` or `balanced`

**Style × Layout Matrix** (recommended combinations):

| | sparse | balanced | dense | list | comparison | flow |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| cute | ✓✓ | ✓✓ | ✓ | ✓✓ | ✓ | ✓ |
| fresh | ✓✓ | ✓✓ | ✓ | ✓ | ✓ | ✓✓ |
| tech | ✓ | ✓✓ | ✓✓ | ✓✓ | ✓✓ | ✓✓ |
| warm | ✓✓ | ✓✓ | ✓ | ✓ | ✓✓ | ✓ |
| bold | ✓✓ | ✓ | ✓ | ✓✓ | ✓✓ | ✓ |
| minimal | ✓✓ | ✓✓ | ✓✓ | ✓ | ✓ | ✓ |
| retro | ✓✓ | ✓✓ | ✓ | ✓✓ | ✓ | ✓ |
| pop | ✓✓ | ✓✓ | ✓ | ✓✓ | ✓✓ | ✓ |
| notion | ✓✓ | ✓✓ | ✓✓ | ✓✓ | ✓✓ | ✓✓ |

✓✓ = highly recommended, ✓ = works well

## Notes

- Image generation typically takes 10-30 seconds per image
- Auto-retry once on generation failure
- Use cartoon alternatives for sensitive public figures
- Prompts written in user's confirmed language preference
- Text on images uses confirmed language
- Maintain selected style consistency across all images in series
