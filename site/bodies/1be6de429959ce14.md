---
name: baoyu-comic
description: Knowledge comic creator supporting multiple styles (Logicomix/Ligne Claire, Ohmsha manga guide). Creates original educational comics with detailed panel layouts and sequential image generation. Use when user asks to create "知识漫画", "教育漫画", "biography comic", "tutorial comic", or "Logicomix-style comic".
---

# Knowledge Comic Creator

Create original knowledge comics supporting multiple visual styles: Logicomix-style Ligne Claire, Ohmsha manga guide, and more.

## Usage

```bash
# From source material
/baoyu-comic posts/turing-story/source.md

# Specify style
/baoyu-comic posts/turing-story/source.md --style dramatic

# Specify layout preference
/baoyu-comic posts/turing-story/source.md --layout cinematic

# Direct content input
/baoyu-comic
[paste story content or topic description]

# Direct input with options
/baoyu-comic --style warm --layout dense
[paste content]
```

## Options

| Option | Description |
|--------|-------------|
| `--style <name>` | Visual style (see Style Gallery) |
| `--layout <name>` | Panel layout preference (see Layout Gallery) |

## Two Dimensions

| Dimension | Controls | Options |
|-----------|----------|---------|
| **Style** | Color palette, mood, era treatment | classic, dramatic, warm, tech, sepia, vibrant, ohmsha |
| **Layout** | Panel arrangement, density | standard, cinematic, dense, splash, mixed, webtoon |

Style × Layout can be freely combined. Example: `--style dramatic --layout cinematic` creates high-contrast panels with wide aspect ratios.

## Style Gallery

| Style | Description |
|-------|-------------|
| `classic` (Default) | Traditional Ligne Claire, balanced and timeless |
| `dramatic` | High contrast, intense moments |
| `warm` | Nostalgic, personal storytelling |
| `tech` | Modern, digital-age narratives |
| `sepia` | Historical, archival feel |
| `vibrant` | Energetic, engaging, educational |
| `ohmsha` | Ohmsha Manga Guide style - educational manga with visual metaphors |

Detailed style definitions: `references/styles/<style>.md`

## Layout Gallery

| Layout | Description |
|--------|-------------|
| `standard` (Default) | Classic comic grid, versatile (4-6 panels) |
| `cinematic` | Wide panels, filmic feel (2-4 panels) |
| `dense` | Information-rich, educational focus (6-9 panels) |
| `splash` | Impact-focused, key moments (1-2 large + 2-3 small) |
| `mixed` | Dynamic, varied rhythm (3-7 panels) |
| `webtoon` | Vertical scrolling comic (竖版条漫) |

Detailed layout definitions: `references/layouts/<layout>.md`

## Auto Style Selection

When no `--style` is specified, analyze content to select:

| Content Signals | Selected Style |
|----------------|----------------|
| Tutorial, how-to, learning guide, beginner | `ohmsha` |
| Computing, AI, digital, programming | `tech` |
| Pre-1950, classical, ancient | `sepia` |
| Personal story, childhood, mentor | `warm` |
| Conflict, struggle, breakthrough | `dramatic` |
| Young audience, science basics, wonder | `vibrant` |
| Balanced narrative, biography | `classic` |

## Auto Layout Selection

When no `--layout` is specified, analyze content to select:

| Content Signals | Selected Layout |
|----------------|-----------------|
| Technical explanation, timeline | `dense` |
| Key discovery, major event | `splash` |
| Establishing scene, location | `cinematic` |
| Dialogue, conversation, debate | `standard` |
| Mixed content, varied pacing | `mixed` |
| Ohmsha style, tutorial, vertical scroll | `webtoon` |

## Style × Layout Matrix

| | standard | cinematic | dense | splash | mixed | webtoon |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| classic | ✓✓ | ✓✓ | ✓ | ✓✓ | ✓✓ | ✓ |
| dramatic | ✓ | ✓✓ | ✓ | ✓✓ | ✓✓ | ✓ |
| warm | ✓✓ | ✓✓ | ✓ | ✓ | ✓ | ✓ |
| tech | ✓✓ | ✓ | ✓✓ | ✓ | ✓✓ | ✓✓ |
| sepia | ✓✓ | ✓✓ | ✓ | ✓ | ✓ | ✓ |
| vibrant | ✓✓ | ✓ | ✓ | ✓✓ | ✓✓ | ✓✓ |
| ohmsha | ✓ | ✓ | ✓✓ | ✓ | ✓✓ | ✓✓ |

