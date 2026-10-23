import { bearer, FamilyRepository, supabaseRepository } from "./auth.ts";
import {
  approvalCode,
  canonicalJson,
  constantTimeEqual,
  hashPin,
  mutationDigest,
  randomHex,
  sha256,
} from "./crypto.ts";
import { ApiError, fields, HEX_256, ids, jsonBody, pin, text, uuid } from "./validation.ts";

const ALLOWED_ORIGINS = new Set(["https://jt-028.github.io", "http://127.0.0.1:8766"]);
const BASE_PATH = "/family-api/v1";
export interface FamilyConfig {
  pinPepper: string;
  claimKey: string;
}
type Route = {
  operation: string;
  auth: "public" | "parent" | "device" | "child" | "poll";
  id?: string;
};

function route(method: string, path: string): Route {
  const direct: Record<string, Route> = {
    "GET /health": { operation: "health", auth: "public" },
    "POST /pair-requests": { operation: "pair_create", auth: "public" },
    "GET /parent/family": { operation: "parent_family", auth: "parent" },
    "POST /parent/children": { operation: "parent_child_create", auth: "parent" },
    "POST /parent/pair-approvals": { operation: "parent_pair_approve", auth: "parent" },
    "GET /device/children": { operation: "device_children", auth: "device" },
    "POST /child/unlock": { operation: "unlock_finish", auth: "device" },
    "POST /child/lock": { operation: "child_lock", auth: "child" },
    "GET /child/bootstrap": { operation: "child_bootstrap", auth: "child" },
  };
  if (direct[`${method} ${path}`]) return direct[`${method} ${path}`];
  let match = /^\/pair-requests\/([^/]+)\/claim$/.exec(path);
  if (method === "POST" && match) {
    return { operation: "pair_claim", auth: "poll", id: uuid(match[1]) };
  }
  match = /^\/parent\/children\/([^/]+)$/.exec(path);
  if (method === "PATCH" && match) {
    return { operation: "parent_child_update", auth: "parent", id: uuid(match[1]) };
  }
  match = /^\/parent\/devices\/([^/]+)$/.exec(path);
  if (method === "PATCH" && match) {
    return { operation: "parent_device_update", auth: "parent", id: uuid(match[1]) };
  }
  throw new ApiError(404, "NOT_FOUND", "This endpoint is not available.");
}

