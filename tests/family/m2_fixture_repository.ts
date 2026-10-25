import type { FamilyRepository } from "../../supabase/functions/family-api/auth.ts";
import { ApiError, UUID } from "../../supabase/functions/family-api/validation.ts";
import { canonicalJson, sha256 } from "../../supabase/functions/family-api/crypto.ts";
import { progressFromResults, resultOrder } from "../../supabase/functions/family-api/m2-progress.ts";
import {
  type Assessment,
  catalogEntries,
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
  display_name?: string;
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
    { envelope: Envelope; child_id: string; device_id: string; digest: string; received_at: string; revision: bigint }
  >();
  const receipts = new Map<string, { digest: string }>();
  const heads = new Map<string, bigint>();
  const cursors = new Map<string, { scope: string; revision: bigint; offset: number }>();
  const cursorKey = crypto.subtle.importKey("raw",crypto.getRandomValues(new Uint8Array(32)),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const catalogDigest = sha256(canonicalJson(catalogEntries(catalog)));
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
        const parentRead = operation === "parent_attempts" || operation === "parent_progress";
        const summary = operation === "child_progress" || operation === "parent_progress";
        if (!writing && operation !== "child_attempts" && !parentRead && !summary) denied();
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
            const revision = (heads.get(child.id) || 0n) + 1n;
            heads.set(child.id, revision);
            records.set(envelope.attempt.id, {
              envelope,
              child_id: child.id,
              device_id: principal.device_id!,
              digest,
              received_at,
              revision,
            });
          }
          const result = {
            attempt_id: envelope.attempt.id,
            status: existing ? "duplicate" : "accepted",
            received_at,
            provenance: "local_fixture",
            revision: (heads.get(child.id) || 0n).toString(),
          };
          receipts.set(receiptKey, { digest });
          return result;
        }
        const allowed = parentRead
          ? ["child_id", "quarter", ...(!summary ? ["subject", "kind", "assessment_id", "cursor", "limit"] : [])]
          : ["quarter", ...(!summary ? ["subject", "kind", "assessment_id", "cursor", "limit"] : [])];
        if (
          Object.keys(payload).some((key) => !allowed.includes(key)) ||
          ![1, 2].includes(payload.quarter as number) ||
          (payload.subject !== undefined &&
            !["history", "math", "geography", "language"].includes(String(payload.subject))) ||
          (payload.kind !== undefined && !["pop", "exam"].includes(String(payload.kind))) ||
          (payload.limit !== undefined && (!Number.isInteger(payload.limit) || Number(payload.limit) < 1 || Number(payload.limit) > 100))
        ) throw new ApiError(400, "INVALID_FILTER", "History filters are invalid.");
        if (
          payload.assessment_id !== undefined &&
          !catalog.some((row) =>
            row.id === payload.assessment_id && row.quarter === payload.quarter &&
            (!payload.kind || row.kind === payload.kind) &&
            (!payload.subject || row.subject === payload.subject)
          )
        ) throw new ApiError(400, "INVALID_FILTER", "History filters are invalid.");
        const scope = canonicalJson([principal.role, principal.family_id, child_id, payload.quarter, payload.subject || null, payload.kind || null, payload.assessment_id || null]);
        const cursor = payload.cursor === undefined ? null : cursors.get(String(payload.cursor));
        if (payload.cursor !== undefined && (!cursor || cursor.scope !== scope)) throw new ApiError(400, "INVALID_CURSOR", "History cursor unavailable.");
        const revision = cursor?.revision ?? heads.get(child.id) ?? 0n;
        const items = [...records.values()].filter((row) => row.child_id === child_id && row.revision <= revision).map((row) =>
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
        ).sort(resultOrder);
        if (summary) return progressFromResults({child:{id:child.id,display_name:child.display_name || "Synthetic child"},quarter:Number(payload.quarter),rows:items,revision:revision.toString(),catalog_digest:await catalogDigest,as_of:options.now(),provenance:"local_fixture"});
        const offset = cursor?.offset || 0, limit = Number(payload.limit || 25);
        const page = items.slice(offset, offset + limit);
        let next_cursor: string | null = null;
        if (offset + limit < items.length) {
          const scope_digest=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',await cursorKey,new TextEncoder().encode(scope))),byte=>byte.toString(16).padStart(2,'0')).join('');
          const last=page[page.length-1];
          next_cursor=btoa(canonicalJson({v:1,scope_digest,revision:revision.toString(),last:{completed_at:last.completed_at,time_quality:last.time_quality,received_at:last.received_at,id:last.id}})).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
          cursors.set(next_cursor, {scope,revision,offset:offset+limit});
        }
        return { items:page, next_cursor, revision:revision.toString(), provenance: "local_fixture", as_of: options.now() };
      };
      const pending = serial.then(run);
      serial = pending.then(() => undefined, () => undefined);
      return await pending;
    },
  };
}
