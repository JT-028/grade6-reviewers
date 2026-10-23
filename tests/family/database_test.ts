/** Real embedded PostgreSQL/PLpgSQL tests; pgcrypto is explicitly shimmed here only.
 * PGlite has no pgcrypto. These tests DO NOT verify encryption or hosted Supabase.
 * The deployable migration is read unchanged; only its extension CREATE is omitted.
 */
import { PGlite } from "npm:@electric-sql/pglite@0.5.11";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
const owner = "10000000-0000-4000-8000-000000000001";
const other = "10000000-0000-4000-8000-000000000002";
const child = "20000000-0000-4000-8000-000000000001";
const sibling = "20000000-0000-4000-8000-000000000002";
const requestId = "30000000-0000-4000-8000-000000000001";
const deviceId = "40000000-0000-4000-8000-000000000001";
const sessionId = "50000000-0000-4000-8000-000000000001";
const deviceHash = "a".repeat(64), childHash = "b".repeat(64), pollHash = "c".repeat(64);
const key = "d".repeat(64);

Deno.test("M1 embedded PostgreSQL: migration, RLS, pairing, scoped sessions, revocation and replay", async (test) => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create schema auth; create table auth.users(id uuid primary key);
      create schema extensions;
      create function extensions.gen_random_uuid() returns uuid language sql as 'select pg_catalog.gen_random_uuid()';
      create function extensions.gen_random_bytes(integer) returns bytea language sql as 'select decode(left(repeat(replace(pg_catalog.gen_random_uuid()::text, ''-'', ''''), 10), $1*2), ''hex'')';
      create function extensions.pgp_sym_encrypt(text,text,text) returns bytea language sql as 'select convert_to($1,''utf8'')';
      create function extensions.pgp_sym_decrypt(bytea,text) returns text language sql as 'select convert_from($1,''utf8'')';
      create function extensions.digest(text,text) returns bytea language sql as 'select decode($1,''hex'')';`);
    const migration = await Deno.readTextFile(
      new URL("../../supabase/migrations/202610230001_family_access.sql", import.meta.url),
    );
    await db.exec(
      migration.replace(
        "create extension if not exists pgcrypto with schema extensions;",
        "-- TEST ONLY: pgcrypto shims installed above",
      ),
    );
    await db.query("insert into auth.users values($1),($2)", [owner, other]);
    await db.query("insert into private.families(owner_auth_id) values($1)", [owner]);
    const parent = { owner_id: owner };
    const dev = { token_hash: deviceHash };
    async function dispatch(
      operation: string,
      context: Record<string, unknown>,
      payload: Record<string, unknown> = {},
      mutation = crypto.randomUUID(),
      payloadDigest = "same",
    ) {
      const result = await db.query<{ result: Record<string, unknown> }>(
        "select public.family_dispatch($1,$2::jsonb,$3::jsonb) as result",
        [
          operation,
          JSON.stringify({
            ...context,
            receipt_key: key,
            idempotency_key: mutation,
            payload_digest: payloadDigest,
          }),
          JSON.stringify(payload),
        ],
      );
      return result.rows[0].result;
    }
    await test.step("direct anon/authenticated tables and RPC are denied", async () => {
      for (const role of ["anon", "authenticated"]) {
        await db.exec(`set role ${role}`);
        let tableDenied = false, rpcDenied = false;
        try {
          await db.query("select * from private.children");
        } catch {
          tableDenied = true;
        }
        try {
          await db.query("select public.family_dispatch('parent_family','{}','{}')");
        } catch {
          rpcDenied = true;
        }
        await db.exec("reset role");
        assert(tableDenied && rpcDenied, `${role} must not read private tables or call dispatcher`);
      }
    });
    await test.step("unprovisioned auth user has no family access", async () => {
      const response = await dispatch("parent_family", { owner_id: other });
      assert(
        response.code === "PARENT_NOT_PROVISIONED",
        "Auth account must not imply family ownership",
      );
    });
    await test.step("parent creates profiles; replay creates exactly once and conflicts reject", async () => {
      const mutation = crypto.randomUUID();
      const payload = {
        child_id: child,
        display_name: "Learner",
        pin_salt: "11".repeat(16),
        pin_hash: "22".repeat(32),
      };
      const first = await dispatch("parent_child_create", parent, payload, mutation);
      const replay = await dispatch("parent_child_create", parent, payload, mutation);
      assert(
        JSON.stringify(first) === JSON.stringify(replay),
        "Replay must return original mutation",
      );
      assert(
        (await dispatch("parent_child_create", parent, payload, mutation, "different")).code ===
          "IDEMPOTENCY_CONFLICT",
        "Conflicting payload must fail",
      );
      await dispatch("parent_child_create", parent, {
        ...payload,
        child_id: sibling,
        display_name: "Sibling",
      });
      const roster = await dispatch("parent_family", parent);
      assert(
        (roster.children as unknown[]).length === 2 && !JSON.stringify(roster).includes("pin_hash"),
        "Roster excludes PIN hashes",
      );
    });
    await test.step("pair/claim only exposes approved profiles, and claim retries reuse token", async () => {
      const pairing = await dispatch("pair_create", { ip_hash: "fixture" }, {
        request_id: requestId,
        poll_hash: pollHash,
        code_hash: "33".repeat(32),
        approval_code: "ABCDABCDABCDABCD",
        device_label: "Test tablet",
      });
      assert(pairing.request_id === requestId, "Pair created");
      assert(
        (await dispatch("pair_claim", { poll_hash: "00".repeat(32) }, { request_id: requestId }))
          .status === 401,
        "Poll secret required",
      );
      assert(
        (await dispatch("pair_claim", { poll_hash: pollHash }, { request_id: requestId }))
          .status === "pending",
        "Unapproved pair stays pending",
      );
      await dispatch("parent_pair_approve", parent, {
        code_hash: "33".repeat(32),
        child_ids: [child],
        device_id: deviceId,
        device_token: deviceHash,
        token_hash: deviceHash,
      });
      const claimId = crypto.randomUUID();
      const first = await dispatch(
        "pair_claim",
        { poll_hash: pollHash },
        { request_id: requestId },
        claimId,
      );
      const replay = await dispatch("pair_claim", { poll_hash: pollHash }, {
        request_id: requestId,
      }, claimId);
      assert(
        first.device_token === deviceHash && JSON.stringify(first) === JSON.stringify(replay),
        "Claim survives lost response",
      );
      const approved = await dispatch("device_children", dev);
      assert(
        (approved.children as { id: string }[]).length === 1 &&
          (approved.children as { id: string }[])[0].id === child,
        "Do not expose sibling roster",
      );
      assert(
        !("xp" in approved) && !("goal" in approved),
        "Device token never exposes study records",
      );
    });
    await test.step("child unlock scopes cache/session; unknown profile and device-as-child fail", async () => {
      assert(
        (await dispatch("unlock_prepare", dev, { child_id: sibling })).code ===
          "INVALID_PROFILE_PIN",
        "Wrong child must be rejected",
      );
      assert(
        (await dispatch("child_bootstrap", dev)).status === 401,
        "Device token cannot read child bootstrap",
      );
      const mutation = crypto.randomUUID();
      const prepared = await dispatch("unlock_prepare", dev, { child_id: child }, mutation);
      assert(prepared.pin_version === 1, "Prepare scoped PIN check");
      const unlocked = await dispatch("unlock_finish", dev, {
        child_id: child,
        pin_matches: true,
        pin_version: 1,
        device_generation: 1,
        child_session_id: sessionId,
        child_session_token: childHash,
        token_hash: childHash,
      }, mutation);
      assert(
        typeof unlocked.cache_key === "string" && (unlocked.cache_key as string).length === 64,
        "Authorized unlock returns child/device key",
      );
      const bootstrap = await dispatch("child_bootstrap", { token_hash: childHash });
      assert((bootstrap.child as { id: string }).id === child, "Session accesses only its child");
      const replay = await dispatch("unlock_prepare", dev, { child_id: child }, mutation);
      assert(!!replay.replayed, "Unlock replay must not create another session");
      await dispatch("parent_child_update", parent, {
        child_id: child,
        pin_salt: "44".repeat(16),
        pin_hash: "55".repeat(32),
      });
      assert(
        (await dispatch("child_bootstrap", { token_hash: childHash })).status === 401,
        "PIN change revokes existing session",
      );
      assert(
        (await dispatch("unlock_prepare", dev, { child_id: child }, mutation)).status === 401,
        "Old successful receipt cannot bypass PIN change",
      );
    });
    await test.step("PIN reservation bounds failed attempts before derivation", async () => {
      for (let attempt = 0; attempt < 5; attempt++) {
        const prepared = await dispatch("unlock_prepare", dev, { child_id: child });
        assert(!prepared._error, "First five attempts may derive PIN");
        assert(
          (await dispatch("unlock_finish", dev, { child_id: child, pin_matches: false })).status ===
            401,
          "Incorrect PIN must fail",
        );
      }
      assert(
        (await dispatch("unlock_prepare", dev, { child_id: child })).status === 429,
        "Sixth attempt must be throttled",
      );
    });
    await test.step("revoked device loses roster/unlock access without deleting child cache key", async () => {
      await dispatch("parent_device_update", parent, { device_id: deviceId, revoked: true });
      assert(
        (await dispatch("device_children", dev)).status === 403,
        "Revocation enforced server-side",
      );
      assert(
        (await dispatch("unlock_prepare", dev, { child_id: child })).status === 403,
        "Revoked device cannot unlock",
      );
      const keyCount = await db.query<{ count: number }>(
        "select count(*)::int as count from private.device_children where device_id=$1",
        [deviceId],
      );
      assert(keyCount.rows[0].count === 1, "Keep key for future explicitly authorized recovery");
    });
    await test.step("expired pairing metadata is pruned without removing family records", async () => {
      await db.query("update private.pair_requests set expires_at=now()-interval '1 minute'");
      const expired = await dispatch("pair_claim", { poll_hash: pollHash }, {
        request_id: requestId,
      });
      assert(
        expired.status === 410,
        "Recently expired pairing requests keep their expiry response",
      );
      await db.query("update private.pair_requests set expires_at=now()-interval '2 days'");
      await dispatch("parent_family", parent);
      const state = await db.query<{ pairs: number; children: number }>(
        "select (select count(*)::int from private.pair_requests) as pairs, " +
          "(select count(*)::int from private.children) as children",
      );
      assert(
        state.rows[0].pairs === 0 && state.rows[0].children === 2,
        "Prune expired public pairing records while retaining the family's profiles",
      );
    });
  } finally {
    await db.close();
  }
});
