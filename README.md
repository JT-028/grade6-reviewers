# Grade 6 reviewers

Static, self-contained Q1/Q2 study guides published with GitHub Pages. Open `index.html`
or serve the repository with `npx --yes serve . -p 8766`.

## Family access work

M1 adds a self-contained `family.html` for parent sign-in, child profiles, device
approval and child PIN access. The hub and eight reviewers link to it. Guest study
content, scores and existing browser progress keep their original behavior.

**Family access is disabled in the published configuration.** No hosted database,
Edge Function or parent account was created by this implementation. Study history,
cloud score recording, study timers, trends and daily rewards are later milestones.

- [Architecture](docs/plans/family-progress/ARIA_BLUEPRINT_v1.md)
- [M1 setup and verification](docs/plans/family-progress/M1_SETUP.md)
- [M1 implementation report](docs/plans/family-progress/MASON_M1_REPORT_v1.md)

Run local checks (Deno is available through `npx`):

```powershell
npx --yes deno check --config supabase/functions/family-api/deno.json supabase/functions/family-api/index.ts
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-env --allow-read --allow-sys tests/family
```

The database tests use embedded PostgreSQL with explicitly isolated test-only
pgcrypto shims. They verify authorization/SQL behavior, not production encryption
or hosted Supabase integration. A real Supabase integration check is required
before release. No build framework is needed for the public reviewers.
