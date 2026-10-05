---
name: understand-explain
description: Use when you need a deep-dive explanation of a specific file, function, or module in the codebase
argument-hint: [file-path]
---

# /understand-explain

Provide a thorough, in-depth explanation of a specific code component.

## Instructions

1. Read the knowledge graph file at `.understand-anything/knowledge-graph.json`
2. If it doesn't exist, tell the user to run `/understand` first
3. Find the component matching the path: "$ARGUMENTS"
   - Supports file paths: `src/auth/login.ts`
   - Supports function notation: `src/auth/login.ts:verifyToken`
4. Analyze the component in context:
   - Its role in the architecture (which layer, why it exists)
   - Internal structure (functions, classes it contains)
   - External connections (what it imports, what calls it, what it depends on)
   - Data flow (inputs -> processing -> outputs)
5. Explain clearly, assuming the reader may not know the programming language
6. Highlight any patterns, idioms, or complexity worth understanding
