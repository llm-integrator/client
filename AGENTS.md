# Agent guide: client (`llm-integrator/client`)

This document is the **source of truth** for the client repository. Agents and developers working in `client/` must follow it, plus this repo’s local rules (linting, formatting, `.cursor/rules` if present).

## Stack

| Area | Technology |
|------|------------|
| UI | **React** |
| Language | **TypeScript** (strict typing; avoid `any` unless justified) |
| Build / dev server | **Vite** |
| Components & styling | **Ant Design** (`antd`); theming and tokens per project conventions |

Run and build commands: see this repository’s `package.json`.

## Architecture: Feature-Sliced Design (FSD)

The client follows **FSD**. New code must fit the layers and respect dependency direction.

### Layers (top to bottom — who may depend on whom)

Typical hierarchy (confirm against the actual folder layout in the repo):

- **app** — providers, routing, bootstrap, global styles/theme.
- **processes** (if used) — cross-page scenarios.
- **pages** — compose widgets and features for screens/routes.
- **widgets** — larger UI blocks with application logic.
- **features** — user-facing actions (“do X”).
- **entities** — business entities, view models, entity-level UI pieces.
- **shared** — utilities, API client, UI-kit wrappers, non-domain constants.

**Import rule:** a layer may import only from **lower** layers (closer to `shared`), not the other way around. Do not bypass FSD boundaries (e.g. pulling `entities` from upper layers through forbidden paths).

### Slices and public API

- Each slice is a folder with an **explicit public API** (usually `index.ts` at the slice root).
- Other modules import **only from the public API**, not from another slice’s internal files (`import { X } from 'entities/foo'` — yes; `import ... from 'entities/foo/ui/Secret.tsx'` — no).

### Ant Design

- Use **antd** components; customize via `ConfigProvider`, theming, and when needed wrappers under **shared/ui**.
- Do not mix several incompatible component libraries without a project-level decision.

### Data and API

- Backend calls go through a single layer (e.g. `shared/api` or `entities` plus adapters), not scattered `fetch` calls duplicating base URLs and error handling.
- Align response types with the server contract where possible (hand-written types, OpenAPI codegen — per project choice).

### Tests and quality

- Follow **eslint / prettier / vitest** (or whatever is wired in `package.json`).
- Cover new features with tests according to repo conventions.

## Relationship to the composition repository

The parent (composition) repository only links this project as a submodule. **All detailed client guidance lives here in `client/AGENTS.md`.**
