import type { FamilyRepository } from "../../supabase/functions/family-api/auth.ts";
import { ApiError, UUID } from "../../supabase/functions/family-api/validation.ts";
import { canonicalJson, sha256 } from "../../supabase/functions/family-api/crypto.ts";
import {
  type Assessment,
  type Envelope,
  resultDTO,
  type SourceSession,
  validateCatalog,
  validateEnvelope,
} from "../../supabase/functions/family-api/m2-contract.ts";

export interface FixturePrincipal {
  role: "child" | "parent" | "device";
  family_id: string;
  child_id?: string;
  device_id?: string;
  session_id?: string;
  expires_at: string;
  revoked: boolean;
}
export interface FixtureChild {
  id: string;
  family_id: string;
  archived: boolean;
}

export function fixtureRepository(options: {
  catalog: Assessment[];
  principals: Map<string, FixturePrincipal>;
  sessions: SourceSession[];
  children: FixtureChild[];
  now: () => string;
}): FamilyRepository {
  const catalog = structuredClone(options.catalog);
  validateCatalog(catalog);
  const records = new Map<
    string,
    { envelope: Envelope; child_id: string; device_id: string; digest: string; received_at: string }
  >();
  const receipts = new Map<string, { digest: string }>();
  let serial = Promise.resolve();
  function denied(): never {
    throw new ApiError(403, "ACCESS_CHANGED", "Unlock your authorized profile again.");
  }
  return {
    async verifyParent(token) {
      const principal = options.principals.get(token);
      if (
        !principal || principal.role !== "parent" || principal.revoked ||
        Date.parse(principal.expires_at) <= Date.parse(options.now())
      ) denied();
      return token;
    },
    async dispatch(operation, context, payload) {
      const run = async (): Promise<Record<string, unknown>> => {
        const principal = options.principals.get(
          String(context.token_hash || context.owner_id || ""),
        );
        if (
          !principal || principal.revoked ||
          Date.parse(principal.expires_at) <= Date.parse(options.now())
        ) denied();
        const writing = operation === "child_attempt_record";
        const parentRead = operation === "parent_attempts";
        if (!writing && operation !== "child_attempts" && !parentRead) denied();
        if (parentRead ? principal.role !== "parent" : principal.role !== "child") denied();
        const child_id = parentRead ? String(payload.child_id) : principal.child_id;
        const child = options.children.find((row) =>
          row.id === child_id && row.family_id === principal.family_id && !row.archived
        );
        if (!child) throw new ApiError(404, "PROFILE_NOT_FOUND", "Profile unavailable.");
        if (!parentRead) {
          const current = options.sessions.find((session) =>
            session.id === principal.session_id && session.child_id === child_id &&
            session.device_id === principal.device_id && !session.revoked
          );
          if (!current || Date.parse(current.expires_at) <= Date.parse(options.now())) denied();
        }
        if (writing) {
          if (typeof context.idempotency_key !== "string" || !UUID.test(context.idempotency_key)) {
            throw new ApiError(400, "INVALID_ID", "Mutation ID is invalid.");
          }
          const attempt = payload.attempt as Record<string, unknown> | undefined;
          const source = options.sessions.find((session) =>
            session.id === String(attempt?.authorization_session_id).toLowerCase() &&
            session.child_id === child_id && session.device_id === principal.device_id &&
            !session.revoked
          );
          if (!source) denied();
          const envelope = validateEnvelope(payload, catalog, source, options.now());
          const digest = await sha256(canonicalJson(envelope));
          const receiptKey = `${principal.device_id}:${child_id}:${context.idempotency_key}`;
          const receipt = receipts.get(receiptKey);
          if (receipt && receipt.digest !== digest) {
            throw new ApiError(
              409,
              "IDEMPOTENCY_CONFLICT",
              "Delivery conflicts with an earlier request.",
            );
          }
          const existing = records.get(envelope.attempt.id);
          if (
            existing &&
            (existing.child_id !== child_id || existing.device_id !== principal.device_id)
          ) denied();
          if (existing && existing.digest !== digest) {
            throw new ApiError(409, "ATTEMPT_CONFLICT", "The recorded result cannot be changed.");
          }
          const received_at = existing?.received_at || options.now();
          if (!existing) {
            records.set(envelope.attempt.id, {
              envelope,
              child_id: child.id,
              device_id: principal.device_id!,
              digest,
              received_at,
            });
          }
          const result = {
            attempt_id: envelope.attempt.id,
            status: existing ? "duplicate" : "accepted",
            received_at,
            provenance: "local_fixture",
          };
          receipts.set(receiptKey, { digest });
          return result;
        }
        const allowed = parentRead
          ? ["child_id", "quarter", "subject", "kind", "assessment_id"]
          : ["quarter", "subject", "kind", "assessment_id"];
        if (
          Object.keys(payload).some((key) => !allowed.includes(key)) ||
          ![1, 2].includes(payload.quarter as number) ||
          (payload.subject !== undefined &&
            !["history", "math", "geography", "language"].includes(String(payload.subject))) ||
          (payload.kind !== undefined && !["pop", "exam"].includes(String(payload.kind)))
        ) throw new ApiError(400, "INVALID_FILTER", "History filters are invalid.");
        if (
          payload.assessment_id !== undefined &&
          !catalog.some((row) =>
            row.id === payload.assessment_id && row.quarter === payload.quarter &&
            (!payload.kind || row.kind === payload.kind) &&
            (!payload.subject || row.subject === payload.subject)
          )
        ) throw new ApiError(400, "INVALID_FILTER", "History filters are invalid.");
        const items = [...records.values()].filter((row) => row.child_id === child_id).map((row) =>
          resultDTO(
            row.envelope,
            catalog.find((assessment) => assessment.id === row.envelope.attempt.assessment_id)!,
            row.child_id,
            row.received_at,
          )
        ).filter((row) =>
          row.assessment.quarter === payload.quarter &&
          (!payload.subject || row.assessment.subject === payload.subject) &&
          (!payload.kind || row.assessment.kind === payload.kind) &&
          (!payload.assessment_id || row.assessment.id === payload.assessment_id)
        );
        return { items, next_cursor: null, provenance: "local_fixture", as_of: options.now() };
      };
      const pending = serial.then(run);
      serial = pending.then(() => undefined, () => undefined);
      return await pending;
    },
  };
}
