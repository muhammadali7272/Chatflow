# Git Operations Skills

> A collection of reusable, self-contained git workflow skills for the Freebuff ecosystem.

---

## Available Skills

| Skill | File | Description |
|-------|------|-------------|
| **Commit** | [`git-commit.md`](./git-commit.md) | Craft conventional commits with proper structure and messages |
| **Branch** | [`git-branch.md`](./git-branch.md) | Manage branches with consistent naming and workflows |
| **Release** | [`git-release.md`](./git-release.md) | Automate release workflows, versioning, and changelogs |

---

## Usage

Skills can be loaded by name via the Freebuff `skill` tool:

```
skill git-commit
```

Each skill contains YAML frontmatter with metadata (`skill`, `name`, `version`, `description`) followed by step-by-step instructions that can be executed by an AI agent or followed manually.

## Conventions

Skills in this directory follow these conventions:
- **kebab-case** for file names
- **YAML frontmatter** with `skill`, `name`, `version`, `description` fields
- **Markdown** format with clear sections: Purpose, Inputs, Outputs, Steps
- **Self-contained** — each skill should be usable independently

---

_Last updated: 2026-07-13_
