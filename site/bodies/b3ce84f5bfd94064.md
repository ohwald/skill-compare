---
name: understand-onboard
description: Use when you need to generate an onboarding guide for new team members joining a project
---

# /understand-onboard

Generate a comprehensive onboarding guide from the project's knowledge graph.

## Instructions

1. Read the knowledge graph at `.understand-anything/knowledge-graph.json`
2. If it doesn't exist, tell the user to run `/understand` first
3. Generate a structured onboarding guide that includes:
   - Project overview (name, languages, frameworks, description)
   - Architecture layers and their responsibilities
   - Key concepts to understand
   - Guided tour (step-by-step walkthrough)
   - File map (what each key file does)
   - Complexity hotspots (what to be careful with)
4. Format as clean markdown
5. Offer to save the guide to `docs/ONBOARDING.md` in the project
6. Suggest the user commit it to the repo for the team
