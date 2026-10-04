---
name: baoyu-cover-image
description: Generate elegant cover images for articles. Analyzes content and creates eye-catching hand-drawn style cover images with multiple style options. Use when user asks to "generate cover image", "create article cover", or "make a cover for article".
---

# Cover Image Generator

Generate hand-drawn style cover images for articles with multiple style options.

## Usage

```bash
# From markdown file (auto-select style based on content)
/baoyu-cover-image path/to/article.md

# Specify a style
/baoyu-cover-image path/to/article.md --style tech
/baoyu-cover-image path/to/article.md --style warm
/baoyu-cover-image path/to/article.md --style bold

# Without title text
/baoyu-cover-image path/to/article.md --no-title

# Combine options
/baoyu-cover-image path/to/article.md --style minimal --no-title

# From direct text input
/baoyu-cover-image
[paste content or describe the topic]

# Direct input with style
/baoyu-cover-image --style playful
[paste content]
```

## Options

| Option | Description |
|--------|-------------|
| `--style <name>` | Specify cover style (see Style Gallery below) |
| `--no-title` | Generate cover without title text (visual only) |

## Style Gallery

### 1. `elegant` (Default)
Refined, sophisticated, understated
- **Colors**: Soft coral, muted teal, dusty rose, cream background
- **Elements**: Delicate line work, subtle icons, balanced composition
- **Best for**: Professional content, thought leadership, business topics

### 2. `tech`
Modern, clean, futuristic
- **Colors**: Deep blue, electric cyan, dark gray, white accents
- **Elements**: Geometric shapes, circuit patterns, glowing effects, tech icons
- **Best for**: AI, programming, technology, digital transformation

### 3. `warm`
Friendly, approachable, human-centered
- **Colors**: Warm orange, golden yellow, terracotta, cream
- **Elements**: Rounded shapes, friendly characters, sun/light motifs
- **Best for**: Personal growth, lifestyle, education, human stories

### 4. `bold`
High contrast, attention-grabbing, energetic
- **Colors**: Vibrant red/orange, deep black, bright yellow accents
- **Elements**: Strong typography, dramatic contrast, dynamic shapes
- **Best for**: Opinion pieces, controversial takes, urgent topics

### 5. `minimal`
Ultra-clean, zen-like, focused
- **Colors**: Black, white, single accent color
- **Elements**: Maximum whitespace, single focal element, simple lines
- **Best for**: Philosophy, minimalism, focused concepts

### 6. `playful`
Fun, creative, whimsical
- **Colors**: Pastel rainbow, bright pops of color, light backgrounds
- **Elements**: Doodles, quirky characters, speech bubbles, emoji-style icons
- **Best for**: Casual content, tutorials, beginner guides, fun topics

### 7. `nature`
Organic, calm, earthy
- **Colors**: Forest green, earth brown, sky blue, sand beige
- **Elements**: Plant motifs, natural textures, flowing lines, organic shapes
- **Best for**: Sustainability, wellness, outdoor topics, slow living

### 8. `retro`
Vintage, nostalgic, classic
- **Colors**: Muted pastels, sepia tones, faded colors
- **Elements**: Vintage typography, halftone dots, classic illustrations
- **Best for**: History, retrospectives, classic topics, throwback content

## Auto Style Selection

When no `--style` is specified, the system analyzes content to select the best style:

| Content Signals | Selected Style |
|----------------|----------------|
| AI, coding, tech, digital, algorithm | `tech` |
| Personal story, emotion, growth, life | `warm` |
| Controversial, urgent, must-read, warning | `bold` |
| Simple, zen, focus, essential | `minimal` |
| Fun, easy, beginner, casual, tutorial | `playful` |
| Nature, eco, wellness, health, organic | `nature` |
| History, classic, vintage, old, traditional | `retro` |
| Business, professional, strategy, analysis | `elegant` |

## File Management

### With Article Path

Save to `imgs/` subdirectory in the same folder as the article:

```
path/to/
├── article.md
└── imgs/
    ├── prompts/
    │   └── cover.md
    └── cover.png
```

### Without Article Path

Save to current working directory:

```
./
├── cover-prompt.md
└── cover.png
```

## Workflow

### Step 1: Analyze Content

Extract key information:
- **Main topic**: What is the article about?
- **Core message**: What's the key takeaway?
- **Tone**: Serious, playful, inspiring, educational?
- **Keywords**: Identify style-signaling words

### Step 2: Select Style

If `--style` specified, use that style. Otherwise:
1. Scan content for style signals (see Auto Style Selection table)
2. Match signals to most appropriate style
3. Default to `elegant` if no clear signals

