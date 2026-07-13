---
skill: git-release
name: Git Release
version: 1.0.0
description: Automate software releases with semantic versioning, changelog generation, and tagging
---

# Git Release

> A skill for automating software releases with semantic versioning, changelog generation, and tagging.

---

## Purpose

Standardize the release process to ensure consistent versioning, generate changelogs from conventional commits, and create reliable release artifacts.

---

## Inputs

| Input | Description | Required |
|-------|-------------|----------|
| `version_bump` | Type of version bump (major, minor, patch) | Yes |
| `branch` | Branch to release from (default: main) | Optional |
| `dry_run` | Preview changes without executing | Optional |

---

## Semantic Versioning

Given a version number `MAJOR.MINOR.PATCH`:

| Bump | When | Example |
|------|------|---------|
| **MAJOR** | Breaking changes (`BREAKING CHANGE` or `!`) | `1.0.0` → `2.0.0` |
| **MINOR** | New features (`feat`) | `1.0.0` → `1.1.0` |
| **PATCH** | Bug fixes (`fix`) and other non-breaking changes | `1.0.0` → `1.0.1` |

---

## Steps

### 1. Ensure You're on the Release Branch

```bash
git checkout main
git pull origin main
```

### 2. Determine the New Version

Check recent commits to determine the version bump:

```bash
git log --oneline <last-tag>..HEAD
```

Based on the commits:
- Commits with `!` or `BREAKING CHANGE` → **major** bump
- Commits with `feat` → **minor** bump
- Commits with `fix`, `chore`, etc. → **patch** bump

### 3. Update Version

Update the version in:
- `package.json` (for Node.js projects)
- `Cargo.toml` (for Rust projects)
- Any other version files

> **Note:** `--no-git-tag-version` is used below because the git tag will be created manually in step 6.

```bash
# Example for Node.js
npm version <major|minor|patch> --no-git-tag-version
```

### 4. Generate Changelog

Create or update `CHANGELOG.md`:

```markdown
## [1.1.0] - 2026-07-13

### Features
- feat(auth): add OAuth2 login flow (#42)
- feat(api): add rate limiting (#45)

### Bug Fixes
- fix(api): handle null response in user endpoint (#43)
```

### 5. Commit the Release

```bash
git add package.json CHANGELOG.md
git commit -m "chore(release): v<version>"
```

### 6. Tag the Release

```bash
git tag -a v<version> -m "Release v<version>"
```

### 7. Push Changes and Tags

```bash
git push origin main
git push origin v<version>
```

### 8. Create Release Branch (for major releases)

For major releases, consider creating a long-lived release branch:

```bash
git checkout -b release/v<major>.<minor>
git push origin release/v<major>.<minor>
```

---

## Outputs

| Output | Description |
|--------|-------------|
| `version` | The new version number |
| `tag` | The created git tag (e.g., `v1.2.3`) |
| `changelog` | Generated changelog entries |
| `release_branch` | Release branch name (if created) |

---

## References

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