✓✓ = highly recommended, ✓ = works well

## File Management

### With Source Path

Save to `comic/` subdirectory in the same folder as the source:

```
posts/turing-story/
├── source.md
└── comic/
    ├── outline.md
    ├── prompts/
    │   ├── 00-cover.md
    │   ├── 01-page.md
    │   └── ...
    ├── 00-cover.png
    ├── 01-page.png
    └── ...
```

### Without Source Path

Save to `comic-outputs/YYYY-MM-DD/[topic-slug]/`:

```
comic-outputs/
└── 2026-01-16/
    └── turing-biography/
        ├── outline.md
        ├── prompts/
        │   ├── 00-cover.md
        │   └── ...
        ├── 00-cover.png
        └── ...
```

**Directory collision**: If slug exists, generate a different slug (do not overwrite).

## Workflow

### Step 1: Analyze Content & Determine Scope

1. Read source content
2. If `--style` specified, use it; otherwise auto-select
3. If `--layout` specified, use it; otherwise auto-select per page
4. Determine page count based on content complexity:

| Content Type | Page Count (incl. cover) |
|-------------|--------------------------|
| Single event / short story | 5-8 |
| Medium complexity / mini biography | 9-15 |
| Full biography / multi-thread | 16-25 |

### Step 2: Generate Outline

Plan cover + each page with detailed panel breakdowns:

```markdown
# [Comic Title] - Knowledge Biography Comic Outline

**Topic**: [topic description]
**Time Span**: [e.g., 1912-1954]
**Style**: [selected style]
**Default Layout**: [selected layout or "varies"]
**Page Count**: Cover + N pages
**Generated**: YYYY-MM-DD HH:mm

---

## Cover

**Filename**: 00-cover.png
**Core Message**: [one-liner]

**Visual Design**:
- Title typography style
- Main visual composition
- Color scheme
- Subtitle / time span notation

**Visual Prompt**:
[Detailed image generation prompt]

---

## Page 1 / N

**Filename**: 01-page.png
**Layout**: [standard/cinematic/dense/splash/mixed]
**Narrative Layer**: [Main narrative / Narrator layer / Mixed]
**Core Message**: [What this page conveys]

### Panel Layout

**Panel Count**: X
**Layout Type**: [grid/irregular/splash]

#### Panel 1 (Size: 1/3 page, Position: Top)

**Scene**: [Time, location]
**Image Description**:
- Camera angle: [bird's eye / low angle / eye level / close-up / wide shot]
- Characters: [pose, expression, action]
- Environment: [scene details, period markers]
- Lighting: [atmosphere description]
- Color tone: [palette reference]

**Text Elements**:
- Dialogue bubble (oval): "Character line"
- Narrator box (rectangular): 「Narrator commentary」
- Caption bar: [Background info text]

#### Panel 2...

**Page Hook**: [Cliffhanger or transition at page end]

**Visual Prompt**:
[Full page image generation prompt]

---

## Page 2 / N
...
```

### Step 3: Save Outline

Save as `outline.md` in target directory.

### Step 4: Generate Images Page by Page

For each page:

1. **Save prompt file** to `prompts/` subdirectory
2. **Call image generation skill**:

```bash
npx -y bun skills/baoyu-gemini-web/scripts/main.ts \
  --promptfiles skills/baoyu-comic/prompts/system.md [target]/prompts/00-cover.md \
  --image [target]/00-cover.png
```

After each generation:
1. Confirm success
2. Report progress: "Generated X/N pages"
3. Continue to next

### Step 5: Completion Report