### Step 3: Generate Cover Concept

Create a cover image concept based on selected style:

**Title** (if included, max 8 characters):
- Distill the core message into a punchy headline
- Use hooks: numbers, questions, contrasts, pain points
- Skip if `--no-title` flag is used

**Visual Elements**:
- Style-appropriate imagery and icons
- 1-2 symbolic elements representing the topic
- Metaphors or analogies that fit the style

### Step 4: Create Prompt File

**Prompt Format**:

```markdown
Cover theme: [topic in 2-3 words]
Style: [selected style name]

[If title included:]
Title text: [8 characters or less, in content language]
Subtitle: [optional, in content language]

Visual composition:
- Main visual: [description matching style]
- Layout: [positioning based on title inclusion]
- Decorative elements: [style-appropriate elements]

Color scheme:
- Primary: [style primary color]
- Background: [style background color]
- Accent: [style accent color]

Style notes: [specific style characteristics to emphasize]

[If no title:]
Note: No title text, pure visual illustration only.
```

### Step 5: Generate Image

**Image Generation Skill Selection**:
1. Check available image generation skills
2. If multiple skills available, ask user to choose

**Generation**:
Call selected image generation skill with prompt file and output path.

### Step 6: Output Summary

```
Cover Image Generated!

Topic: [topic]
Style: [style name]
Title: [cover title] (or "No title - visual only")
Location: [output path]

Preview the image to verify it matches your expectations.
```

## Style Reference Details

### elegant
```
Colors: Soft coral (#E8A598), muted teal (#5B8A8A), dusty rose (#D4A5A5)
Background: Warm cream (#F5F0E6), soft beige
Accents: Gold (#C9A962), copper
Elements: Delicate lines, refined icons, subtle gradients
Typography: Elegant serif-style hand lettering
```

### tech
```
Colors: Deep blue (#1A365D), electric cyan (#00D4FF), purple (#6B46C1)
Background: Dark gray (#1A202C), near-black (#0D1117)
Accents: Neon green (#00FF88), bright white
Elements: Circuit patterns, data nodes, geometric grids, code snippets
Typography: Monospace-style hand lettering, glowing effects
```

### warm
```
Colors: Warm orange (#ED8936), golden yellow (#F6AD55), terracotta (#C05621)
Background: Cream (#FFFAF0), soft peach (#FED7AA)
Accents: Deep brown (#744210), soft red
Elements: Rounded shapes, smiling faces, sun rays, hearts, warm lighting
Typography: Friendly rounded hand lettering
```

### bold
```
Colors: Vibrant red (#E53E3E), bright orange (#DD6B20), electric yellow (#F6E05E)
Background: Deep black (#000000), dark charcoal
Accents: White, neon highlights
Elements: Exclamation marks, lightning bolts, arrows, strong shapes
Typography: Bold, impactful, large hand lettering with shadows
```

### minimal
```
Colors: Pure black (#000000), white (#FFFFFF)
Background: White or off-white (#FAFAFA)
Accents: Single color (user's choice or content-derived)
Elements: Single focal point, maximum negative space, thin lines
Typography: Clean, simple hand lettering, lots of breathing room
```

### playful
```
Colors: Pastel pink (#FED7E2), mint (#C6F6D5), lavender (#E9D8FD), sky blue (#BEE3F8)
Background: Light cream (#FFFBEB), soft white
Accents: Bright pops - yellow, coral, turquoise
Elements: Doodles, stars, swirls, cute characters, emoji-style icons
Typography: Bouncy, irregular hand lettering, playful angles
```

### nature
```
Colors: Forest green (#276749), sage (#9AE6B4), earth brown (#744210)
Background: Sand beige (#F5E6D3), sky blue (#E0F2FE)
Accents: Sunset orange, water blue
Elements: Leaves, trees, mountains, sun, clouds, organic flowing lines
Typography: Organic, flowing hand lettering with natural textures
```

### retro
```
Colors: Muted orange (#ED8936 at 70%), dusty pink (#FED7E2 at 80%), faded teal
Background: Aged paper (#F5E6D3), sepia tones
Accents: Faded red, vintage gold
Elements: Halftone dots, vintage badges, classic icons, aged textures
Typography: Vintage-style hand lettering, classic serif influence
```

## Notes

- Cover should be instantly understandable at small preview sizes
- Title (if included) must be readable and impactful
- Visual metaphors work better than literal representations
- Maintain style consistency throughout the cover
- Image generation typically takes 10-30 seconds
- Title text language should match content language
