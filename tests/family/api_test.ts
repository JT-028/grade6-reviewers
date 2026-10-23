import { createHandler } from "../../supabase/functions/family-api/index.ts";
import { FamilyRepository } from "../../supabase/functions/family-api/auth.ts";
import { ApiError } from "../../supabase/functions/family-api/validation.ts";
import {
  canonicalJson,
  constantTimeEqual,
  hashPin,
  randomHex,
  sha256,
} from "../../supabase/functions/family-api/crypto.ts";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
const owner = "10000000-0000-4000-8000-000000000001";
const child = "20000000-0000-4000-8000-000000000001";
const opaque = "a".repeat(64);
const config = { pinPepper: "b".repeat(64), claimKey: "c".repeat(64) };
type Call = {
  operation: string;
  context: Record<string, unknown>;
  payload: Record<string, unknown>;
};
function fixture() {
  const calls: Call[] = [];
  const repository: FamilyRepository = {
    verifyParent: async (token) => {
      if (token !== "verified-parent") {
        throw new ApiError(401, "PARENT_SIGN_IN_REQUIRED", "Sign in again.");
      }
      return owner;
    },
    dispatch: async (operation, context, payload) => {
      calls.push({ operation, context, payload });
      return { child: { id: child, display_name: "Learner" }, children: [], devices: [] };
    },
  };
  const handler = createHandler(repository, config);
  function request(
    path: string,
    method = "GET",
    body?: unknown,
    token?: string,
    extra: Record<string, string> = {},
  ) {
    const headers: Record<string, string> = {
      origin: "http://127.0.0.1:8766",
      "content-type": "application/json",
      "idempotency-key": crypto.randomUUID(),
      ...extra,
    };
    if (token) headers.authorization = "Bearer " + token;
    return handler(
      new Request("https://test.supabase.co/functions/v1/family-api/v1" + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
  }
  return { calls, repository, request };
}

Deno.test("private parent route rejects unsigned or missing user identity before touching data", async () => {
  const test = fixture();
  for (const token of [undefined, "eyJhbGciOiJub25lIn0.fake.", opaque]) {
    const response = await test.request("/parent/family", "GET", undefined, token);
    assert(response.status === 401, "Unverified identity must be rejected");
  }
  assert(test.calls.length === 0, "Unauthorized callers must never reach the DB dispatcher");
});

Deno.test("parent identity comes only from verified auth, and caller-supplied role is rejected", async () => {
  const test = fixture();
  assert(
    (await test.request("/parent/children", "POST", {
      display_name: "Learner",
      pin: "123456",
      family_id: owner,
    }, "verified-parent")).status === 400,
    "Reject supplied ownership",
  );
  const response = await test.request("/parent/children", "POST", {
    display_name: "Learner",
    pin: "123456",
  }, "verified-parent");
  assert(response.status === 201, "Provisioned parent create should succeed");
  const call = test.calls[0];
  assert(call.context.owner_id === owner, "Use verified owner UID");
  assert(!("pin" in call.payload), "Never send plaintext PIN to database");
  assert(
    typeof call.payload.pin_hash === "string" && call.payload.pin_hash.length === 64,
    "Derive full PIN hash",
  );
});

Deno.test("JWT-shaped parent token cannot masquerade as child/device token", async () => {
  const test = fixture();
  for (const path of ["/device/children", "/child/bootstrap"]) {
    const response = await test.request(path, "GET", undefined, "verified-parent");
    assert(response.status === 401, "Opaque credential must be required");
  }
  assert(test.calls.length === 0, "Do not infer child from parent role");
});

Deno.test("stored mutation fingerprints are keyed and do not become fast PIN verifiers", async () => {
  const test = fixture();
  const body = { display_name: "Learner", pin: "123456" };
  const result = await test.request("/parent/children", "POST", body, "verified-parent");
  assert(result.status === 201, "The legitimate create request must succeed");
  const publicDigest = await sha256(`parent_child_create::${canonicalJson(body)}`);
  assert(
    test.calls[0].context.payload_digest !== publicDigest,
    "Do not persist an unkeyed PIN oracle",
  );
  const other = fixture();
  const differentHandler = createHandler(other.repository, {
    ...config,
    pinPepper: "d".repeat(64),
  });
  await differentHandler(
    new Request("https://test.supabase.co/family-api/v1/parent/children", {
      method: "POST",
      headers: {
        authorization: "Bearer verified-parent",
        "content-type": "application/json",
        "idempotency-key": crypto.randomUUID(),
      },
      body: JSON.stringify(body),
    }),
  );
  assert(
    other.calls[0].context.payload_digest !== test.calls[0].context.payload_digest,
    "The backend secret must determine the persisted mutation digest",
  );
});

Deno.test("device bootstrap exposes only named profiles through device operation", async () => {
  const test = fixture();
  assert(
    (await test.request("/device/children", "GET", undefined, opaque)).status === 200,
    "Device roster should be available",
  );
  assert(
    test.calls[0].operation === "device_children",
    "Never call a progress endpoint with a device credential",
  );
  assert(
    test.calls[0].context.token_hash !== opaque,
    "Raw opaque tokens must not reach token lookup",
  );
});

Deno.test("PIN cooldown occurs before expensive derivation and session issuance", async () => {
  const test = fixture();
  test.repository.dispatch = async (operation) => {
    assert(operation === "unlock_prepare", "Do not finish a throttled unlock");
    throw new ApiError(429, "PIN_RATE_LIMIT", "Wait.", true, 900);
  };
  const response = await test.request(
    "/child/unlock",
    "POST",
    { child_id: child, pin: "123456" },
    opaque,
  );
  assert(
    response.status === 429 && response.headers.get("retry-after") === "900",
    "Expose cooldown correctly",
  );
});

Deno.test("unlock lost-response replay does not hash PIN again or create another session", async () => {
  const test = fixture();
  test.repository.dispatch = async (operation) => {
    assert(operation === "unlock_prepare", "Replay should return immediately");
    return { replayed: { child_session_token: opaque, child } };
  };
  const response = await test.request(
    "/child/unlock",
    "POST",
    { child_id: child, pin: "123456" },
    opaque,
  );
  assert(
    response.status === 200 && (await response.json()).child_session_token === opaque,
    "Return durable original session",
  );
});

Deno.test("CORS is restricted but never used as identity", async () => {
  const test = fixture();
  assert(
    (await test.request("/health", "GET", undefined, undefined, {
      origin: "https://attacker.invalid",
    })).status === 403,
    "Disallow foreign origin",
  );
  assert(
    (await test.request("/parent/family")).status === 401,
    "Allowed origin still requires auth",
  );
  const response = await test.request("/health");
  assert(response.headers.get("cache-control") === "no-store", "Never cache private responses");
  assert(
    response.headers.get("access-control-allow-origin") === "http://127.0.0.1:8766",
    "Reflect only approved origin",
  );
});

Deno.test("mutations require UUID idempotency and reject oversized/unknown bodies", async () => {
  const test = fixture();
  assert(
    (await test.request("/pair-requests", "POST", {}, undefined, { "idempotency-key": "bad" }))
      .status === 400,
    "Mutation ID required",
  );
  assert(
    (await test.request("/pair-requests", "POST", {
      request_id: child,
      poll_hash: opaque,
      device_label: "x".repeat(9000),
    })).status === 413,
    "Bound body size before parsing",
  );
  assert(test.calls.length === 0, "Invalid bodies never mutate database");
});

Deno.test("unexpected provider failures never expose internals", async () => {
  const test = fixture();
  test.repository.dispatch = async () => {
    throw new Error("service-role-secret-and-PIN");
  };
  const response = await test.request("/parent/family", "GET", undefined, "verified-parent");
  assert(
    response.status === 503 && !(await response.text()).includes("service-role-secret"),
    "Sanitize provider failure",
  );
});

Deno.test("PIN derivation uses salt/pepper and constant-time comparison handles unequal lengths", async () => {
  const salt = randomHex(16);
  const first = await hashPin("123456", salt, config.pinPepper);
  const second = await hashPin("123456", salt, config.pinPepper);
  const different = await hashPin("123456", salt, "d".repeat(64));
  assert(
    first === second && first !== different,
    "Salt/pepper derivation must be deterministic and scoped",
  );
  assert(
    constantTimeEqual(first, second) && !constantTimeEqual(first, first.slice(1)),
    "Compare full derived hashes",
  );
  assert(
    canonicalJson({ z: 1, a: [2, 3] }) === canonicalJson({ a: [2, 3], z: 1 }),
    "Mutation digests ignore key insertion order",
  );
});
