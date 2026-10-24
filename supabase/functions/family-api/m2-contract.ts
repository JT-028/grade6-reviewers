import { ApiError, HEX_256, UUID } from "./validation.ts";

export interface Assessment {
  id: string;
  module_key: string;
  subject: string;
  quarter: number;
  kind: string;
  set_key: string;
  content_revision: number;
  catalog_digest: string;
  total: number;
  grade_policy: string;
  label: string;
  retired: boolean;
}
export interface SourceSession {
  id: string;
  child_id: string;
  device_id: string;
  issued_at: string;
  expires_at: string;
  revoked: boolean;
}
export interface Attempt {
  id: string;
  authorization_session_id: string;
  assessment_id: string;
  first_correct: number;
  answered_count: number;
  total: number;
  finalized: true;
  completed_at: string | null;
  time_quality: "anchored" | "client_unverified" | "unknown";
  administered_fingerprint: string;
}
export interface Envelope {
  client_version: 1;
  attempt: Attempt;
  correction?: { final_correct: number; captured_at: string };
}
export function invalidResult(): never {
  throw new ApiError(422, "INVALID_RESULT", "This finalized result is invalid.");
}
function exact(value: unknown, names: string[], required = names): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalidResult();
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).some((key) => !names.includes(key)) ||
    required.some((key) => !(key in record))
  ) invalidResult();
  return record;
}
export function utc(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}
export function validateCatalog(rows: Assessment[]): void {
  const ids = new Set<string>();
  const tuples = new Set<string>();
  for (const row of rows) {
    const match = /^(History|Math|Geography|Language)6_(Q2_)?Review_Module_v1\.0\.0$/.exec(
      row.module_key,
    );
    const tuple = [row.module_key, row.kind, row.set_key, row.content_revision].join(":");
    if (
      !match || match[1].toLowerCase() !== row.subject || (match[2] ? 2 : 1) !== row.quarter ||
      !["pop", "exam"].includes(row.kind) || !Number.isInteger(row.content_revision) ||
      row.content_revision < 1 ||
      !Number.isInteger(row.total) || row.total < 1 || row.total > 100 ||
      !HEX_256.test(row.catalog_digest) ||
      row.grade_policy !== "deped-descriptor-rounded-v1" || !row.id || row.id.length > 160 ||
      !row.label || row.label.length > 120 || ids.has(row.id) || tuples.has(tuple) ||
      !(row.kind === "exam"
        ? /^exam-[12]$/.test(row.set_key)
        : /^(flashcards|biomes|diagrams|tutor|cheat|practice)$/.test(row.set_key))
    ) {
      throw new Error("Invalid reviewed assessment catalog");
    }
    ids.add(row.id);
    tuples.add(tuple);
  }
}
export function validateEnvelope(
  value: unknown,
  catalog: readonly Assessment[],
  source: SourceSession,
  now: string,
): Envelope {
  const envelope = exact(value, ["client_version", "attempt", "correction"], [
    "client_version",
    "attempt",
  ]);
  const attempt = exact(envelope.attempt, [
    "id",
    "authorization_session_id",
    "assessment_id",
    "first_correct",
    "answered_count",
    "total",
    "finalized",
    "completed_at",
    "time_quality",
    "administered_fingerprint",
  ]);
  if (
    envelope.client_version !== 1 || typeof attempt.id !== "string" || !UUID.test(attempt.id) ||
    typeof attempt.authorization_session_id !== "string" ||
    !UUID.test(attempt.authorization_session_id)
  ) invalidResult();
  if (attempt.authorization_session_id.toLowerCase() !== source.id || source.revoked) {
    throw new ApiError(403, "ACCESS_CHANGED", "The originating authorization is unavailable.");
  }
  const assessment = catalog.find((row) => row.id === attempt.assessment_id);
  if (!assessment) {
    const known = typeof attempt.assessment_id === "string" &&
      catalog.some((row) =>
        attempt.assessment_id!.toString().startsWith(
          `${row.module_key}:${row.kind}:${row.set_key}:r`,
        )
      );
    throw new ApiError(
      known ? 422 : 404,
      known ? "UNSUPPORTED_REVISION" : "ASSESSMENT_NOT_FOUND",
      "Assessment version unavailable.",
    );
  }
  if (
    ![attempt.first_correct, attempt.answered_count, attempt.total].every((score) =>
      typeof score === "number" && Number.isInteger(score)
    ) ||
    (attempt.first_correct as number) < 0 ||
    (attempt.first_correct as number) > (attempt.answered_count as number) ||
    (attempt.answered_count as number) > (attempt.total as number) ||
    attempt.total !== assessment.total ||
    attempt.finalized !== true ||
    (assessment.kind === "pop" && attempt.answered_count !== attempt.total) ||
    typeof attempt.administered_fingerprint !== "string" ||
    !HEX_256.test(attempt.administered_fingerprint)
  ) invalidResult();
  if (
    typeof attempt.time_quality !== "string" ||
    !["anchored", "client_unverified", "unknown"].includes(attempt.time_quality) ||
    (attempt.completed_at === null
      ? attempt.time_quality !== "unknown"
      : !utc(attempt.completed_at)) ||
    (typeof attempt.completed_at === "string" &&
      Date.parse(attempt.completed_at) > Date.parse(now) + 120000) ||
    (attempt.time_quality === "anchored" &&
      (Date.parse(String(attempt.completed_at)) < Date.parse(source.issued_at) ||
        Date.parse(String(attempt.completed_at)) > Date.parse(source.expires_at)))
  ) {
    throw new ApiError(422, "INVALID_TIME", "Completion chronology is invalid.");
  }
  if (envelope.correction !== undefined) {
    const correction = exact(envelope.correction, ["final_correct", "captured_at"]);
    if (
      assessment.kind !== "pop" || !Number.isInteger(correction.final_correct) ||
      (correction.final_correct as number) < (attempt.first_correct as number) ||
      (correction.final_correct as number) > assessment.total || !utc(correction.captured_at) ||
      Date.parse(correction.captured_at) > Date.parse(now) + 120000
    ) invalidResult();
  }
  const normalized = structuredClone(envelope) as unknown as Envelope;
  normalized.attempt.id = normalized.attempt.id.toLowerCase();
  normalized.attempt.authorization_session_id = normalized.attempt.authorization_session_id
    .toLowerCase();
  normalized.attempt.administered_fingerprint = normalized.attempt.administered_fingerprint
    .toLowerCase();
  return normalized;
}

