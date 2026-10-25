import vm from "node:vm";
import { IDBFactory, IDBKeyRange } from "npm:fake-indexeddb@6.2.4";
import manifest from "../../supabase/functions/family-api/m2-catalog.json" with { type: "json" };
import { createHandler } from "../../supabase/functions/family-api/index.ts";
import type { FamilyRepository } from "../../supabase/functions/family-api/auth.ts";

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const canonical = (value: any): string => Array.isArray(value) ? "[" + value.map(canonical).join(",") + "]" : value && typeof value === "object" ? "{" + Object.keys(value).sort().map(key => JSON.stringify(key) + ":" + canonical(value[key])).join(",") + "}" : JSON.stringify(value);
const assessment = manifest.assessments.find(row => row.kind === "exam")!;
const files = ["family.html", ...new Set(manifest.assessments.map(row => row.module_key + ".html"))];

async function harness(file: string, count: number, mode: string) {
  const indexedDB = new IDBFactory(), session = { token: "b".repeat(64), cache_key: "ac".repeat(32), child: { id: "queue-child", display_name: "QA" }, child_session_id: crypto.randomUUID(), expires_at: new Date(Date.now() + 3600000).toISOString(), access_epoch: 0 };
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const open = indexedDB.open("grade6-family-v1", 3);
    open.onupgradeneeded = () => { for (const name of ["records", "outbox", "metadata"]) open.result.createObjectStore(name); };
    open.onsuccess = () => resolve(open.result); open.onerror = () => reject(open.error);
  });
  const key = await crypto.subtle.importKey("raw", new Uint8Array(32).fill(0xac), "AES-GCM", false, ["encrypt", "decrypt"]);
  const entries: any[] = [];
  for (let index = 0; index < count + 1; index++) {
    const own = index < count, recordKey = [own ? session.child.id : "foreign-child", assessment.module_key, crypto.randomUUID()];
    const envelope = { client_version: 1, attempt: { id: recordKey[2], authorization_session_id: session.child_session_id, assessment_id: assessment.id, first_correct: 0, answered_count: assessment.total, total: assessment.total, finalized: true, completed_at: new Date().toISOString(), time_quality: "anchored", administered_fingerprint: "a".repeat(64) } };
    const encrypt = async (store: string, value: unknown) => {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      return { schema_version: 1, iv, ciphertext: await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: new TextEncoder().encode(canonical([store, ...recordKey, 1])) }, key, new TextEncoder().encode(canonical(value))) };
    };
    entries.push({ key: recordKey, own, record: await encrypt("records", { envelope, pending: true, provenance: "encrypted_cache" }), outbox: await encrypt("outbox", envelope) });
  }
  async function transaction(stores: string[], work: (tx: IDBTransaction) => void) {
    await new Promise<void>((resolve, reject) => { const tx = db.transaction(stores, "readwrite"); work(tx); tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(tx.error); });
  }
  await transaction(["records", "outbox"], tx => { for (const entry of entries) { tx.objectStore("records").put(entry.record, entry.key); tx.objectStore("outbox").put(entry.outbox, entry.key); } });
  async function read(store: string, entry: any) {
    return await new Promise<any>((resolve, reject) => { const tx = db.transaction(store), request = tx.objectStore(store).get(entry.key); tx.oncomplete = () => resolve(request.result); tx.onabort = () => reject(tx.error); });
  }
  const posts: string[] = [], notices: string[] = []; let locks = 0, active = 0, peak = 0;
  const response = (payload: any, status = 200) => new Response(JSON.stringify({ api_version: 1, request_id: "queue-request", server_time: new Date().toISOString(), ...payload }), { status });
  const context = vm.createContext({ crypto, indexedDB, IDBKeyRange, TextEncoder, TextDecoder, URLSearchParams, AbortController, Date, performance, setTimeout, clearTimeout, document: { hidden: false }, navigator: { onLine: true }, FAMILY_HISTORY_ENABLED: true,
    fetch: async (url: string, options: any) => {
      if (url.endsWith("/child/bootstrap")) return response({ child: session.child, capabilities: ["assessment_history_v1", "progress_summary_v1"], contract_version: 1, catalog_version: 1, catalog_digest: manifest.catalog_digest });
      if (url.endsWith("/child/catalog")) return response(manifest);
      assert(url.endsWith("/child/attempts"), "Only expected production routes");
      const envelope = JSON.parse(options.body); posts.push(envelope.attempt.id);
      assert(options.headers["Idempotency-Key"] === envelope.attempt.id, "Stable attempt delivery identity");
      active++; peak = Math.max(peak, active);
      if (mode === "epoch") await transaction(["metadata"], tx => tx.objectStore("metadata").put(1, "access_epoch"));
      await Promise.resolve(); active--;
      if (/^error-/.test(mode)) return response({ error: { code: "SYNTHETIC_ERROR", message: "QA response" } }, Number(mode.slice(6)));
      return response({ attempt_id: mode === "bad-ack" ? crypto.randomUUID() : envelope.attempt.id, status: "accepted", received_at: new Date().toISOString(), revision: String(posts.length), provenance: "server" }, 201);
    } });
  const html = await Deno.readTextFile(file);
  vm.runInContext(html.slice(html.indexOf("// FAMILY_TRANSPORT_START"), html.indexOf("// FAMILY_TRANSPORT_END")) + ";globalThis.adapter=FAMILY_PRODUCTION_ADAPTER;", context);
  await context.adapter.flush(session, { current: () => true, lock: () => locks++, status: (message: string) => notices.push(message) });
  const state = [];
  for (const entry of entries) {
    const record = await read("records", entry), outbox = await read("outbox", entry);
    const plaintext = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: record.iv, additionalData: new TextEncoder().encode(canonical(["records", ...entry.key, 1])) }, key, record.ciphertext)));
    const same = (a: any, b: any) => !!a && [...a.iv].join() === [...b.iv].join() && [...new Uint8Array(a.ciphertext)].join() === [...new Uint8Array(b.ciphertext)].join();
    state.push({ own: entry.own, pending: !!outbox, confirmed: plaintext.pending === false && plaintext.provenance === "server", exactRecord: same(record, entry.record), exactOutbox: same(outbox, entry.outbox) });
  }
  db.close(); return { posts, notices, locks, peak, state };
}

