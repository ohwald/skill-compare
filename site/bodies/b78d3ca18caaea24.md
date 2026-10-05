---
name: understand-diff
description: Use when you need to analyze git diffs or pull requests to understand what changed, affected components, and risks
---

# /understand-diff

Analyze the current code changes against the knowledge graph at `.understand-anything/knowledge-graph.json`.

## Instructions

1. Read the knowledge graph file at `.understand-anything/knowledge-graph.json` in the current project root
2. If the file doesn't exist, tell the user to run `/understand` first
3. Get the current diff:
   - If on a branch with uncommitted changes: `git diff --name-only`
   - If on a feature branch: `git diff main...HEAD --name-only` (or the base branch)
   - If the user specifies a PR number: get the diff from that PR
4. For each changed file, identify:
   - Which nodes in the knowledge graph correspond to that file
   - Which other nodes are connected (imports, calls, depends_on, etc.)
   - Which architectural layers are affected
5. Provide a structured analysis:
   - **Changed Components**: What was directly modified
   - **Affected Components**: What might be impacted by the changes
   - **Affected Layers**: Which architectural layers are touched
   - **Risk Assessment**: Complexity, cross-layer impact, blast radius
6. Suggest what to review carefully and any potential issues
