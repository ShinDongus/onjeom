# Codex agent instructions — 온점. (Onjeom)

You are implementing a Korean-language, calm productivity & flower-garden app based on the existing working prototype.

## Nonnegotiable product requirements

1. This is **not** an ADHD diagnosis/treatment app. Its purpose is low-friction thought capture, one action at a time, and calm achievement.
2. Keep the core flow: capture scattered thoughts -> user-confirmed task extraction -> show ONE next action -> complete/postpone -> plant grows -> flower blooms -> user optionally registers it in catalog.
3. Growth is based on completed REAL actions, not focus duration. Never require a timer or consecutive daily streak. Never punish skipped days; dormant tasks are stored as seeds and restored later.
4. Initially 12 flower species. Flowers may have rare color variants and seasonal varieties (Christmas, Halloween, New Year, Chuseok). Dates for Chuseok must be official year-specific calendar data, not a fixed Gregorian date.
5. Flower quotes are originally written, clearly differentiated from traditional botanically claimed 'flower meanings'. Flower words/cards are viewable and savable without ads.
6. **Rewarded ads are triggered only when a FREE user voluntarily FIRST REGISTERS a new species+color in the catalog.** Blooming is always free. No ads on duplicate entries. No surprise full-screen ads. If ad is unavailable/cancelled, keep the bloom pending forever. PLUS users bypass the ad. Rare chances cannot depend on payment.
7. No real money for random flower draws. Do not monetize rare drops.
8. No faux AI claims: existing prototype has a HEURISTIC Korean parser. If integrating AI, add actual remote provider behind secure backend with explicit user consent and clear errors. Never ship a client-side model key.
9. No faux monetization claims: existing prototype uses a rewarded-ad simulation and PLUS developer toggle, **not real ad or purchase SDKs**. Clearly label simulations until integrated.
10. User data is private. Adopt local-first storage, clear deletion, data export. Do not send private task text to analytics/ads. Do not use personal task content for targeting.

## Coding discipline

- Read README.md and src/logic.mjs first; preserve the tested business rules and extend tests for any rule changes.
- Target polished iOS/Android UI, accessible typography, calm sage/cream palette, Korean strings, motion-reduction setting.
- No arbitrary medical promises, exaggerated efficacy, made-up claims, or invented events.
- Avoid breaking local web prototype when migrating to Expo. If possible share pure task/flower domain functions.
- Run `npm test` on each change. Separate 'implemented' from 'planned'.
- When adding native build, update README with exact install, build, and deploy commands.

## Definition of done for the next Codex iteration

- Expo app works on a compatible development build (Android/iOS), with Today, Garden, Catalog, Seeds screens.
- CRUD, persistence, flower growth, bloom, catalog, duplicate no-ad, and seasonal config are covered by tests.
- AI and ads are clearly mocked or correctly integrated; no misleading labels.
- Basic Korean UI accessibility and error states work.
