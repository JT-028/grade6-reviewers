# M2 production bridge setup v1

Activation candidate update, 2026-10-25: the reviewed backend is deployed (DEP_M2_BACKEND_REPORT_v1). The current working tree intentionally enables family/reviewer history and reports, leaves JPEG false/adapters null, and repairs additive cold-storage transport initialization. See MASON_M2_ACTIVATION_REPORT_v1 for current checks and rollout/rollback instructions. The closed-gate descriptions below record the earlier bridge build; they are not the activation candidate's current flags. Luna commit, Quinn PASS and Dep publication remain required.

2026-10-25 · Mason build packet · local implementation only. Dep must use a later Luna-committed SHA with Quinn PASS. This document authorizes no hosted operation. JPEG is a separate slice.

## Exact artifacts and closed client gates

- Additive SQL: `supabase/migrations/202610240001_m2_attempt_history.sql`.
- Edge entry/dependencies: `index.ts`, `auth.ts`, `validation.ts`, `crypto.ts`, `m2-contract.ts`, `m2-progress.ts`, `m2-bridge.ts`, `m2-catalog.json`, `deno.json`, `deno.lock` in `supabase/functions/family-api/`. Deploy the complete dependency graph; never deploy test repositories/templates.
- Browser transport/report owners: `family.html` and all eight unchanged published reviewer filenames. The maintenance sources are `tests/family/m2_transport_template.js`, `m2_reviewer_template.js`, `m2_report_template.js` and their builders.
- All nine HISTORY/REPORT/JPEG flags remain false; all nine local adapters remain null. Family M1 remains enabled; eight reviewer FAMILY_ENABLED flags remain false. No source query/hash/localStorage switch enables production features.
- `index.html` already uses same-tab quarter-preserving links; inspection found no required change.

SHA256 of exact CRLF bytes:

| Artifact | SHA256 |
|---|---|
| Original M1 migration | `ED2ADCF2FA3CE024336D9243E67D319C4BCF50493C82F540BCEA717045248965` |
| M2 migration | `432305270E36247E9D69233997A19C513917BDEF3277905E964256FFFBD61CCC` |
| Frozen catalog JSON file | `F749F9A32F2D7A85628A5510E94D657A58BA8889C75BB81FA60EB11D604E0D2E` |

The separate semantic catalog digest is `7135e117adf31f172c1cbc0f4710374d4fd0891645e42a77eacdc69d6ce612c6`: SHA256 of canonical sorted Assessment rows. It is not the JSON file checksum. There are exactly 64 source-derived rows, no answers, identity/account information, or client-created assessments. Confirm checksums again at the reviewed commit; any changed bytes require an updated release packet.

## Mandatory hosted preflight before any migration

The existing Tokyo project and actual parent owner are already provisioned. M1 was applied through the dashboard without a CLI migration ledger (DEP_HOSTED_M1_PREPARATION_v2). Do not rerun M1, recreate accounts, reset/drop a database, rotate keys, or assume an empty schema. Keep existing Auth signup restrictions and M1 access settings.

1. Confirm the intended project identity using existing approved configuration. Inventory the existing migration ledger read-only. Record release SHA, UTC time and the reviewed M1 checksum above. Take the existing owner-controlled backup of owned rows and schema using the established procedure; keep private backups and credentials outside the repository and tool output.
2. Compare the actual M1 schema with the complete reviewed M1 SQL, including its final ALTER statements: tables/column types/nullability/defaults; unique/check/FK constraints and RESTRICT actions; indexes; RLS/no browser policies; private schema exposure; function bodies, SECURITY DEFINER/search_path and grants; current singleton family/owner binding and closed Auth configuration. Compare normalized `pg_get_functiondef` output with the reviewed source, not just table names or counts. Never output PIN verifiers, cache keys, receipt ciphertext, tokens, names or scores.
3. Read-only inventory queries suitable for a restricted local export include:

```sql
select n.nspname,c.relname,c.relrowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='private' and c.relkind='r' order by c.relname;
select conrelid::regclass,conname,pg_get_constraintdef(oid)
from pg_constraint where connamespace='private'::regnamespace order by 1,2;
select pg_get_functiondef('public.family_dispatch(text,jsonb,jsonb)'::regprocedure);
select has_function_privilege('anon','public.family_dispatch(text,jsonb,jsonb)','EXECUTE'),
       has_function_privilege('authenticated','public.family_dispatch(text,jsonb,jsonb)','EXECUTE');
```

Both browser function checks must be false. Include private helper definitions, table/column privileges and all M1 indexes/policies in the comparison. A mismatch stops deployment for a reviewed additive correction; do not conceal it with IF NOT EXISTS or an invented ledger entry.

4. Only after equivalence is recorded, Dep may use the installed Supabase CLI's migration-repair operation to mark version `202610230001` already applied to the verified linked project. Confirm its actual command/help and project before execution. Do not edit ledger tables manually or run the M1 creation migration. Inspect the pending migration list: only the exact reviewed M2 migration may be newly applied. Review any dry-run output before a later authorized push.
5. Alternatively, keep the existing dashboard workflow: apply only the reviewed M2 SQL as one complete transaction and record its checksum, timestamp, result and continued lack of CLI reconciliation. Do not subsequently run CLI db push until both applied migrations have been compared and correctly reconciled. Never retry a partly selected SQL-editor fragment; a transactional failure should leave the original M1 objects intact.

