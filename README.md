# Astraea AI

A premium AI workspace built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, and Supabase.

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to connect the existing Supabase project. Set `AI_GATEWAY_API_KEY` for local AI responses; Vercel deployments can use their automatically injected OIDC token. Without Supabase variables, Astraea runs in an explicit local preview mode and never writes remote data.

## Current integration

- Supabase SSR authentication and session refresh
- Sign-in, registration, sign-out, and protected routes
- Existing workspace membership and row-level security model
- Persistent conversations and messages
- Authenticated streaming AI responses through Vercel AI Gateway
- Conversation search, rename, and delete actions
- Enter to send, Shift+Enter for newline, focus restoration, and auto-growing composer
- Responsive sidebar, Markdown, styled code blocks, and polished loading/error states

No database migration is applied by this repository at this checkpoint.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The opt-in integration runner creates isolated temporary users, exercises the live database, and removes its test data in a `finally` block. It additionally requires `SUPABASE_SERVICE_ROLE_KEY` in the command environment; never store that key in a client-visible variable or commit it.

```bash
pnpm test:integration
```
