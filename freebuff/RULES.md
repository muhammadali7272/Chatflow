# Freebuff Project Rules

> This file defines the rules, conventions, coding standards, folder structure guidelines, naming conventions, and workflow instructions for the Freebuff project. Update this file whenever new project rules are introduced.

---

## Table of Contents

1. [Folder Structure](#1-folder-structure)
2. [Naming Conventions](#2-naming-conventions)
3. [Coding Standards](#3-coding-standards)
4. [Task Management](#4-task-management)
5. [Documentation](#5-documentation)
6. [Workflow Instructions](#6-workflow-instructions)

---

## 1. Folder Structure

```
freebuff/
├── agents/          # AI agents and multi-agent architecture files
├── mcps/            # MCP (Model Context Protocol) configurations & servers
├── skills/          # Reusable FreeBuff skills (organized by category)
├── tasks/           # Task tracking
│   ├── task.md      # Active tasks
│   └── done.md      # Archived completed tasks
└── RULES.md         # This file — project rules & conventions
```

### Directory Descriptions

| Directory | Purpose |
|-----------|---------|
| `agents/` | Store every AI agent configuration, documentation, and multi-agent architecture files. Each agent should have its own subfolder. |
| `mcps/` | Store all Model Context Protocol (MCP) configurations, server definitions, settings, and related files. |
| `skills/` | Store every newly created or imported FreeBuff skill. Organize skills by category when necessary (e.g., `skills/git/`, `skills/deployment/`). |
| `tasks/` | Track active and completed tasks. Never delete completed work — archive it. |

---

## 2. Naming Conventions

### General
- **Directories:** Use lowercase with hyphens for multi-word names (e.g., `auth-flow/`, `deployment-scripts/`).
- **Files:** Use kebab-case for configuration files (e.g., `docker-compose.yml`), PascalCase for component files (e.g., `AuthProvider.ts`), and camelCase for utility/helper files.
- **Agent folders:** Use the agent name in kebab-case (e.g., `code-reviewer/`, `file-picker/`).
- **Skill folders:** Use the category name in kebab-case (e.g., `git-operations/`, `api-integration/`).

### Task Entries
- Task titles should be concise and actionable (e.g., "Set up CI/CD pipeline" rather than "CI/CD").
- Use the format: `[Category] Task description` when applicable.

---

## 3. Coding Standards

### General Principles
- **Simplicity:** Prefer simple, readable solutions over complex ones.
- **Minimalism:** Make as few changes as possible to address the requirement.
- **Code Reuse:** Always reuse existing helpers, components, and classes before creating new ones.
- **Consistency:** Follow existing patterns in the codebase. Analyze surrounding code before making changes.

### Documentation
- Document public APIs, complex logic, and non-obvious decisions.
- Keep comments concise and meaningful — explain the "why," not the "what."
- Update documentation whenever project structure changes.

### Error Handling
- Handle errors gracefully with meaningful messages.
- Log errors appropriately for debugging without exposing internals to users.

### Security
- Never hardcode secrets or credentials in code.
- Validate and sanitize all user inputs.
- Use secure protocols and follow best practices for authentication and authorization.

---

## 4. Task Management

### Active Tasks (`task.md`)
- All tasks being worked on must be listed in `task.md`.
- Each task entry should include:
  - Creation date
  - Priority (High / Medium / Low)
  - Status (In Progress / Blocked / Pending)
  - Description
  - Dependencies (if any)

### Completed Tasks (`done.md`)
- When a task is completed:
  1. Remove it from `task.md`
  2. Append it to `done.md` with the completion date
- Never delete completed work — archive it appropriately.

### Task Workflow
1. Open a new task by adding it to `task.md`
2. Work through the task, updating its status as needed
3. Upon completion, move it to `done.md` with the completion date
4. Update `RULES.md` if any new conventions or rules were established during the task

---

## 5. Documentation

- `RULES.md` is the source of truth for all project rules and conventions.
- Update `RULES.md` whenever:
  - A new folder or category is added to the structure
  - A new naming convention is adopted
  - A new coding standard is introduced
  - The workflow changes
- Keep documentation clean, organized, and up to date.

---

## 6. Workflow Instructions

### Adding a New Agent
1. Create a folder under `agents/` with the agent name (kebab-case).
2. Add a `README.md` with agent description, inputs, and outputs.
3. Add configuration files as needed.

### Adding a New Skill
1. Create a subfolder under `skills/` by category (or root if standalone).
2. Add the skill file(s) with clear naming (kebab-case).
3. Include YAML frontmatter at the top of each skill file with the following fields:
   ```yaml
   ---
   skill: <skill-name>
   name: <Human-Readable Name>
   version: <semver>
   description: <one-line description>
   ---
   ```
4. Update `RULES.md` if a new category was created.

### Adding an MCP Configuration
1. Add files under `mcps/` with descriptive names.
2. Include documentation for the MCP server/settings.

### Completing a Task
1. Update the task status as needed throughout work.
2. When complete, move the entry from `task.md` to `done.md`.
3. Add the completion date to the entry in `done.md`.
4. Update `RULES.md` if any new conventions were established.

---

_Last updated: 2026-07-13_