Deno.test("Quinn production queue serially confirms only 25 own-child results per foreground pass in all nine transports", async () => {
  for (const file of files) {
    const result = await harness(file, 26, "accepted");
    assert(result.posts.length === 25 && new Set(result.posts).size === 25 && result.peak === 1, file + " bounded serial stable delivery");
    assert(result.state.filter(row => row.own && row.confirmed && !row.pending).length === 25, file + " encrypted confirmation and outbox deletion agree");
    assert(result.state.filter(row => row.own && row.pending && row.exactRecord && row.exactOutbox).length === 1, file + " retains 26th result exactly");
    assert(result.state.filter(row => !row.own && row.pending && row.exactRecord && row.exactOutbox).length === 1, file + " never scans foreign child");
    assert(result.notices.some(text => text.includes("Sync remaining")) && result.locks === 0, file + " honest bounded resume notice");
  }
});

Deno.test("Quinn malformed acknowledgement and permanent 409/422 retain exact encrypted work without retry spin", async () => {
  for (const file of files) for (const mode of ["bad-ack", "error-409", "error-422"]) {
    const result = await harness(file, 1, mode);
    assert(result.posts.length === 1 && result.locks === 0, file + " no retry spin or authorization lock for " + mode);
    assert(result.state.every(row => row.pending && row.exactRecord && row.exactOutbox), file + " retains exact ciphertext for " + mode);
    if (mode !== "bad-ack") assert(result.notices.some(text => text.includes("needs attention")), file + " permanent failure explained");
  }
});

Deno.test("Quinn epoch advance during real transport acknowledgement aborts confirmation and retains ciphertext", async () => {
  for (const file of files) {
    const result = await harness(file, 1, "epoch");
    assert(result.posts.length === 1 && result.locks === 1, file + " epoch failure locks exactly once");
    assert(result.state.every(row => row.pending && row.exactRecord && row.exactOutbox), file + " epoch rejects acknowledgement atomically");
  }
});

Deno.test("Quinn transport access denial locks while ordinary server failure preserves authorization and ciphertext", async () => {
  for (const file of files) for (const status of [401, 403, 500]) {
    const result = await harness(file, 1, "error-" + status);
    assert(result.posts.length === 1 && result.locks === (status === 500 ? 0 : 1), file + " typed authorization boundary " + status);
    assert(result.state.every(row => row.pending && row.exactRecord && row.exactOutbox), file + " all failures retain ciphertext " + status);
  }
});

Deno.test("Quinn absent or incompatible installed catalog preserves M1 health while production M2 routes fail closed", async () => {
  for (const status of [null, {}, { contract_version: 2, catalog_count: 64, catalog_digest: manifest.catalog_digest }, { contract_version: 1, catalog_count: 63, catalog_digest: manifest.catalog_digest }, { contract_version: 1, catalog_count: 64, catalog_digest: "0".repeat(64) }]) {
    let privateCalls = 0;
    const repository: FamilyRepository = {
      verifyParent: async () => { throw new Error("Not a parent flow"); },
      dispatch: async operation => {
        if (operation !== "m2_capabilities") { privateCalls++; throw new Error("Incompatible M2 must not reach private reads"); }
        if (status === null) throw new Error("Migration unavailable");
        return status;
      },
    };
    const handler = createHandler(repository, { pinPepper: "a".repeat(64), claimKey: "b".repeat(64) });
    const request = (path: string) => handler(new Request("https://test.supabase.co/functions/v1/family-api/v1" + path, { headers: { origin: "http://127.0.0.1:8766", authorization: "Bearer " + "c".repeat(64) } }));
    const health = await request("/health"), value = await health.json();
    assert(health.status === 200 && JSON.stringify(value.capabilities) === '["family_access"]', "M1 health survives incompatible M2");
    const catalog = await request("/child/catalog"), failure = await catalog.json();
    assert(catalog.status === 503 && failure.error.code === "M2_UNAVAILABLE" && privateCalls === 0, "No M2 data or fixture fallback before compatibility");
  }
});