export function createHandler(repository: FamilyRepository, config: FamilyConfig) {
  return async (request: Request): Promise<Response> => {
    const requestId = crypto.randomUUID();
    const origin = request.headers.get("origin");
    const headers = new Headers({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Vary": "Origin",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    });
    const respond = (value: Record<string, unknown>, status = 200) =>
      new Response(
        JSON.stringify({
          ...value,
          api_version: 1,
          server_time: new Date().toISOString(),
          request_id: requestId,
        }),
        { status, headers },
      );
    try {
      if (origin && !ALLOWED_ORIGINS.has(origin)) {
        throw new ApiError(
          403,
          "ORIGIN_NOT_ALLOWED",
          "This site is not allowed to use family access.",
        );
      }
      if (origin) headers.set("Access-Control-Allow-Origin", origin);
      if (request.method === "OPTIONS") {
        headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
        headers.set(
          "Access-Control-Allow-Headers",
          "authorization, apikey, content-type, idempotency-key",
        );
        headers.set("Access-Control-Max-Age", "600");
        return new Response(null, { status: 204, headers });
      }
      const url = new URL(request.url);
      const marker = url.pathname.indexOf(BASE_PATH);
      if (marker < 0 || url.search) {
        throw new ApiError(404, "NOT_FOUND", "This endpoint is not available.");
      }
      const endpoint = route(request.method, url.pathname.slice(marker + BASE_PATH.length));
      if (endpoint.operation === "health") {
        return respond({ status: "ok", min_client_version: 1, capabilities: ["family_access"] });
      }
      if (!/^[a-f0-9]{64,}$/i.test(config.pinPepper) || !HEX_256.test(config.claimKey)) {
        throw new ApiError(503, "SERVER_CONFIGURATION", "Family access is not configured yet.");
      }
      const mutation = request.method !== "GET";
      const body = mutation ? await jsonBody(request) : {};
      const context: Record<string, unknown> = { receipt_key: config.claimKey };
      if (mutation) {
        context.idempotency_key = uuid(request.headers.get("idempotency-key"), "Mutation ID");
        context.payload_digest = await mutationDigest(
          `${endpoint.operation}:${endpoint.id || ""}:${canonicalJson(body)}`,
          config.pinPepper,
        );
      }
      if (endpoint.auth === "parent") {
        context.owner_id = await repository.verifyParent(bearer(request));
      } else if (endpoint.auth === "device" || endpoint.auth === "child") {
        context.token_hash = await sha256(bearer(request, true));
      } else if (endpoint.auth === "poll") context.poll_hash = await sha256(bearer(request, true));
      let payload: Record<string, unknown> = {};
      if (endpoint.operation === "pair_create") {
        fields(body, ["request_id", "poll_hash", "device_label"], [
          "request_id",
          "poll_hash",
          "device_label",
        ]);
        if (typeof body.poll_hash !== "string" || !HEX_256.test(body.poll_hash)) {
          throw new ApiError(400, "INVALID_FIELD", "The pairing secret is invalid.");
        }
        const code = approvalCode();
        payload = {
          request_id: uuid(body.request_id),
          poll_hash: body.poll_hash,
          device_label: text(body.device_label, "Device label", 1, 60),
          approval_code: code,
          code_hash: await sha256(code),
        };
        context.ip_hash = await sha256(
          `${config.pinPepper}:${
            (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim()
          }`,
        );
      } else if (endpoint.operation === "pair_claim") {
        fields(body, []);
        payload = { request_id: endpoint.id };
      } else if (
        endpoint.operation === "parent_child_create" || endpoint.operation === "parent_child_update"
      ) {
        const creating = endpoint.operation === "parent_child_create";
        fields(
          body,
          ["display_name", "pin", ...(!creating ? ["archived"] : [])],
          creating ? ["display_name", "pin"] : [],
        );
        if (!creating && !Object.keys(body).length) {
          throw new ApiError(400, "INVALID_FIELDS", "Choose a profile change.");
        }
        payload.child_id = creating ? crypto.randomUUID() : endpoint.id;
        if ("display_name" in body) {
          payload.display_name = text(body.display_name, "Display name", 1, 40);
        }
        if ("archived" in body) {
          if (typeof body.archived !== "boolean") {
            throw new ApiError(400, "INVALID_FIELD", "Archived must be true or false.");
          }
          payload.archived = body.archived;
        }
        if ("pin" in body) {
          payload.pin_salt = randomHex(16);
          payload.pin_hash = await hashPin(
            pin(body.pin),
            payload.pin_salt as string,
            config.pinPepper,
          );
        }
      } else if (endpoint.operation === "parent_pair_approve") {
        fields(body, ["approval_code", "child_ids", "replace_device_id"], [
          "approval_code",
          "child_ids",
        ]);
        const code = text(body.approval_code, "Pairing code", 16, 20).replace(/[- ]/g, "")
          .toUpperCase();
        if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{16}$/.test(code)) {
          throw new ApiError(400, "INVALID_CODE", "Use the complete 16-character pairing code.");
        }
        const token = randomHex(32);
        payload = {
          code_hash: await sha256(code),
          child_ids: ids(body.child_ids),
          device_id: crypto.randomUUID(),
          device_token: token,
          token_hash: await sha256(token),
        };
        if ("replace_device_id" in body) payload.replace_device_id = uuid(body.replace_device_id);
      } else if (endpoint.operation === "parent_device_update") {
        fields(body, ["revoked", "child_ids"]);
        if (Object.keys(body).length !== 1) {
          throw new ApiError(400, "INVALID_FIELDS", "Choose one device change.");
        }
        payload.device_id = endpoint.id;
        if ("revoked" in body) {
          if (body.revoked !== true) {
            throw new ApiError(400, "INVALID_FIELD", "Use pairing to reapprove a device.");
          }
          payload.revoked = true;
        } else payload.child_ids = ids(body.child_ids);
      } else if (endpoint.operation === "unlock_finish") {
        fields(body, ["child_id", "pin"], ["child_id", "pin"]);
        const childId = uuid(body.child_id);
        const childPin = pin(body.pin);
        const prepared = await repository.dispatch("unlock_prepare", context, {
          child_id: childId,
        });
        if (prepared.replayed) return respond(prepared.replayed as Record<string, unknown>);
        if (
          typeof prepared.pin_salt !== "string" || typeof prepared.pin_hash !== "string" ||
          !HEX_256.test(prepared.pin_hash)
        ) throw new ApiError(503, "SERVICE_UNAVAILABLE", "Family access is unavailable.", true);
        const actual = await hashPin(childPin, prepared.pin_salt, config.pinPepper);
        const token = randomHex(32);
        payload = {
          child_id: childId,
          pin_matches: constantTimeEqual(actual, prepared.pin_hash),
          pin_version: prepared.pin_version,
          device_generation: prepared.device_generation,
          child_session_id: crypto.randomUUID(),
          child_session_token: token,
          token_hash: await sha256(token),
        };
      } else if (mutation) fields(body, []);
      const result = await repository.dispatch(endpoint.operation, context, payload);
      return respond(
        result,
        endpoint.operation === "pair_create" || endpoint.operation === "parent_child_create"
          ? 201
          : 200,
      );
    } catch (error) {
      const failure = error instanceof ApiError ? error : new ApiError(
        503,
        "SERVICE_UNAVAILABLE",
        "Family access is temporarily unavailable.",
        true,
      );
      if (failure.retryAfter) headers.set("Retry-After", String(failure.retryAfter));
      return respond({
        error: { code: failure.code, message: failure.message, retryable: failure.retryable },
      }, failure.status);
    }
  };
}

if (import.meta.main) {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const config = {
    pinPepper: Deno.env.get("FAMILY_PIN_PEPPER") || "",
    claimKey: Deno.env.get("PAIR_CLAIM_KEY") || "",
  };
  if (!url || !serviceKey) {
    Deno.serve(() =>
      new Response(
        JSON.stringify({
          error: {
            code: "SERVER_CONFIGURATION",
            message: "Family access is not configured.",
            retryable: false,
          },
          api_version: 1,
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        },
      )
    );
  } else Deno.serve(createHandler(supabaseRepository(url, serviceKey), config));
}
