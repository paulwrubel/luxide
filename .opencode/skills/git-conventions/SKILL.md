---
name: git-conventions
description: Conventional commit format for PR titles, branch names, and commit messages. Use when creating commits, branches, or pull requests.
---

# Git Conventions

All git interactions (commits, branches, pull requests) must follow these conventions.

## Rules

1. **PR titles MUST use conventional commit format** — The PR title must start with one of the allowed types in ALL CAPS, followed by a colon and space, then a brief description in Title Case:

   Allowed types:
   - `FEAT:` — a new feature
   - `FIX:` — a bug fix
   - `CHORE:` — maintenance, dependency bumps, tooling changes
   - `DOCS:` — documentation changes
   - `STYLE:` — formatting, whitespace, semicolons (no logic changes)
   - `REFACTOR:` — code restructuring without feature changes or bug fixes
   - `PERF:` — performance improvements
   - `TEST:` — adding or updating tests

   ✅ Correct:
   ```
   FEAT: Add Confirmation Dialog Before Deleting a Render
   FIX: Use Frame-Relative Depth for List Item Indentation
   CHORE: Lower Default Resource Usage Limit for Non-Admins
   DOCS: Update API Reference for Checkpoint Endpoints
   ```

   ❌ Anti-pattern:
   ```
   feat: add feature          (must be ALL CAPS)
   Add confirmation dialog    (missing type prefix)
   Feat: Add confirmation     (wrong casing)
   FEAT:add feature           (missing space after colon)
   ```

2. **Commit messages use simple sentence-case** — Describe the change in plain language as a simple action sentence (imperative mood). Do NOT use conventional commit prefixes in commit messages.

   ✅ Correct:
   ```
   Add confirmation dialog to the renders screen
   Fix off-by-one in tile boundary calculation
   Update Rust edition to 2024
   ```

   ❌ Anti-pattern:
   ```
   FEAT: Add confirmation dialog    (no conventional commit prefix in commits)
   WIP                               (not descriptive)
   fix                               (too vague)
   ```

3. **Branch names** — Use kebab-case with a type prefix. Examples: `feat/user-uploads`, `fix/bvh-intersection`, `chore/update-deps`.

## When creating a PR

Always populate the `.github/pull_request_template.md` template — fill in the Context, Solution, and Notes for Reviewers sections. Apply rules 1 and 3. The PR title MUST use conventional commit format with Title Case. Example: `FEAT: Add Confirmation Dialog Before Deleting a Render`

## When committing

Apply rule 2. Commit messages describe the change in plain sentence-case. No type prefixes.

## When branching

Apply rule 3. Use kebab-case with a type prefix.

## When pushing

4. **Use bare `git push` or `git push -u origin <branch>`** — Never use `git push origin <branch>` without `-u`. The `-u` flag sets the upstream tracking reference so that subsequent bare `git push` commands work.

   ✅ Correct:
   ```
   git push
   git push -u origin feat/my-branch
   ```

   ❌ Anti-pattern:
   ```
   git push origin feat/my-branch    (missing -u flag)
   ```