export function resultGrade(correct: number, total: number) {
  const rounded_pct = Math.round(100 * correct / total);
  const [letter, name] = rounded_pct >= 90
    ? ["O", "Outstanding"]
    : rounded_pct >= 85
    ? ["VS", "Very Satisfactory"]
    : rounded_pct >= 80
    ? ["S", "Satisfactory"]
    : rounded_pct >= 75
    ? ["FS", "Fairly Satisfactory"]
    : ["DNME", "Did Not Meet Expectations"];
  return { rounded_pct, letter, name };
}

export function resultDTO(
  envelope: Envelope,
  assessment: Assessment,
  child_id: string,
  received_at: string,
) {
  const attempt = envelope.attempt;
  const {
    id,
    module_key,
    subject,
    quarter,
    kind,
    set_key,
    content_revision,
    label,
    retired,
    grade_policy,
  } = assessment;
  return {
    id: attempt.id,
    child_id,
    assessment: {
      id,
      module_key,
      subject,
      quarter,
      kind,
      set_key,
      content_revision,
      label,
      retired,
      grade_policy,
    },
    first_correct: attempt.first_correct,
    total: attempt.total,
    answered_count: attempt.answered_count,
    completed_at: attempt.completed_at,
    time_quality: attempt.time_quality,
    administered_fingerprint: attempt.administered_fingerprint,
    received_at,
    percentage: Number((100 * attempt.first_correct / attempt.total).toFixed(2)),
    grade: resultGrade(attempt.first_correct, attempt.total),
    correction: envelope.correction ? { ...envelope.correction, total: attempt.total } : null,
  };
}
