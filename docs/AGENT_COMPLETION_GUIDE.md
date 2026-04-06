# Agent Completion Guide — Why AI Agents Don't Finish Apps (And How to Fix It)

**Repository:** `midnghtsapphire/reese-reviews`
**Author:** Copilot Agent (analysis session April 5, 2026)
**Audience:** Audrey Evans (owner), all AI agents working on this repo

---

## The Problem

> "I am having a real problem getting agents to ship apps that never seem to get all the way done."
> — Audrey Evans, Issue #issue

This is one of the most common frustrations when working with AI coding agents. It is not a bug in the agents — it is a **systems design problem** that can be solved with the right structure. This document explains exactly why it happens and gives you a complete playbook to fix it.

---

## Why Agents Fail to Finish

### 1. No Shared Memory Between Sessions

Every AI agent session starts with a blank slate. When a session ends — whether the agent finishes normally, times out, hits an error, or you close the tab — **everything the agent knew is gone**.

The next agent session (even with the same AI tool) has no idea:
- What was built last session
- What was partially built and left incomplete
- What the next step was supposed to be
- What decisions were made and why

**Result:** Each agent session either starts over from scratch, or picks a random task that seems important based on the code it can see right now — ignoring half-finished work.

**Fix:** Every agent session **must end** by writing a `HANDOFF.md` update. Every agent session **must start** by reading `HANDOFF.md`. This is mandatory, not optional.

---

### 2. Tasks Are Too Large for One Session

Most AI agent sessions have a context window limit (typically 100K–200K tokens) and a time limit. A task like "implement Plaid bank integration" touches 8+ files, requires 3 API calls, and needs unit tests. That is a multi-hour task for a human — it is too large for a single agent session.

**What happens:** The agent starts the work, gets 60% done, hits its context limit or time limit, and exits. The next agent looks at the half-implemented code, doesn't know what's missing, and either:
- Assumes it's done and moves on (leaving broken code in place), or
- Rewrites it from scratch (duplicating effort and introducing conflicts)

**Fix:** Break every task into **atomic sub-tasks**, each fitting in one agent session (< 3 files changed, < 200 lines added). Write these sub-tasks in `docs/BACKLOG.md` before starting. Mark each one `Done` only when the code is tested and verified.

---

### 3. No Clear Definition of "Done"

When an agent doesn't know what "done" looks like, it stops when the code compiles or when the happy path works in the browser. It does not:
- Write tests
- Handle error cases
- Update documentation
- Verify integration with other parts of the system

**Fix:** Every backlog item must have **Acceptance Criteria** — a specific, verifiable checklist of what "done" means. See `docs/BACKLOG.md` for the correct format.

---

### 4. Scope Creep in Both Directions

Agents have two opposite failure modes:

