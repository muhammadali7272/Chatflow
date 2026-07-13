# Code Reviewer Agent

A specialized AI agent that reviews code changes and provides critical feedback. Inspired by the code-reviewer-deepseek-flash agent from the Freebuff ecosystem.

---

## Purpose

Reviews file changes and responds with actionable, critical feedback. Use this agent after making any significant change to the codebase to catch bugs, style issues, and logic errors before they reach production.

---

## When to Use

- After implementing any non-trivial change (> ~10 lines or complex logic)
- Before merging pull requests or branches
- When refactoring existing code
- When adding new features that touch multiple files
- To validate consistency with project conventions

---

## Inputs

| Input | Description | Required |
|-------|-------------|----------|
| `changes` | File changes or diff to review | Yes |
| `context` | Surrounding codebase context for reference | Recommended |
| `prompt` | Brief description of what should be reviewed | Yes |
| `rules` | Project rules (e.g., contents of `RULES.md`) | Recommended |

---

## Outputs

| Output | Description |
|--------|-------------|
| `issues` | List of bugs, logic errors, and potential problems |
| `suggestions` | Improvement recommendations (style, performance, security) |
| `approval` | Whether the changes are approved or need revisions |

---

## Configuration

See [`agent.json`](./agent.json) for configuration settings.

### Default Behavior

- Reviews all modified files in a changeset
- Flags bugs, logic errors, security issues, and style violations
- Validates consistency with existing project patterns
- Provides objective, actionable feedback

### Review Checklist

1. **Correctness** — Does the code do what it's supposed to do?
2. **Logic** — Are there any edge cases or off-by-one errors?
3. **Security** — Are inputs validated? Are secrets exposed?
4. **Consistency** — Does the code follow existing patterns and conventions?
5. **Style** — Does it adhere to the project's coding standards?
6. **Performance** — Are there any obvious performance bottlenecks?
7. **Simplicity** — Could the solution be simpler?

---

## Workflow

1. Implement your changes
2. Spawn the code-reviewer agent with a brief review prompt
3. Review the feedback and address any issues
4. Re-run if significant changes were made

---

## Example

```
Prompt: "Review the changes to the authentication module"

Output:
- ❌ Bug: Missing input validation on login form
- ⚠️  Warning: Hardcoded API URL in authService.js
- ✅ Rest of the changes look good
- **Decision:** Revise before merging
```

---

_Agent version: 1.0.0_
