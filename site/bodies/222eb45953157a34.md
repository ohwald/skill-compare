---
name: baoyu-image-gen
description: AI image generation with OpenAI, Google, DashScope and Replicate APIs. Supports text-to-image, reference images, aspect ratios. Sequential by default; parallel generation available on request. Use when user asks to generate, create, or draw images.
version: 1.56.1
metadata:
  openclaw:
    homepage: https://github.com/JimLiu/baoyu-skills#baoyu-image-gen
    requires:
      anyBins:
        - bun
        - npx
---

# Image Generation (AI SDK)

Official API-based image generation. Supports OpenAI, Google, DashScope (阿里通义万象) and Replicate providers.

## Script Directory

**Agent Execution**:
1. `{baseDir}` = this SKILL.md file's directory
2. Script path = `{baseDir}/scripts/main.ts`
3. Resolve `${BUN_X}` runtime: if `bun` installed → `bun`; if `npx` available → `npx -y bun`; else suggest installing bun

## Step 0: Load Preferences ⛔ BLOCKING

**CRITICAL**: This step MUST complete BEFORE any image generation. Do NOT skip or defer.

Check EXTEND.md existence (priority: project → user):

```bash
# macOS, Linux, WSL, Git Bash
test -f .baoyu-skills/baoyu-image-gen/EXTEND.md && echo "project"
test -f "${XDG_CONFIG_HOME:-$HOME/.config}/baoyu-skills/baoyu-image-gen/EXTEND.md" && echo "xdg"
test -f "$HOME/.baoyu-skills/baoyu-image-gen/EXTEND.md" && echo "user"
```

```powershell
# PowerShell (Windows)
if (Test-Path .baoyu-skills/baoyu-image-gen/EXTEND.md) { "project" }
$xdg = if ($env:XDG_CONFIG_HOME) { $env:XDG_CONFIG_HOME } else { "$HOME/.config" }
if (Test-Path "$xdg/baoyu-skills/baoyu-image-gen/EXTEND.md") { "xdg" }
if (Test-Path "$HOME/.baoyu-skills/baoyu-image-gen/EXTEND.md") { "user" }
```

| Result | Action |
|--------|--------|
| Found | Load, parse, apply settings. If `default_model.[provider]` is null → ask model only (Flow 2) |
| Not found | ⛔ Run first-time setup ([references/config/first-time-setup.md](references/config/first-time-setup.md)) → Save EXTEND.md → Then continue |

**CRITICAL**: If not found, complete the full setup (provider + model + quality + save location) using AskUserQuestion BEFORE generating any images. Generation is BLOCKED until EXTEND.md is created.

| Path | Location |
|------|----------|
| `.baoyu-skills/baoyu-image-gen/EXTEND.md` | Project directory |
| `$HOME/.baoyu-skills/baoyu-image-gen/EXTEND.md` | User home |

**EXTEND.md Supports**: Default provider | Default quality | Default aspect ratio | Default image size | Default models | Batch worker cap | Provider-specific batch limits

Schema: `references/config/preferences-schema.md`

## Usage

```bash
# Basic
${BUN_X} {baseDir}/scripts/main.ts --prompt "A cat" --image cat.png

# With aspect ratio
${BUN_X} {baseDir}/scripts/main.ts --prompt "A landscape" --image out.png --ar 16:9

# High quality
${BUN_X} {baseDir}/scripts/main.ts --prompt "A cat" --image out.png --quality 2k

# From prompt files
${BUN_X} {baseDir}/scripts/main.ts --promptfiles system.md content.md --image out.png

# With reference images (Google multimodal or OpenAI edits)
${BUN_X} {baseDir}/scripts/main.ts --prompt "Make blue" --image out.png --ref source.png

# With reference images (explicit provider/model)
${BUN_X} {baseDir}/scripts/main.ts --prompt "Make blue" --image out.png --provider google --model gemini-3-pro-image-preview --ref source.png

# Specific provider
${BUN_X} {baseDir}/scripts/main.ts --prompt "A cat" --image out.png --provider openai

# DashScope (阿里通义万象)
${BUN_X} {baseDir}/scripts/main.ts --prompt "一只可爱的猫" --image out.png --provider dashscope

# Replicate (google/nano-banana-pro)
${BUN_X} {baseDir}/scripts/main.ts --prompt "A cat" --image out.png --provider replicate

# Replicate with specific model
${BUN_X} {baseDir}/scripts/main.ts --prompt "A cat" --image out.png --provider replicate --model google/nano-banana

# Batch mode with saved prompt files
${BUN_X} {baseDir}/scripts/main.ts --batchfile batch.json

# Batch mode with explicit worker count
${BUN_X} {baseDir}/scripts/main.ts --batchfile batch.json --jobs 4 --json
```

## Options

