# Project Guidance

## User Preferences

- Clean academic look: warm off-white background, deep indigo primary, amber accent for highlights, Fraunces serif headings, Inter body text, rounded cards, subtle shadows, smooth transitions, fully responsive.
- The LLM must never reveal the full correct answer to students; it returns only guiding Socratic questions.
- Every AI judgement must display its confidence and be teacher-overridable.
- All LLM calls use the platform's Caffeine Inference extension with the platform-provisioned model router; no external API keys and no model picker.

## Accepted Requirements

[Filled after each deployed build — what the user asked for and the build delivered]

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- The migration chain must hold exactly one pending file relative to the empty baseline; the stable-compat check aborts before type-checking when more are pending.
- Mixins must take state as parameters; main.mo passes the same record bindings to each include so writes are shared.
- OQL Expose entities from two libs concatenate with .concat; each entity uses controllerOrScoped with a per-row owner check.
- caffeineai-inference-client: fromEnv<system>() must be called inside the shared method; ChatCompletionResponseMessage.content is ?Text.
- The Answer Page feedback feature uses the backend inference path, so frontend tests that mock the actor never exercise the real LLM outcall.
- validateQuote enforces the exact-substring-or-null evidence contract server-side, so the frontend can safely skip non-matching quotes.
- TanStack Router 1.131 code-based routing: createRootRoute + createRoute with getParentRoute, then createRouter({routeTree}).
- biome check flags import-sort and format on pre-existing files too; run pnpm fix then re-verify typecheck and check.
- queryKeys.submission is a function; invalidate with the prefix key or call it with the id.
- Principal is not re-exported from the generated backend module; use the exported UserId alias for principal arguments.