## Additive installation and release checks

The migration adds catalog, attempts, correction snapshots and per-child revision heads with restrictive FKs/RLS. It preserves the exact M1 dispatcher body by renaming/moving it to a private delegate; the new service-only public dispatcher routes M1 operations to that delegate. New internal scope/capability reads are service dispatch operations only, not HTTP endpoints or browser RPC grants. Same-transaction correction detection uses real PostgreSQL MVCC visibility plus in-progress xmin status, including PL/pgSQL exception subtransactions.

1. Apply the reviewed additive migration after preflight. Preserve every existing owner/profile/device/session/key/receipt row. Verify the 64 catalog rows against the frozen metadata artifact and all new constraints/triggers/indexes. Verify RLS and absence of anon/authenticated access to new tables/helpers/delegate; only the existing service RPC boundary is public-schema executable by service_role.
2. Deploy the reviewed complete Edge function dependency graph with existing secrets. Keep the existing `verify_jwt=false` setting because opaque child tokens are validated by the service; parent JWTs still require authoritative Auth getUser. No secret belongs in HTML or the catalog.
3. Before enabling any client, verify public health and authenticated child bootstrap/catalog compatibility: `assessment_history_v1`, `progress_summary_v1`, contract/catalog version 1, exact catalog digest and decimal-string child revision. Health checks the installed migration/catalog capability and never grants access. Incompatible deployments retain M1 health but return M2_UNAVAILABLE for new routes.
4. Using only a separately authorized synthetic operational profile/device, verify real ingest, same-ID retry after a lost acknowledgement, receipt expiry/removal without loss of permanent identity, conflict rejection, source expiry versus revocation, parent ownership, full-scope summaries and fixed-revision cursor paging. Confirm browser direct table/RPC denial. Do not modify the actual owner's learning history for these checks. M2 has no history purge operation; preserve synthetic accepted attempts or archive their clearly labeled test profile according to the existing owner procedure. Do not disable immutable triggers for cleanup.
5. Verify normal M1 login/profile/pair/unlock/lock behavior before publishing any client activation. The current source intentionally leaves statistics unavailable. A later reviewed activation must explicitly enable appropriate client gates, after backend checks and applicable Luna/Quinn gates; enabling reviewer FAMILY_ENABLED alone is insufficient. JPEG_ENABLED remains false until its separate implementation/review.

## Local reproducible evidence and limits

The owned existing QA stack runs on `127.0.0.1:54321/54322`, with real PostgreSQL 17/pgcrypto, Supabase Auth, PostgREST and Edge. No unknown service was stopped and no database/user was reset or truncated. Local credentials remain only under ignored `test-results/`.

```powershell
$env:FAMILY_REAL_STACK='1'
npx --yes deno test --config supabase/functions/family-api/deno.json --allow-read --allow-env --allow-sys --allow-net --allow-run --allow-write tests/family/m2_real_bridge_test.ts tests/family/m2_schema_test.ts
```

The real bridge suite requires the pre-existing owned QA family, real local stack/status and reviewed M2 schema. It refuses any non-QA Auth user and adds isolated synthetic rows rather than resetting previous rows. It creates synthetic confirmed Auth sessions through local admin-generated links without sending messages or changing passwords. It retains immutable synthetic history. The exact-migration test creates a separately named local PostgreSQL database and applies complete M1 then final M2 SQL; its minimal auth.users dependency is only for DDL verification. Actual Auth/service-boundary proof comes from the other suite. It also compares function bodies with the real integration database. No pgcrypto shim or PGlite success claim is used.

Browser integration:

```powershell
npx --yes deno run --allow-read --allow-net=127.0.0.1:8767,127.0.0.1:54321 tests/family/m2_bridge_server.ts
```

This dedicated server serves local build substitutions with a prominent synthetic/real-backend banner, leaves FAMILY_LOCAL_ADAPTER=null, and reads ignored synthetic credentials. Port 8766 was occupied by the earlier QA server, so port 8767 transparently relays requests to the actual loopback Edge/Auth endpoints with M1's existing allowed 8766 Origin. It does not mock repositories or responses. Separate direct-HTTP checks cover the real service boundary. Never publish this server, its local substitutions or credentials. Stop only the owned server process when review no longer needs it.

## Rollback that preserves owned work

Disable reviewed M2 client HISTORY/REPORT/JPEG gates and reviewer capture first; preserve M1 family access. If a backend rollback is needed, redeploy the compatible previous M1 Edge entry/dependencies to stop advertising/serving M2 while retaining the new schema/private delegate and all rows. The additive dispatcher continues supporting M1. Never rerun M1, drop M2 tables, rewrite baselines/corrections, purge attempts/outboxes, rotate cache keys, or delete the private delegate. Retain encrypted pending work for compatible retry. Reconcile ledger entries to actual applied schema, not desired UI availability. Recovery requires a reviewed additive fix and new tests, then backend-before-client release checks again.
