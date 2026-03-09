# Memory

Notes that persist across sessions. Claude reads this at the start of each conversation.
Update this file when new patterns or preferences are confirmed.

## User profile

- Senior full-stack developer — skip basic explanations
- Language: Spanish for conversation, English for code and comments
- Prefers concise responses, no filler text or emojis unless asked
- Stack: TypeScript, React 19, Next.js 16+, Hono, Drizzle ORM, PostgreSQL, Redis, Web3

## Don't repeat or over-explain

- async/await, React hooks, basic TypeScript — user knows this
- "you could also..." alternatives unless explicitly exploring options
- Long preambles before code — just write the code

## Confirmed stack decisions

- Package manager: pnpm
- ORM: Drizzle (not Prisma)
- Client state: TanStack Query v5 (not SWR, not React Query v3)
- Forms: TanStack Form v1 (not React Hook Form)
- Styling: Tailwind v4 (not v3 patterns)
- Auth: Better Auth
- Testing: Vitest + Playwright

## Active projects

<!-- Add project-specific notes here as they're confirmed -->

- claude-code-config: this repo — Claude Code hooks, agents, skills, commands

## Notes

<!-- Add cross-session notes here, e.g. decisions made, things to remember -->
