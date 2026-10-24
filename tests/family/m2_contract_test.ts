import { type FixturePrincipal, fixtureRepository } from "./m2_fixture_repository.ts";
import { inventory } from "./m2_catalog_inventory.ts";
import {
  type Assessment,
  type Envelope,
  type SourceSession,
  validateEnvelope,
} from "../../supabase/functions/family-api/m2-contract.ts";
import { ApiError } from "../../supabase/functions/family-api/validation.ts";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
async function rejects(run: () => unknown, code: string) {
  try {
    await run();
  } catch (error) {
    assert(error instanceof ApiError && error.code === code, `Expected ${code}, received ${error}`);
    return;
  }
  throw new Error(`Expected ${code}`);
}
const id = (group: number, value: number) =>
  `${group}0000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
const F = id(1, 1),
  G = id(1, 2),
  A = id(2, 1),
  B = id(2, 2),
  C = id(2, 3),
  D = id(4, 1),
  S = id(5, 1);
const now = "2026-10-24T03:00:00.000Z", expiry = "2026-10-24T08:00:00.000Z";
function source(child_id = A, sessionId = S): SourceSession {
  return {
    id: sessionId,
    child_id,
    device_id: D,
    issued_at: "2026-10-24T00:00:00.000Z",
    expires_at: expiry,
    revoked: false,
  };
}
async function fixture() {
  const catalog = await inventory();
  const testCatalog: Assessment[] = catalog.map((row) => ({
    ...row,
    id: row.id.replace(/r1$/, "r2"),
    content_revision: 2,
    total: row.kind === "pop" ? 10 : 70,
  }));
  const principals = new Map<string, FixturePrincipal>([
    ["A", {
      role: "child",
      family_id: F,
      child_id: A,
      device_id: D,
      session_id: S,
      expires_at: expiry,
      revoked: false,
    }],
    ["B", {
      role: "child",
      family_id: F,
      child_id: B,
      device_id: D,
      session_id: id(5, 2),
      expires_at: expiry,
      revoked: false,
    }],
    ["parentF", { role: "parent", family_id: F, expires_at: expiry, revoked: false }],
    ["device", { role: "device", family_id: F, device_id: D, expires_at: expiry, revoked: false }],
  ]);
  const sessions = [source(), source(B, id(5, 2)), source(A, id(5, 3))];
  const repository = fixtureRepository({
    catalog: [...catalog, ...testCatalog],
    principals,
    sessions,
    children: [
      { id: A, family_id: F, archived: false },
      { id: B, family_id: F, archived: false },
      { id: C, family_id: G, archived: false },
    ],
    now: () => now,
  });
  const make = (assessment = testCatalog[0], number = 1): Envelope => ({
    client_version: 1,
    attempt: {
      id: id(6, number),
      authorization_session_id: S,
      assessment_id: assessment.id,
      first_correct: 6,
      answered_count: assessment.total,
      total: assessment.total,
      finalized: true,
      completed_at: "2026-10-24T01:00:00.000Z",
      time_quality: "anchored",
      administered_fingerprint: "1".repeat(64),
    },
  });
  const write = (payload: Envelope, receipt = crypto.randomUUID(), principal = "A") =>
    repository.dispatch(
      "child_attempt_record",
      { token_hash: principal, idempotency_key: receipt },
      payload as unknown as Record<string, unknown>,
    );
  const read = (principal = "A", filters: Record<string, unknown> = { quarter: 1 }) =>
    repository.dispatch("child_attempts", { token_hash: principal }, filters);
  return { catalog, testCatalog, principals, sessions, repository, make, write, read };
}

Deno.test("M2-A 64 frozen catalogs match actual eight source inventories and inline rows", async () => {
  const rows = await inventory();
  const frozen = JSON.parse(
    await Deno.readTextFile(new URL("fixtures/m2-results.json", import.meta.url)),
  );
  assert(rows.length === 64, "Exactly eight sets per module");
  for (const expected of frozen.inventory) {
    const moduleRows = rows.filter((row) => row.module_key === expected.module_key);
    assert(moduleRows.length === 8, "Eight actual set identities");
    for (const row of moduleRows) {
      assert(
        row.total === expected[`${row.kind}_total`] &&
          row.catalog_digest === expected[`${row.kind}_digest`] &&
          row.source_pool_count === expected[`${row.kind}_pool`],
        "Frozen reviewed pool inventory changed; increment revision before publication",
      );
    }
    const html = await Deno.readTextFile(
      new URL(`../../${expected.module_key}.html`, import.meta.url),
    );
    const inline = JSON.parse(html.match(/const FAMILY_CATALOG = (\[.*\]);/)![1]);
    assert(
      JSON.stringify(inline) === JSON.stringify(moduleRows),
      "Inline catalog must match reviewed inventory",
    );
    assert(
      html.includes("const FAMILY_ENABLED = false;") &&
        html.includes("const FAMILY_LOCAL_ADAPTER = null;"),
      "Public capture disabled",
    );
  }
});
Deno.test("M2-A baseline, correction, distinct retakes, permanent duplicate and concurrent delivery", async () => {
  const f = await fixture();
  const first = f.make();
  first.correction = { final_correct: 10, captured_at: first.attempt.completed_at! };
  const [accepted, duplicate] = await Promise.all([f.write(first), f.write(first)]);
  assert(
    accepted.status === "accepted" && duplicate.status === "duplicate",
    "Concurrent same-ID inserts once",
  );
  const retake = f.make(undefined, 2);
  retake.attempt.first_correct = 8;
  retake.attempt.completed_at = "2026-10-24T02:00:00.000Z";
  await f.write(retake);
  f.principals.get("A")!.session_id = id(5, 3);
  assert(
    (await f.write(first)).status === "duplicate",
    "Fresh authorized session and receipt preserve permanent identity",
  );
  const items = (await f.read()).items as any[];
  assert(
    items.length === 2 && items[0].first_correct === 6 && items[0].percentage === 60 &&
      items[0].grade.letter === "DNME" && items[0].correction.final_correct === 10 &&
      items[1].first_correct === 8 && items[1].grade.letter === "S",
    "Exact baseline and correction oracle",
  );
  items[0].first_correct = 10;
  assert(
    ((await f.read()).items as any[])[0].first_correct === 6,
    "Returned DTO cannot mutate stored baseline",
  );
});
Deno.test("M2-A conflicting fields/receipt cannot rewrite accepted immutable result", async () => {
  const f = await fixture();
  const original = f.make();
  original.correction = { final_correct: 10, captured_at: original.attempt.completed_at! };
  const receipt = crypto.randomUUID();
  await f.write(original, receipt);
  for (
    const change of [
      (e: Envelope) => {
        e.attempt.first_correct = 7;
      },
      (e: Envelope) => {
        e.attempt.completed_at = "2026-10-24T02:00:00.000Z";
      },
      (e: Envelope) => {
        e.attempt.assessment_id = f.testCatalog[1].id;
      },
      (e: Envelope) => {
        e.correction!.final_correct = 9;
      },
    ]
  ) {
    const altered = structuredClone(original);
    change(altered);
    await rejects(() => f.write(altered), "ATTEMPT_CONFLICT");
  }
  const conflict = structuredClone(original);
  conflict.attempt.first_correct = 7;
  await rejects(() => f.write(conflict, receipt), "IDEMPOTENCY_CONFLICT");
  assert(
    ((await f.read()).items as any[])[0].first_correct === 6,
    "Conflict preserves accepted score",
  );
});
Deno.test("M2-A validates finalized zero exams, raw percentages and all source paths", async () => {
  const f = await fixture();
  let number = 10;
  for (const assessment of f.catalog) {
    const envelope = f.make(assessment, number++);
    envelope.attempt.first_correct = assessment.kind === "pop" ? 12 : 0;
    envelope.attempt.answered_count = assessment.kind === "pop" ? 20 : 0;
    assert(
      (await f.write(envelope)).status === "accepted",
      "Each actual set accepts its exact total",
    );
  }
  const zero = ((await f.read("A", { quarter: 1, kind: "exam" })).items as any[])[0];
  assert(zero.percentage === 0 && zero.grade.letter === "DNME", "Finalized zero valid");
  const exam = f.make(f.testCatalog.find((row) => row.kind === "exam"), 100);
  exam.attempt.first_correct = 53;
  await f.write(exam);
  const result = ((await f.read()).items as any[]).find((row) => row.id === exam.attempt.id);
  assert(
    result.percentage === 75.71 && result.grade.rounded_pct === 76 && result.grade.letter === "FS",
    "Raw fraction and existing rounded descriptor",
  );
});
Deno.test("M2-A malformed, abandoned, out-of-range results and unsupported revisions rejected", async () => {
  const f = await fixture();
  for (
    const altered of [
      { first_correct: -1 },
      { first_correct: 1.5 },
      { first_correct: NaN },
      { first_correct: Infinity },
      { first_correct: 11 },
      { total: 0 },
      { answered_count: 9 },
      { finalized: false },
      { first_correct: "6" },
    ]
  ) {
    const envelope = f.make();
    Object.assign(envelope.attempt, altered);
    await rejects(() => f.write(envelope), "INVALID_RESULT");
  }
  const missing = f.make();
  delete (missing.attempt as any).total;
  await rejects(() => f.write(missing), "INVALID_RESULT");
  const forged = f.make();
  (forged as any).child_id = B;
  await rejects(() => f.write(forged), "INVALID_RESULT");
  const revision = f.make();
  revision.attempt.assessment_id = revision.attempt.assessment_id.replace(/r2$/, "r99");
  await rejects(() => f.write(revision), "UNSUPPORTED_REVISION");
  revision.attempt.assessment_id = "unpublished";
  await rejects(() => f.write(revision), "ASSESSMENT_NOT_FOUND");
  assert(((await f.read()).items as any[]).length === 0, "Rejected-only dataset empty");
});
Deno.test("M2-A authorization precedes reads/replays; source session and parent ownership enforced", async () => {
  const f = await fixture();
  const original = f.make();
  await f.write(original);
  await rejects(() => f.write(original, undefined, "B"), "ACCESS_CHANGED");
  await rejects(() => f.write(original, undefined, "parentF"), "ACCESS_CHANGED");
  await rejects(() => f.read("device"), "ACCESS_CHANGED");
  await rejects(() => f.read("A", { quarter: 1, child_id: B }), "INVALID_FILTER");
  assert(
    ((await f.repository.dispatch("parent_attempts", { owner_id: "parentF" }, {
      child_id: A,
      quarter: 1,
    })).items as any[]).length === 1,
    "Parent owns selected A",
  );
  assert(
    ((await f.repository.dispatch("parent_attempts", { owner_id: "parentF" }, {
      child_id: B,
      quarter: 1,
    })).items as any[]).length === 0,
    "No sibling mixing",
  );
  await rejects(
    () =>
      f.repository.dispatch("parent_attempts", { owner_id: "parentF" }, {
        child_id: C,
        quarter: 1,
      }),
    "PROFILE_NOT_FOUND",
  );
  f.principals.get("A")!.revoked = true;
  await rejects(() => f.write(original), "ACCESS_CHANGED");
  await rejects(() => f.read(), "ACCESS_CHANGED");
  f.principals.get("A")!.revoked = false;
  f.sessions[0].revoked = true;
  await rejects(() => f.write(original), "ACCESS_CHANGED");
});
Deno.test("M2-A chronology validates source window/future dates; unknown chronology retained honestly", async () => {
  const f = await fixture();
  for (
    const date of [
      "2026-10-23T23:00:00.000Z",
      "2026-10-24T03:03:00.000Z",
      "2026-02-30T01:00:00.000Z",
    ]
  ) {
    const envelope = f.make();
    envelope.attempt.completed_at = date;
    await rejects(() => f.write(envelope), "INVALID_TIME");
  }
  const unknown = f.make();
  unknown.attempt.completed_at = null;
  unknown.attempt.time_quality = "unknown";
  await f.write(unknown);
  assert(
    ((await f.read()).items as any[])[0].time_quality === "unknown",
    "Unknown retained, no invented date",
  );
  const invalid = f.make();
  invalid.attempt.completed_at = null;
  await rejects(() => validateEnvelope(invalid, f.testCatalog, source(), now), "INVALID_TIME");
});

Deno.test("M2-A chronology quality requires a primitive enum value", async () => {
  const f = await fixture();
  for (const quality of [["anchored"], ["unknown"], { toString: () => "anchored" }]) {
    const malformed = f.make();
    Object.assign(malformed.attempt, { time_quality: quality, completed_at: "2020-01-01T00:00:00.000Z" });
    await rejects(() => validateEnvelope(malformed, f.testCatalog, source(), now), "INVALID_TIME");
  }
});
