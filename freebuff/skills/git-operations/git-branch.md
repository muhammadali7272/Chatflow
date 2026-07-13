---
skill: git-branch
name: Git Branch
version: 1.0.0
description: Manage git branches with consistent naming conventions and workflows
---

# Git Branch

> A skill for managing git branches with consistent naming conventions and workflows.

---

## Purpose

Standardize branch naming across the project to improve collaboration, automate CI/CD workflows, and make branch purposes immediately clear.

---

## Inputs

| Input | Description | Required |
|-------|-------------|----------|
| `type` | Branch type (feature, fix, chore, release) | Yes |
| `description` | Short description of the branch purpose | Yes |
| `issue_ref` | Issue/ticket reference number | Optional |
| `base_branch` | Branch to branch from (default: main) | Optional |

---

## Branch Naming Convention

```
<type>/<issue-ref>-<short-description>
```

| Part | Description | Example |
|------|-------------|---------|
| `type` | Branch category | `feat`, `fix`, `chore`, `release` |
| `issue-ref` | Issue/ticket number | `42`, `PROJ-123` |
| `description` | Brief kebab-case description | `add-login`, `fix-null-ref` |

**Examples:**
- `feat/42-add-oauth-login`
- `fix/103-handle-null-response`
- `chore/89-update-deps`
- `release/v1.2.0`

---

## Steps

### 1. Ensure You're on the Base Branch

```bash
git checkout <base-branch>
git pull origin <base-branch>
```

### 2. Create the Feature Branch

```bash
git checkout -b <type>/<issue-ref>-<short-description>
```

### 3. Make Changes and Commit

```bash
# Make your changes...
git add <files>
git commit -m "<type>: <description>"
```

### 4. Keep Branch Updated

```bash
git pull origin <base-branch> --rebase
```

### 5. Push Branch

```bash
git push origin <type>/<issue-ref>-<short-description>
```

### 6. Create Pull Request

When ready, open a PR from your branch to the base branch.

### 7. Clean Up After Merge

```bash
git checkout <base-branch>
git pull origin <base-branch>
git branch -d <type>/<issue-ref>-<short-description>
```

---

## Outputs

| Output | Description |
|--------|-------------|
| `branch_name` | The created branch name |
| `pr_url` | URL to the pull request (if created) |

---

## References

- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Git Branching](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)
