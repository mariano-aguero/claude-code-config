---
description: Generate a feature specification before writing any code. Produces a structured PRD with user stories, acceptance criteria, technical scope, and task breakdown.
---

# /feature-spec — Generate Feature Specification

Generate a structured feature spec for: **$ARGUMENTS**

Analyze the codebase briefly (relevant files only), then produce this document:

---

## Feature: $ARGUMENTS

### Summary

One paragraph: what this feature does, the problem it solves, and who benefits.

### User Stories

List 2–5 stories in strict format:

- AS A [role], I WANT TO [action], SO THAT [outcome]

### Acceptance Criteria

Specific, testable, binary conditions. Each must be verifiable:

- [ ] [Measurable condition — no vague terms like "works correctly" or "feels fast"]
- [ ] ...

### Technical Scope

**New files:**

- `path/to/file.tsx` — purpose

**Modified files:**

- `path/to/existing.ts` — what changes and why

**DB changes:** schema additions / migrations needed (or "none")

**API changes:** new routes / modified contracts (or "none")

### Out of Scope

Explicitly list what this feature does NOT include to prevent scope creep.

### Dependencies

- Existing systems/services this touches
- Blocking work that must land first (or "none")

### Task Breakdown

Ordered checklist — each task independently completable:

- [ ] 1. ...
- [ ] 2. ...
- [ ] 3. ...

---

**Rules:**

- Read relevant existing files before writing the spec — don't invent structure
- Acceptance Criteria must be testable by a QA engineer with no context
- Task Breakdown must be in dependency order (infra first, UI last)
- If $ARGUMENTS is vague, ask 2–3 clarifying questions before generating
