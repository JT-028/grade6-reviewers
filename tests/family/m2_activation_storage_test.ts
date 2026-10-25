import vm from "node:vm";
import { IDBFactory, IDBKeyRange } from "npm:fake-indexeddb@6.2.4";
import manifest from "../../supabase/functions/family-api/m2-catalog.json" with { type: "json" };

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const files = ["family.html", ...new Set(manifest.assessments.map(row => row.module_key + ".html"))];
const stores = ["credentials", "metadata", "outbox", "records", "reports"];
async function open(indexedDB: IDBFactory, version: number, upgrade?: (db: IDBDatabase) => void) {
  return await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("grade6-family-v1", version);
    request.onupgradeneeded = () => upgrade?.(request.result);
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
}
async function transport(file: string, indexedDB: IDBFactory) {
  const html = await Deno.readTextFile(file), notices: string[] = [];
  const session = { token: "b".repeat(64), cache_key: "ab".repeat(32), child: { id: "activation-child" }, child_session_id: crypto.randomUUID(), expires_at: new Date(Date.now() + 3600000).toISOString(), access_epoch: 0 };
  const context = vm.createContext({ crypto, indexedDB, IDBKeyRange, TextEncoder, TextDecoder, URLSearchParams, AbortController, Date, performance, setTimeout, clearTimeout, document: { hidden: false }, navigator: { onLine: true }, FAMILY_HISTORY_ENABLED: true,
    fetch: (url: string) => Promise.resolve(new Response(JSON.stringify({ api_version: 1, request_id: "activation-request", server_time: new Date().toISOString(), ...(url.endsWith("/child/bootstrap") ? { child: session.child, capabilities: ["assessment_history_v1", "progress_summary_v1"], contract_version: 1, catalog_version: 1, catalog_digest: manifest.catalog_digest } : manifest) }))) });
  vm.runInContext(html.slice(html.indexOf("// FAMILY_TRANSPORT_START"), html.indexOf("// FAMILY_TRANSPORT_END")) + ";globalThis.adapter=FAMILY_PRODUCTION_ADAPTER;", context);
  await context.adapter.flush(session, { current: () => true, lock: () => { throw new Error("Unexpected lock"); }, status: (message: string) => notices.push(message) });
  return notices;
}

Deno.test("M2 activation foreground sync initializes pristine storage in all nine actual transports", async () => {
  for (const file of files) {
    const indexedDB = new IDBFactory();
    assert((await indexedDB.databases()).length === 0, "Initially no database");
    const notices = await transport(file, indexedDB);
    const db = await open(indexedDB, 3);
    assert(JSON.stringify([...db.objectStoreNames]) === JSON.stringify(stores), file + " creates all five stores before metadata/outbox transaction");
    assert(notices.includes("No pending results on this device."), file + " completes real empty queue read");
    db.close();
  }
});

Deno.test("M2 activation upgrades v2 without changing existing encrypted work or credentials in all nine transports", async () => {
  for (const file of files) {
    const indexedDB = new IDBFactory(), sentinel = { schema_version: 1, iv: [7, 11], ciphertext: [19, 31, 47] };
    const previous = await open(indexedDB, 2, db => { for (const name of stores.filter(name => name !== "reports")) db.createObjectStore(name); });
    await new Promise<void>((resolve, reject) => {
      const tx = previous.transaction(["credentials", "records", "outbox"], "readwrite");
      for (const name of ["credentials", "records", "outbox"]) tx.objectStore(name).put(sentinel, ["foreign-child", "module", "attempt"]);
      tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error);
    }); previous.close();
    assert((await transport(file, indexedDB)).includes("No pending results on this device."), file + " selected-child scan finishes");
    const db = await open(indexedDB, 3);
    assert(JSON.stringify([...db.objectStoreNames]) === JSON.stringify(stores), file + " adds only missing reports");
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(["credentials", "records", "outbox"]);
      for (const name of ["credentials", "records", "outbox"]) {
        const request = tx.objectStore(name).get(["foreign-child", "module", "attempt"]);
        request.onsuccess = () => assert(JSON.stringify(request.result) === JSON.stringify(sentinel), file + " preserves " + name);
      }
      tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error);
    }); db.close();
  }
});

Deno.test("M2 activation blocked transport upgrade closes its late connection and permits later version change", async () => {
  for (const file of files) {
    const indexedDB = new IDBFactory(), held = await open(indexedDB, 2, db => { for (const name of stores.filter(name => name !== "reports")) db.createObjectStore(name); });
    let blocked!: () => void;
    const blockedEvent = new Promise<void>(resolve => blocked = resolve);
    const observed = new Proxy(indexedDB, { get(target, property) {
      if (property !== "open") { const value = Reflect.get(target, property); return typeof value === "function" ? value.bind(target) : value; }
      return (...args: Parameters<IDBFactory["open"]>) => {
        const request = target.open(...args); request.addEventListener("blocked", () => blocked()); return request;
      };
    } });
    const running = transport(file, observed);
    await blockedEvent;
    assert((await running).some(message => message.includes("not synced")), file + " fails closed while blocked");
    held.close();
    const next = await open(indexedDB, 4);
    assert(next.version === 4, file + " late successful v3 connection closed"); next.close();
  }
});