- **Over-scoping:** The agent sees related issues while working and "improves" things it wasn't asked to touch, breaking other features and creating merge conflicts.
- **Under-scoping:** The agent completes only the literal request and leaves the surrounding context broken (e.g., adds a new function but doesn't wire it up to the UI that was supposed to call it).

**Fix:** Write tasks with explicit scope boundaries. List exactly which files the agent should touch. Anything outside that list requires a new backlog item.

---

### 5. No Sequential Handoff Protocol

When multiple agents work on the same repo (even the same AI tool, different sessions), they can:
- Work on the same file simultaneously and create merge conflicts
- Undo each other's work
- Duplicate effort
- Leave incompatible implementations

**Fix:** Treat every agent session like a team member shift. One agent works at a time. They read the handoff, do their assigned task, update the handoff, and exit cleanly.

---

### 6. The "Scaffold and Ship" Trap

Agents are very good at quickly generating scaffolded code — components, stores, services, types. They produce beautiful, type-safe, well-named code that *looks* complete but is wired to demo data or no-op functions. This is useful for rapid prototyping but creates a debt pile that never gets paid off.

Signs you're in the scaffold trap:
- Functions that return `Promise.resolve(demoData)` instead of making real API calls
- UI that looks functional but doesn't persist anything
- Environment variables in `.env.example` that are commented out with "uncomment when ready"
- Components with TODO comments inside them
- Files that import a service but never call it

**Fix:** After every scaffold sprint, run a "wire-up audit." Check `docs/BACKLOG.md` for items tagged `Scaffolded`. Each one needs a dedicated wire-up task before you can call the feature complete.

---

### 7. The HANDOFF.md Is Not Read

Even when a `HANDOFF.md` exists, agents frequently skip it. This is partly because many agent tools don't enforce a "read these files first" protocol, and partly because agents are optimized to be helpful immediately by jumping into code.

**Fix:** The first line of every agent's instruction set (in `AGENTS.md`) must say "Read `HANDOFF.md` before writing any code." It currently does say "Check for a HANDOFF.md or TODO.md" but this needs to be even more prominent and enforced.

---

## The Playbook — How to Guarantee Completion

Follow these rules for every feature, every session, every agent.

### Rule 1: One Task Per Session

Pick exactly **one item** from `docs/BACKLOG.md` with status `To Do`. Change its status to `In Progress`. Do not start a second task until the first one is `Done`.

```
✅ CORRECT: Session picks RR-401. Fixes AdminPanel.tsx localStorage. Writes test. Updates BACKLOG.md. Updates HANDOFF.md. Commits. Done.

❌ WRONG: Session picks RR-401, gets halfway, notices ESLint errors, starts fixing those, then notices a missing test, then starts adding tests for an unrelated component. Commits nothing. Exits.
```

### Rule 2: Write Before You Code

Before writing a single line of code, write in `docs/scrum/HANDOFF.md`:
1. What task you are working on (ID + title)
2. Which files you plan to change
3. What "done" looks like

### Rule 3: Update HANDOFF.md At Every Commit

Every time you commit code, update `HANDOFF.md` with:
- What you just did
- What still needs to be done
- Any blockers or discoveries

### Rule 4: If You Can't Finish It, Document It

If you reach the end of your context window or time limit before a task is complete:
1. Commit what you have with a clear `WIP:` commit message
2. Update `HANDOFF.md` with the exact stopping point
3. Update the backlog item with a note on what's left
4. Do not pretend it's done

### Rule 5: Acceptance Criteria Is The Exit Gate

Before marking any item `Done`, verify every acceptance criteria line item. If a criterion says "tests pass," run `npm test`. If a criterion says "no lint errors," run `npm run lint`. Do not mark Done if any criterion is not met.

### Rule 6: No Orphaned Scaffolding

If you build a component, service, or store, it must be:
- Imported and used somewhere, OR
- Marked in the backlog as `Scaffolded — wire-up pending` with a separate backlog item for the wiring

---

## Structural Changes Recommended

### For Audrey (Owner Actions)

1. **Add a BACKLOG check to your PR template** — Require every PR to reference a backlog item ID (e.g., `Resolves RR-401`). This keeps agents accountable.

2. **Add a HANDOFF check to your agent prompts** — When hiring an agent (Copilot, Claude, etc.), always start with: *"Read `docs/scrum/HANDOFF.md` and `docs/BACKLOG.md` first. Pick the highest-priority `To Do` item. Update both files before ending your session."*

3. **Set task size limits** — Any backlog item estimated at more than 8 story points should be broken into sub-tasks before an agent picks it up.

4. **Weekly BACKLOG review** — Once a week, spend 10 minutes reviewing the Inbox section of `docs/BACKLOG.md`. Move items to sprints, adjust priorities, and make sure nothing is stuck in `In Progress` from a dead session.

5. **Use CI to enforce HANDOFF updates** — Consider adding a CI check that warns if `docs/scrum/HANDOFF.md` has not been updated within the last N commits.

---

### For Agents (Must Follow)

When you receive any task in this repository:

```
STEP 1: Read docs/scrum/HANDOFF.md
STEP 2: Read docs/BACKLOG.md
STEP 3: Identify the highest-priority "To Do" item
STEP 4: Update its status to "In Progress" in BACKLOG.md
STEP 5: Write your plan in HANDOFF.md before writing any code
STEP 6: Make ONE focused change, tested, working
STEP 7: Update BACKLOG.md item to "Done" with PR reference
STEP 8: Update HANDOFF.md with what you did and what's next
STEP 9: Commit ALL changes including BACKLOG.md and HANDOFF.md
STEP 10: Exit cleanly
```

---

## Checklist for "Is This Feature Actually Done?"

Use this checklist for every backlog item before marking it `Done`:

- [ ] The code compiles with no TypeScript errors (`npm run typecheck`)
- [ ] ESLint passes with no new errors (`npm run lint`)
- [ ] All tests pass (`npm test`)
- [ ] The feature works end-to-end in the browser (not just in tests)
- [ ] Error cases are handled (what happens if the API call fails?)
- [ ] No new `any` types introduced
- [ ] No hardcoded credentials, URLs, or secrets
- [ ] Environment variables are added to `.env.example` (with placeholder values)
- [ ] The relevant documentation is updated (README, CHANGELOG, HANDOFF)
- [ ] `BACKLOG.md` item is marked `Done` with the PR/commit reference
- [ ] `HANDOFF.md` is updated with next steps

---

## Signs a Session Went Wrong

Watch for these signals that an agent session did not complete cleanly:

| Signal | What It Means |
| :--- | :--- |
| Commit message starts with `WIP:` | Task is incomplete. Read HANDOFF.md. |
| `HANDOFF.md` not updated in last commit | Agent may have exited without completing. Check backlog item status. |
| Backlog item stuck `In Progress` for > 24 hours | Likely abandoned. Reset to `To Do` and re-assign. |
| New file exists but is never imported anywhere | Scaffold trap. Add a wire-up task to the backlog. |
| `// TODO: implement` in a committed file | Incomplete work. Create a backlog item for it. |
| Tests added but never run (no CI evidence) | Tests may be broken. Run `npm test` to verify. |
| Build passes locally but CI fails | Environment variable missing or TypeScript error. Check CI logs. |

---

## Summary

The root cause of incomplete app development with AI agents is **the same as with human developers who lack process**: no shared memory, no single source of truth, no clear definition of done, and no handoff protocol.

The fix is not a better AI model. The fix is:
1. A shared `BACKLOG.md` everyone reads and updates
2. A mandatory `HANDOFF.md` protocol enforced at every session boundary
3. Small, atomic tasks with acceptance criteria
4. A "done means tested and wired" standard — no orphaned scaffolding

This repository has the foundation. Execute the playbook above consistently and every agent session will ship working, complete code.