| Option | Description |
|--------|-------------|
| `--prompt <text>`, `-p` | Prompt text |
| `--promptfiles <files...>` | Read prompt from files (concatenated) |
| `--image <path>` | Output image path (required in single-image mode) |
| `--batchfile <path>` | JSON batch file for multi-image generation |
| `--jobs <count>` | Worker count for batch mode (default: auto, max from config, built-in default 10) |
| `--provider google\|openai\|dashscope\|replicate` | Force provider (default: auto-detect) |
| `--model <id>`, `-m` | Model ID (Google: `gemini-3-pro-image-preview`, `gemini-3.1-flash-image-preview`; OpenAI: `gpt-image-1.5`, `gpt-image-1`) |
| `--ar <ratio>` | Aspect ratio (e.g., `16:9`, `1:1`, `4:3`) |
| `--size <WxH>` | Size (e.g., `1024x1024`) |
| `--quality normal\|2k` | Quality preset (default: `2k`) |
| `--imageSize 1K\|2K\|4K` | Image size for Google (default: from quality) |
| `--ref <files...>` | Reference images. Supported by Google multimodal, OpenAI GPT Image edits, and Replicate |
| `--n <count>` | Number of images |
| `--json` | JSON output |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `GOOGLE_API_KEY` | Google API key |
| `DASHSCOPE_API_KEY` | DashScope API key (阿里云) |
| `REPLICATE_API_TOKEN` | Replicate API token |
| `OPENAI_IMAGE_MODEL` | OpenAI model override |
| `GOOGLE_IMAGE_MODEL` | Google model override |
| `DASHSCOPE_IMAGE_MODEL` | DashScope model override (default: z-image-turbo) |
| `REPLICATE_IMAGE_MODEL` | Replicate model override (default: google/nano-banana-pro) |
| `OPENAI_BASE_URL` | Custom OpenAI endpoint |
| `GOOGLE_BASE_URL` | Custom Google endpoint |
| `DASHSCOPE_BASE_URL` | Custom DashScope endpoint |
| `REPLICATE_BASE_URL` | Custom Replicate endpoint |
| `BAOYU_IMAGE_GEN_MAX_WORKERS` | Override batch worker cap |
| `BAOYU_IMAGE_GEN_<PROVIDER>_CONCURRENCY` | Override provider concurrency, e.g. `BAOYU_IMAGE_GEN_REPLICATE_CONCURRENCY` |
| `BAOYU_IMAGE_GEN_<PROVIDER>_START_INTERVAL_MS` | Override provider start gap, e.g. `BAOYU_IMAGE_GEN_REPLICATE_START_INTERVAL_MS` |

**Load Priority**: CLI args > EXTEND.md > env vars > `<cwd>/.baoyu-skills/.env` > `~/.baoyu-skills/.env`

## Model Resolution

Model priority (highest → lowest), applies to all providers:

1. CLI flag: `--model <id>`
2. EXTEND.md: `default_model.[provider]`
3. Env var: `<PROVIDER>_IMAGE_MODEL` (e.g., `GOOGLE_IMAGE_MODEL`)
4. Built-in default

**EXTEND.md overrides env vars**. If both EXTEND.md `default_model.google: "gemini-3-pro-image-preview"` and env var `GOOGLE_IMAGE_MODEL=gemini-3.1-flash-image-preview` exist, EXTEND.md wins.

**Agent MUST display model info** before each generation:
- Show: `Using [provider] / [model]`
- Show switch hint: `Switch model: --model <id> | EXTEND.md default_model.[provider] | env <PROVIDER>_IMAGE_MODEL`

### Replicate Models

Supported model formats:

- `owner/name` (recommended for official models), e.g. `google/nano-banana-pro`
- `owner/name:version` (community models by version), e.g. `stability-ai/sdxl:<version>`

Examples:

```bash
# Use Replicate default model
${BUN_X} {baseDir}/scripts/main.ts --prompt "A cat" --image out.png --provider replicate

# Override model explicitly
${BUN_X} {baseDir}/scripts/main.ts --prompt "A cat" --image out.png --provider replicate --model google/nano-banana
```

## Provider Selection

1. `--ref` provided + no `--provider` → auto-select Google first, then OpenAI, then Replicate
2. `--provider` specified → use it (if `--ref`, must be `google`, `openai`, or `replicate`)
3. Only one API key available → use that provider
4. Multiple available → default to Google

## Quality Presets

| Preset | Google imageSize | OpenAI Size | Use Case |
|--------|------------------|-------------|----------|
| `normal` | 1K | 1024px | Quick previews |
| `2k` (default) | 2K | 2048px | Covers, illustrations, infographics |

**Google imageSize**: Can be overridden with `--imageSize 1K|2K|4K`

## Aspect Ratios

Supported: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2.35:1`

- Google multimodal: uses `imageConfig.aspectRatio`
- Google Imagen: uses `aspectRatio` parameter
- OpenAI: maps to closest supported size

## Generation Mode

**Default**: Sequential generation.

**Batch Parallel Generation**: When `--batchfile` contains 2 or more pending tasks, the script automatically enables parallel generation.

| Mode | When to Use |
|------|-------------|
| Sequential (default) | Normal usage, single images, small batches |
| Parallel batch | Batch mode with 2+ tasks |

Parallel behavior:

- Default worker count is automatic, capped by config, built-in default 10
- Provider-specific throttling is applied only in batch mode, and the built-in defaults are tuned for faster throughput while still avoiding obvious RPM bursts
- You can override worker count with `--jobs <count>`
- Each image retries automatically up to 3 attempts
- Final output includes success count, failure count, and per-image failure reasons

## Error Handling

- Missing API key → error with setup instructions
- Generation failure → auto-retry up to 3 attempts per image
- Invalid aspect ratio → warning, proceed with default
- Reference images with unsupported provider/model → error with fix hint

## Extension Support

Custom configurations via EXTEND.md. See **Preferences** section for paths and supported options.
