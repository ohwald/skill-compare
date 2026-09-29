# Skill Compare

**[🚀 Live site](https://ohwald.github.io/skills-comparison/)** · [简体中文](README.zh-CN.md)

Side-by-side comparison site for **Agent Skills** (SKILL.md packages): pick any two skills and read them next to each other with a real diff, compare a skill against its own history along the commit timeline, and inspect proprietary skills through metadata-only "degraded" views.

Pure Python-stdlib pipeline + a zero-build single-file frontend (vanilla JS + Monaco via CDN). No runtime dependencies.

## Features

- **Side-by-side comparison** — Monaco diff editor (falls back to plain columns when the CDN is unreachable), A/B identity colors running through slots and columns
- **Version comparison** — every slot is a *skill @ time point*: pick any commit (with upstream tag annotations) per side; two slots on the same skill automatically become a version diff with a clickable commit timeline
- **Structured view** — content is segmented by the official SKILL.md convention (YAML frontmatter + heading hierarchy, code fences kept intact) with a structure TOC that jumps both columns; a raw-diff toggle is one click away
- **License-aware** — permissive-licensed skills are shown in full; proprietary/undeclared ones are *degraded* (metadata + source link only, original text never reproduced)
- **Curated sources** — [anthropics/skills](https://github.com/anthropics/skills), [obra/superpowers](https://github.com/obra/superpowers), [mattpocock/skills](https://github.com/mattpocock/skills) (~60 skills; extend via config)
- **6 editor themes** — Tokyo Night (default), Catppuccin Mocha, One Dark Pro, GitHub Light, One Light, Solarized Light; plus a 中文/English bilingual UI

## Quick start

```bash
# fetch the three content sources (single-branch, full history)
python3 -m pipeline.collect

# build (version axis + optional networked aux data)
python3 -m pipeline.build --real --out site --fetch-aux

# preview
python3 -m http.server 8765 -d site
```

No-network demo mode:

```bash
python3 -m pipeline.build --fixtures fixtures --out site
```

Requires Python ≥ 3.11 (stdlib only) and `git`.

## Tests

```bash
python3 -m pytest -q
```

The pipeline is the only formal test seam: frontmatter parsing, license triage, canonical dedup, version-axis extraction, and manifest validation are covered end-to-end (including a daily-update loop test against a simulated upstream). The frontend is zero-build vanilla JS and is accepted manually against `design-preview/`.

## Architecture

```
pipeline/
├── collect.py    # clone/fetch sources + aux data (marketplace categories, skills.sh installs, stars)
├── parse.py      # SKILL.md frontmatter parsing + license triage
├── manifest.py   # collection walk + canonical dedup ("also seen") + content fingerprints
├── versions.py   # version axis: per-path commit history (date + short sha, tag annotations)
├── validate.py   # build-time manifest validation (build fails loudly)
└── build.py      # single-file site assembly (inline manifest, per-fingerprint bodies, 6-theme CSS)
template/          # index.html + app.js (picker / compare / degraded / version-mode states)
design-preview/    # rendered design references, theme screenshots, themes.json (color tokens)
```

Data flow: `collect → parse → license triage → canonical dedup → version axis → validate → single-file site`. Bodies are served per content fingerprint so switching comparisons only fetches what changed.

## Themes

`design-preview/themes.json` is the single source of truth for color tokens; the build inlines all six presets as CSS variables and the site ships a switcher. Adding a preset = adding an entry there.

## Deployment

- **Capture** (`.github/workflows/capture.yml`, daily 02:23 UTC): quality gate → re-collect → rebuild → commit `site/`
- **Pages** (`.github/workflows/pages.yml`): deploys the committed `site/` to GitHub Pages on push / capture completion

## Contributing

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) and are written in English:

```
<type>(<optional scope>): <summary in imperative mood>
```

Types: `feat` `fix` `docs` `refactor` `test` `build` `ci` `chore`. Examples: `feat(picker): filter skills by source`, `fix(build): fail on leftover template placeholders`.
