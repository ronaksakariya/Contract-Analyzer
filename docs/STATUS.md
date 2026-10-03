# Status

Running record of what is done, partially done and not done. Feeds the README.

## Phase 0: Scaffold — DONE

### Done

- npm workspaces monorepo: `apps/web` (`@app/web`), `apps/api` (`@app/api`), `packages/shared` (`@app/shared`).
- Root scripts: `dev` (api + web via `concurrently`), `build`, `typecheck`, `test`, `fixtures`, `format`.
- `packages/shared`: `squash` / `squashWithMap` / `isBoundaryOk` (the verification + highlighting text model), shared Zod schemas, typed SSE `ChatEvent`, highlight stub.
- `apps/api`: Express 5 + TypeScript (ESM), `config.ts` loading the **root** `.env` (two levels above `apps/api`) and validating it with Zod (fails fast with a readable message), `logger.ts` (pino), `db.ts` (Mongoose), `app.ts` (`helmet`, `cors`, `pino-http`, rate limits, `{code,message}` error handler, `GET /health`), `index.ts`, `FakeLLM` skeleton, `tsup` build config.
- `apps/web`: Next.js 16 App Router, TypeScript, Tailwind v4, `src/` dir, shadcn/ui (radix / nova preset) with Button, Card, Badge, Dialog, Tabs, Select, DropdownMenu, Skeleton, Tooltip, Sonner, ScrollArea, Resizable. `transpilePackages: ['@app/shared']`. `.env.local` with `NEXT_PUBLIC_API_URL` (git-ignored).
- Vitest configured in all three workspaces; placeholder tests pass (shared squash model 10 tests, API `/health`, web shared-import).
- ESLint (flat config) + Prettier.

### Notes / deviations (rule 8, latest compatible versions)

- **TypeScript 5.9.3, not the newly-published 7.0.2.** `eslint-config-next@16.3.8` depends on `typescript-eslint@8.71.0`, whose peer range is `>=4.8.4 <6.1.0`. TS 7 would produce an invalid peer dependency, so 5.9.3 is the newest _compatible_ version.
- **ESLint 9.39.5, not 10.12.0.** `eslint-config-next`'s bundled plugins (`eslint-plugin-import`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react`) cap at ESLint `^9`. ESLint 10 installs with invalid peers, so 9.39.5 is the newest _compatible_ version.
- **`@types/node` 24.x** to match the Node 24 runtime.
- Everything else is latest stable: Next 16.3.8, React 19.2.8, Express 5.2.1, Mongoose 9.10.4, Zod 4.6.5, Tailwind 4.3.3, Vitest 5.0.3, openai 7.27.0.

### Behaviour worth knowing

- `connectDb()` fails fast on a bad database in production, but in development/test it logs an error and keeps serving so `/health` can report `db: "disconnected"`. This was needed because the local Atlas cluster rejects the current IP.

### Not done (later phases)

- Ingestion pipeline, verifier wiring, chat/SSE, viewer + highlighting, multi-doc, comparison, agent mode, deployment.
- `MONGODB_URI` in `.env` points at an Atlas cluster that is not reachable from the current environment (IP not allow-listed). Fix the Atlas Network Access list (or use `mongodb-memory-server` for tests) before Phase 1 integration tests.
