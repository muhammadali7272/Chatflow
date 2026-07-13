---
skill: git-commit
name: Git Commit
version: 1.0.0
description: Create well-structured commits following the Conventional Commits specification
---

# Git Commit

> A skill for creating well-structured commits following the Conventional Commits specification.

---

## Purpose

Standardize commit messages across the project to enable automatic changelog generation, semantic versioning, and readable git history.

---

## Inputs

| Input | Description | Required |
|-------|-------------|----------|
| `changes` | Summary of changes being committed | Yes |
| `scope` | The scope of the change (e.g., api, auth, ui) | Optional |
| `breaking` | Whether the change is breaking | Optional |

---

## Steps

### 1. Stage Changes

```bash
git add <files>
```

Or to stage all changes:
```bash
git add .
```

### 2. Determine Commit Type

Use one of the following types:

| Type | When to Use |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, whitespace (no code change) |
| `refactor` | Code restructuring (no feature/bug change) |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `chore` | Build, deps, tooling changes |
| `ci` | CI/CD configuration changes |

### 3. Write the Commit Message

**Basic format:**
```
<type>(<scope>): <description>

<body>

<footer>
```

**Examples:**

```
feat(auth): add OAuth2 login flow

Implement Google and GitHub OAuth2 authentication.
Add session management with refresh tokens.
```

```
fix(api): handle null response in user endpoint

Closes #42
```

```
feat(api)!: remove deprecated v1 endpoints

BREAKING CHANGE: The v1 API endpoints have been removed.
Migrate to v2 equivalents.
```

### 4. Commit

```bash
git commit -m "<type>(<scope>): <description>"
```

For multi-line messages:
```bash
git commit -m "<type>(<scope>): <description>" -m "<body>"
```

### 5. Push

```bash
git push origin <branch-name>
```

---

## Outputs

| Output | Description |
|--------|-------------|
| `commit_hash` | The SHA of the created commit |
| `commit_message` | The formatted commit message |

---

## References

- [Conventional Commits](https://www.conventionalcommits.org/)
