import vm from "node:vm";
import { IDBFactory } from "npm:fake-indexeddb@6.2.4";
import manifest from "../../supabase/functions/family-api/m2-catalog.json" with { type: "json" };

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

Deno.test("M2 unsupported production catalog explains version failure and preserves pending ciphertext in all nine pages", async () => {
  const files = ["family.html", ...new Set(manifest.assessments.map(row => row.module_key + ".html"))];
  for (const file of files) {
    const html = await Deno.readTextFile(file);
    const block = html.slice(html.indexOf("// FAMILY_TRANSPORT_START"), html.indexOf("// FAMILY_TRANSPORT_END"));
    const indexedDB = new IDBFactory();
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open("grade6-family-v1", 3);
      open.onupgradeneeded = () => { for (const name of ["records", "outbox", "metadata"]) open.result.createObjectStore(name); };
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    const key = ["synthetic-child", "synthetic-module", "synthetic-attempt"];
    const ciphertext = { schema_version: 1, iv: new Uint8Array(12).fill(7), ciphertext: new Uint8Array([19, 31, 47]).buffer };
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(["records", "outbox"], "readwrite");
      for (const name of ["records", "outbox"]) tx.objectStore(name).put(ciphertext, key);
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
    const notices: string[] = [];
    let locks = 0, requests = 0;
    const session = { token: "b".repeat(64), child: { id: "synthetic-child" }, expires_at: new Date(Date.now() + 3600000).toISOString(), access_epoch: 0 };
    const context = vm.createContext({
      crypto, indexedDB, TextEncoder, TextDecoder, URLSearchParams, AbortController, Date, performance,
      setTimeout, clearTimeout, document: { hidden: false }, navigator: { onLine: true },
      FAMILY_HISTORY_ENABLED: true,
      fetch: async () => {
        requests++;
        return new Response(JSON.stringify({ api_version: 1, request_id: "synthetic-request", server_time: new Date().toISOString(), ...(requests === 1 ? { child: session.child } : { ...manifest, catalog_version: 2 }) }));
      },
    });
    vm.runInContext(block + ";globalThis.adapter = FAMILY_PRODUCTION_ADAPTER;", context);
    await context.adapter.flush(session, { current: () => true, lock: () => locks++, status: (message: string) => notices.push(message) });
    assert(requests === 2, file + " reached actual manifest validation");
    assert(notices.length === 1 && notices[0].includes("assessment version") && !notices[0].includes("Connect online"), file + " must explain unsupported assessment version");
    assert(locks === 0, file + " version failure retains current authorization");
    for (const name of ["records", "outbox"]) {
      const value = await new Promise<{ schema_version: number; iv: Uint8Array; ciphertext: ArrayBuffer }>((resolve, reject) => {
        const tx = database.transaction(name), read = tx.objectStore(name).get(key);
        tx.oncomplete = () => resolve(read.result);
        tx.onabort = () => reject(tx.error);
      });
      assert(value.schema_version === 1 && [...value.iv].join() === [...ciphertext.iv].join() && [...new Uint8Array(value.ciphertext)].join() === "19,31,47", file + " retains exact " + name + " ciphertext");
    }
    database.close();
  }
});
