---
name: test-driven-development
description: Use when implementing any feature or bugfix. Write the failing test first, watch it fail, write minimal code to pass, refactor.
license: MIT
---

# Test-Driven Development (excerpt)

## Red-Green-Refactor
1. RED: write a small test that fails for the right reason.
2. GREEN: write the minimal code that makes it pass. No more.
3. REFACTOR: clean up with the safety net on.

## Rules
- Never write production code without a failing test.
- Test behavior, not implementation.
- One assert per test keeps failure diagnosis cheap.
