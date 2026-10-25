import vm from "node:vm";
import { IDBFactory } from "npm:fake-indexeddb@6.2.4";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => resolve = done);
  return { promise, resolve };
}

function node() {
  return {
    hidden: true,
    value: "",
    textContent: "",
    children: [] as unknown[],
    disabled: false,
    classList: { toggle() {} },
    addEventListener() {},
    focus() {},
    querySelectorAll: () => [],
    hasAttribute: () => false,
    replaceChildren(...children: unknown[]) {
      this.children = children;
    },
    append(...children: unknown[]) {
      this.children.push(...children);
    },
  };
}

async function browser(
  fetcher: typeof fetch,
  configuration: "production" | "disabled" | "invalid" = "production",
) {
  const html = await Deno.readTextFile(new URL("../../family.html", import.meta.url));
  const source = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert(source, "The family page must have its production browser script");
  const nodes = new Map<string, ReturnType<typeof node>>();
  const privateButtons = [node(), node(), node()];
  const storage = new Map<string, string>();
  const context = vm.createContext({
    crypto,
    indexedDB: new IDBFactory(),
    TextEncoder,
    Date,
    URL,
    Promise,
    fetch: fetcher,
    AbortSignal: { timeout: () => undefined },
    setInterval() {},
    setTimeout() {},
    clearTimeout() {},
    window: { addEventListener() {} },
    location: { hash: "#q2" },
    sessionStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
    document: {
      getElementById(id: string) {
        if (!nodes.has(id)) nodes.set(id, node());
        return nodes.get(id);
      },
      createElement: node,
      createTextNode: (value: string) => value,
      addEventListener() {},
      querySelectorAll: (selector: string) => selector === "[data-private]" ? privateButtons : [],
    },
    Option: class {
      constructor(public text: string, public value: string) {}
    },
  });
  const configured = configuration === "disabled"
    ? source.replace("const FAMILY_ENABLED = true", "const FAMILY_ENABLED = false")
    : configuration === "invalid"
    ? source.replace(
      /const FAMILY_SUPABASE_URL = [^;]+;/,
      'const FAMILY_SUPABASE_URL = "http://untrusted.invalid";',
    )
    : source;
  const instrumented = configured.replace(
    "init().catch",
    `globalThis.familyTest = {
      init, request, loadFamily, acceptParent, signOut, lockChild, accessEpoch,
      parent: () => parent, child: () => child,
    }; Promise.resolve().catch`,
  );
  vm.runInContext(instrumented, context);
  const api = context.familyTest as {
    init(): Promise<void>;
    request(path: string, options?: Record<string, unknown>): Promise<Record<string, unknown>>;
    loadFamily(): Promise<void>;
    acceptParent(value: Record<string, unknown>): void;
    signOut(broadcast?: boolean): void;
    accessEpoch(advance?: boolean): Promise<number>;
    lockChild(broadcast?: boolean): void;
    parent(): unknown;
    child(): unknown;
  };
  assert(api, "Instrument the actual page functions without changing production exports");
  return { api, nodes, storage, privateButtons };
}

Deno.test("M1 production initialization enables access without sending anonymous private requests", async () => {
  let requests = 0;
  const page = await browser((() => {
    requests++;
    return Promise.reject(new Error("No network expected before sign-in or pairing"));
  }) as typeof fetch);
  await page.api.init();
  assert(page.nodes.get("setupNotice")?.hidden === true, "Ready configuration hides unavailable notice");
  assert(
    page.privateButtons.every((button) => !button.disabled),
    "Parent and child entry controls are enabled",
  );
  assert(requests === 0, "Anonymous initialization must not query private endpoints");
});

for (const configuration of ["disabled", "invalid"] as const) {
  Deno.test(`M1 ${configuration} configuration keeps access closed`, async () => {
    let requests = 0;
    const page = await browser((() => {
      requests++;
      return Promise.reject(new Error("No network expected"));
    }) as typeof fetch, configuration);
    await page.api.init();
    assert(
      page.nodes.get("setupNotice")?.hidden === false,
      "Unavailable configuration shows fallback notice",
    );
    assert(
      page.privateButtons.every((button) => button.disabled),
      "Unavailable configuration disables private entry",
    );
    await page.api.request("/parent/family").then(
      () => { throw new Error("Unavailable configuration must reject private requests"); },
      () => {},
    );
    assert(requests === 0, "Unavailable configuration cannot contact the backend");
  });
}

