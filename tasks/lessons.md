# Lessons Learned

> Patterns to avoid, corrections to remember, rules for myself.

## Prisma Schema

- **Always inspect the actual schema** before writing queries. Field names, enums, and relations change — never assume from memory.
- `status` enums vary per model (e.g. `ARCHIVE` vs `INACTIVE`). Check the exact enum.
- Fields like `kycNextReviewDate`, `irTaxRate` — use exact casing from schema, not guesses.

## Logger API

- Logger calls require `LogContext` objects, never plain strings as second arg.
- Pattern: `logger.warn('message', { module: 'xxx', error: e.message })`

## Environment & Tooling

- `npx` / `node` not available in Cascade shell — user must run Prisma migrations manually.
- Always place API keys in `.env.local` (gitignored), never in code or `.env.example`.

## TypeScript Server

- TS server can cache stale module resolution — file exists but lint shows "cannot find module". Not a real error. Restart TS server to fix.

## Code Cleanup

- When removing a provider/feature (e.g. Ollama), grep the ENTIRE codebase for residual references: types, configs, switch cases, status functions.
- Dead code blocks left as "compatibility stubs" cause scope errors — delete cleanly instead.

## UI Components — Select

- Radix UI `<Select>` REQUIRES `<SelectTrigger>`, `<SelectContent>`, `<SelectItem>` children. Using native `<option>` inside `<Select>` renders nothing — the dropdown silently breaks with no error.
- Always import: `Select, SelectTrigger, SelectValue, SelectContent, SelectItem` from the UI lib.

## Forms — Controlled Inputs

- Every form input (`<Input>`, `<Textarea>`, `<select>`) MUST have `value` + `onChange` bound to React state. Otherwise the submit handler has no data to send.
- The submit button MUST either be `type="submit"` inside a `<form onSubmit>`, or have an explicit `onClick` calling the mutation. Never leave it as a bare `<Button>` with no handler.
- Always test: "If I click this button, does anything actually happen?"

## Branding & Naming

- The AI assistant is branded **AURA** everywhere user-facing. Never use "Agent IA", "Assistant IA", or generic labels.
- Provider display: show `OpenAI` or `Mistral` (not `Ollama` or legacy names).
- The `AIStatusData.provider` type must match the actual providers in `aura-config.ts`.

## RAG Visibility

- The term "RAG" must NEVER appear in user-facing UI (labels, tooltips, headings). Use "Recherche sources", "Base de connaissances", or "Enrichissement contextuel" instead.
- Code-level variable names (ragContext, ragSources, etc.) are fine — only visible text matters.

## Chakra UI v3 + Framer Motion

- **NEVER use `motion.create()` with Chakra v3 components** (Box, Circle, Container, etc.). It crashes because Chakra v3's `styled()` wrapper doesn't expose a compatible `forwardRef`.
- Use `motion.div` / `motion.span` instead, and nest Chakra components inside for styling.
- When mixing animation + Chakra style props: `<motion.div ...framer-props><Box ...chakra-props>children</Box></motion.div>`
- `whiteAlpha.*` and `blackAlpha.*` tokens don't exist in v3 — use `rgba(255,255,255,0.x)` instead.

## AURA Proactive UX

- Auto-greeting: fires once per session via `sessionStorage.getItem('aura-greeted')`, 2.5s delay, auto-dismiss after 8s.
- FAB (Floating Action Button): always visible when panel is closed, positioned `fixed bottom-6 right-6 z-50`.
- The greeting toast sits above the FAB, clicking it opens the panel.