```
Knowledge Biography Comic Complete!

Title: [Comic Title]
Time Span: [e.g., 1912-1954]
Style: [style name]
Layout: [layout name or "varies"]
Location: [directory path]
Pages: Cover + N pages

- 00-cover.png ✓ Cover
- 01-page.png ✓ Opening: [brief]
- 02-page.png ✓ [brief]
- ...
- XX-page.png ✓ Ending: [brief]

Outline: outline.md
```

## Narrative Structure Principles

### Cover Design

- Academic gravitas with visual appeal
- Title typography reflecting knowledge/science theme
- Composition hinting at core theme (character silhouette, iconic symbol, concept diagram)
- Subtitle or time span for epic scope

### Panel Composition Principles

| Panel Type | Recommended Count | Usage |
|-----------|-------------------|-------|
| Main narrative | 3-5 per page | Story progression |
| Concept diagram | 1-2 per page | Visualize abstractions |
| Narrator panel | 0-1 per page | Commentary, transition, questions |
| Splash (full/half) | Occasional | Major moments |

### Panel Size Reference

- **Full page (Splash)**: Major moments, key breakthroughs
- **Half page**: Important scenes, turning points
- **1/3 page**: Standard narrative panels
- **1/4 or smaller**: Quick progression, sequential action

### Concept Visualization Techniques

Transform abstract concepts into concrete visuals:

| Abstract Concept | Visual Approach |
|-----------------|-----------------|
| Neural network | Glowing nodes with connecting lines |
| Gradient descent | Ball rolling down valley terrain |
| Data flow | Luminous particles flowing through pipes |
| Algorithm iteration | Ascending spiral staircase |
| Breakthrough moment | Shattering barrier, piercing light |
| Logical proof | Building blocks assembling |
| Uncertainty | Forking paths, fog, multiple shadows |

### Text Element Design

| Text Type | Style | Usage |
|-----------|-------|-------|
| Character dialogue | Oval speech bubble | Main narrative speech |
| Narrator commentary | Rectangular / hand-drawn box | Explanation, commentary |
| Caption bar | Edge-mounted rectangle | Time, location info |
| Thought bubble | Cloud shape | Character inner monologue |
| Term label | Bold / special color | First appearance of technical terms |

## Ohmsha Style Special Requirements

When using `--style ohmsha`, follow these additional guidelines:

### Character Setup (Required)

Define characters before generating outline:

| Role | Default | Traits |
|------|---------|--------|
| Student (Role A) | 大雄 | Confused, asks basic but crucial questions, represents reader |
| Mentor (Role B) | 哆啦A梦 | Knowledgeable, patient, uses gadgets as technical metaphors |
| Antagonist (Role C, optional) | 胖虎 | Represents misunderstanding, or "noise" in the data |

User can specify custom characters via `--characters "Student:小明,Mentor:教授,Antagonist:Bug怪"`

### Outline Spec Block (Required)

Every ohmsha outline must start with a spec block:

```markdown
【漫画规格单】
- Language: [Same as input content]
- Style: Ohmsha (Manga Guide), Full Color
- Layout: Vertical Scrolling Comic (竖版条漫)
- Characters: [List character names and roles]
- Page Limit: ≤20 pages
```

### Visual Metaphor Rules (Critical)

**NEVER** create "talking heads" panels. Every technical concept must become:

1. **A tangible gadget/prop** - Something characters can hold, use, demonstrate
2. **An action scene** - Characters doing something that illustrates the concept
3. **A visual environment** - Stepping into a metaphorical space

### Page Title Convention

Avoid AI-style "Title: Subtitle" format. Use narrative descriptions:
- ❌ "Page 3: Introduction to Neural Networks"
- ✓ "Page 3: 大雄被海量单词淹没，哆啦A梦拿出'词向量压缩机'"

### Ending Requirements

- NO generic endings ("What will you choose?", "Thanks for reading")
- End with: Technical summary moment OR character achieving a small goal
- Final panel: Sense of accomplishment, not open-ended question

## Notes

- Image generation typically takes 30-60 seconds per page
- Auto-retry once on generation failure
- Historical figures rendered in portrait/illustration style for recognizability
- All text in Chinese unless source is in another language
- Each panel description should be detailed enough to serve as standalone AI art prompt
- Maintain style consistency across all pages in series