const parentSession = {
  access_token: "synthetic-parent",
  refresh_token: "synthetic-refresh",
  expires_in: 3600,
};
function response(value: Record<string, unknown>) {
  return new Response(JSON.stringify({ ...value, api_version: 1 }), {
    headers: { "Content-Type": "application/json" },
  });
}

Deno.test("a delayed family response cannot reopen a signed-out private panel", async () => {
  const started = deferred<void>();
  const pending = deferred<Response>();
  const page = await browser(
    (() => {
      started.resolve();
      return pending.promise;
    }) as typeof fetch,
  );
  page.api.acceptParent(parentSession);
  const loading = page.api.loadFamily().catch(() => {});
  await started.promise;
  page.api.signOut(false);
  pending.resolve(response({ children: [], devices: [] }));
  await loading;
  assert(page.nodes.get("parentPanel")?.hidden === true, "A lock must outlive an older response");
  assert(page.nodes.get("childList")?.children.length === 0, "Old private rows must stay cleared");
  assert(page.api.parent() === null, "Sign-out must remain authoritative");
});

Deno.test("a delayed refresh cannot recreate a signed-out parent session", async () => {
  const started = deferred<void>();
  const pending = deferred<Response>();
  const page = await browser(
    (() => {
      started.resolve();
      return pending.promise;
    }) as typeof fetch,
  );
  page.api.acceptParent({ ...parentSession, expires_in: 0 });
  const loading = page.api.loadFamily().catch(() => {});
  await started.promise;
  page.api.signOut(false);
  pending.resolve(response(parentSession));
  await loading;
  assert(page.api.parent() === null, "Old refresh credentials must not survive sign-out");
  assert(!page.storage.has("grade6-family-parent-v1"), "Do not persist a stale parent refresh");
});

Deno.test("retrying an unknown-outcome mutation reuses its original operation identity", async () => {
  const identities: string[] = [];
  const page = await browser(
    ((_input, init) => {
      identities.push(new Headers(init?.headers).get("Idempotency-Key") || "");
      if (identities.length === 1) return Promise.reject(new TypeError("Lost committed response"));
      return Promise.resolve(response({ child: { id: "synthetic-created-child" } }));
    }) as typeof fetch,
  );
  const body = { display_name: "Synthetic learner", pin: "123456" };
  await page.api.request("/parent/children", { method: "POST", token: "synthetic-parent", body })
    .catch(() => {});
  const result = await page.api.request("/parent/children", {
    method: "POST",
    token: "synthetic-parent",
    body,
  });
  assert(
    identities.length === 2 && identities[0] === identities[1],
    "Unknown results must reuse IDs",
  );
  assert(!!result.child, "The replayed result must reach the caller");
});

Deno.test("a delayed unlock cannot return private credentials after a profile lock", async () => {
  const started = deferred<void>();
  const pending = deferred<Response>();
  const page = await browser(
    (() => {
      started.resolve();
      return pending.promise;
    }) as typeof fetch,
  );
  let credentials: unknown;
  const unlocking = page.api.request("/child/unlock", {
    method: "POST",
    token: "a".repeat(64),
    body: { child_id: "synthetic-child", pin: "123456" },
  }).then((value) => credentials = value).catch(() => {});
  await started.promise;
  page.api.lockChild(false);
  pending.resolve(response({ child_session_token: "b".repeat(64), cache_key: "c".repeat(64) }));
  await unlocking;
  assert(
    credentials === undefined && page.api.child() === null,
    "An old unlock response must not reach the credential-persisting continuation",
  );
});

Deno.test("parent sign-out advances durable access epoch without a local child session", async () => {
  const page = await browser((() => Promise.reject(new Error("No network expected"))) as typeof fetch);
  page.api.acceptParent(parentSession);
  assert(await page.api.accessEpoch() === 0, "Fresh local scope starts at epoch zero");
  page.api.signOut();
  assert(await page.api.accessEpoch() === 1, "Parent lock invalidates reviewer clones even when its broadcast is missed");
});
