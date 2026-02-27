# gemini.md – LLM Orchestration Workflow

## 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions).
- If something goes sideways, STOP and re-plan immediately – don't keep pushing.
- Use plan mode for verification steps, not just building.
- Write detailed specs upfront to reduce ambiguity.
- **Antigravity Principle**: Every change must reduce technical debt (weight), never increase it.

## 2. Subagent Strategy
- Use subagents liberally to keep main context window clean.
- Offload complex research, exploration, and parallel analysis to subagents.
- **JSON Summary Rule**: Subagents must provide a concise, structured summary of findings to the main agent to avoid context bloating.

## 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern.
- Write rules for yourself that prevent the same mistake.
- Ruthlessly iterate on these lessons until mistake rate drops.
- Review lessons at session start for relevant project.

## 4. Verification Before Done
- Never mark a task complete without proving it works.
- Diff behavior between main and your changes when relevant.
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness.

## 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution."
- Skip this for simple, obvious fixes – don't over-engineer.
- Challenge your own work before presenting it.

## 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding.
- Point at logs, errors, failing tests – then resolve them.
- Zero context switching required.
- Go fix failing CI tests without being told how.

## Task Management
- **Check Existing**: Before creating new task files, check if `tasks/todo.md` or similar already exists in the root.
- **Plan First**: Write plan to `tasks/todo.md` with checkable items.
- **Verify Plan**: Check in before starting implementation.
- **Track Progress**: Mark items complete as you go.
- **Explain Changes**: High-level review summary at each step.
- **Document Results**: Add to `review/`.
- **Capture Lessons**: Update `tasks/lessons.md` after corrections.

## Core Principles
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

## Antigravity-Inspired 3-Layer Architecture Upgrade

**Layer 1: Directive (What to do)** - Living Markdown SOPs stored in `directives/`.
- Define goals, inputs, preferred tools, expected outputs, edge cases, and accessibility rules.

**Layer 2: Orchestration (This LLM's job)** - Read directives → create detailed plan → intelligently route to tools/scripts → handle errors → verify → update `directives/lessons.md`.
- Prefer calling existing execution scripts over pure LLM reasoning when deterministic outcomes are needed.

**Layer 3: Execution (Deterministic heavy lifting)** - Prefer Python scripts in `execution/` folder for repeatable work (scraping, file processing, API calls).
- Only write new code when no suitable script exists → then create one and document in directives.

---

## Nonprofit & Accessibility Priority Guardrail (Aaria's Blue Elephant)

- **Inclusive UX**: Subtle animations only; user-initiated where possible; full `prefers-reduced-motion` support.
- **WCAG Compliance**: High contrast, alt text on all images, no flashing, readable fonts.
- **Palette**: Use soft, sensory-friendly blues (#00AEEF), yellows (#FFE066), purples (#C3AED6), greens (#A8E6CF), pinks (#FFB6C1).
- **Mission Alignment**: Reinforce "fun without barriers," "inclusive play," and "compassionate community."
- **Legal Transparency**: Include Entity No. B20250299015 (101 Felicia Ave, Tracy, CA 95391) and "501(c)(3) status pending" where relevant.
- **Communications**: Warm, hopeful tone. LinkedIn posts 150–300 words. Always include: https://aariasblueelephant.org/.