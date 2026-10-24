import { inventory } from "./m2_catalog_inventory.ts";
import { ApiError, fields, jsonBody } from "../../supabase/functions/family-api/validation.ts";

export async function m2BrowserFixture() {
  const catalog = await inventory();
  const issued_at = new Date(Date.now() - 60000).toISOString();
  const expires_at = new Date(Date.now() + 8 * 3600000).toISOString();
  const source = {
    id: "50000000-0000-4000-8000-000000000001",
    child_id: "20000000-0000-4000-8000-000000000001",
    device_id: "40000000-0000-4000-8000-000000000001",
    issued_at,
    expires_at,
    revoked: false,
  };
  const session = {
    token: "b".repeat(64),
    cache_key: "c".repeat(64),
    child: { id: source.child_id, display_name: "Synthetic A" },
    child_session_id: source.id,
    expires_at,
  };
  const json = (value: unknown, status = 200) =>
    Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
  return async (request: Request): Promise<Response | null> => {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/__m2/") && !url.pathname.startsWith("/__family_m2_fixture__/")) {
      return null;
    }
    if (url.hostname !== "127.0.0.1" || url.search) {
      return json({ error: "Local fixture only" }, 404);
    }
    if (url.pathname.startsWith("/__m2/")) {
      try {
        if (
          request.method !== "POST" ||
          request.headers.get("authorization") !== `Bearer ${session.token}` ||
          Date.now() >= Date.parse(expires_at)
        ) throw new ApiError(401, "UNLOCK_REQUIRED", "Local fixture access unavailable.");
        const body = await jsonBody(request);
        if (url.pathname === "/__m2/authorize") {
          fields(body, ["assessment_id", "session_id"], ["assessment_id", "session_id"]);
          const assessment = catalog.find((row) => row.id === body.assessment_id);
          if (!assessment || body.session_id !== source.id) {
            throw new ApiError(403, "ACCESS_CHANGED", "Local fixture access unavailable.");
          }
          return json({
            catalog_version: 1,
            catalog_digest: assessment.catalog_digest,
            server_time: new Date().toISOString(),
          });
        }
        return json({ error: "Unknown local fixture operation" }, 404);
      } catch (error) {
        return json({
          error: {
            code: error instanceof ApiError ? error.code : "INVALID_BODY",
            message: "Local fixture request rejected.",
          },
        }, error instanceof ApiError ? error.status : 400);
      }
    }
    const filename = url.pathname.slice("/__family_m2_fixture__/".length);
    if (!catalog.some((row) => filename === row.module_key + ".html")) {
      return json({ error: "Unknown reviewer fixture" }, 404);
    }
    let html = await Deno.readTextFile(new URL(`../../${filename}`, import.meta.url));
    const adapter = `Object.freeze({
      async authorize(session, assessment) {
        const mono = performance.now();
        const response = await fetch('/__m2/authorize', {method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.token},body:JSON.stringify({assessment_id:assessment.id,session_id:session.child_session_id}),signal:AbortSignal.timeout(10000)});
        const value = await response.json();
        if (!response.ok || value.catalog_version !== 1 || !/^[a-f0-9]{64}$/.test(value.catalog_digest) || !Number.isFinite(Date.parse(value.server_time))) throw new Error('Fixture authorization unavailable');
        return {...value,clock:{server_epoch:Date.parse(value.server_time),monotonic_at:performance.now(),wall_at:Date.now(),round_trip_ms:performance.now()-mono}};
      }
    })`;
    const boot = `<script>
      const fixtureGuestStorage=new Map();
      Object.defineProperty(window,'localStorage',{value:{getItem:key=>fixtureGuestStorage.get(key)||null,setItem:(key,value)=>fixtureGuestStorage.set(key,String(value)),removeItem:key=>fixtureGuestStorage.delete(key),clear:()=>fixtureGuestStorage.clear(),key:index=>[...fixtureGuestStorage.keys()][index]||null,get length(){return fixtureGuestStorage.size;}}});
      (async()=>{
        const session=${JSON.stringify(session)};
        const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('grade6-family-v1',2);request.onupgradeneeded=()=>{for(const store of ['credentials','records','outbox','metadata'])if(!request.result.objectStoreNames.contains(store))request.result.createObjectStore(store);};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
        session.access_epoch=await new Promise(resolve=>{const tx=db.transaction('metadata','readonly');const request=tx.objectStore('metadata').get('access_epoch');tx.oncomplete=()=>{db.close();resolve(request.result||0);};});
        sessionStorage.setItem('grade6-family-child-v1',JSON.stringify(session));
        document.getElementById('m2FixtureBanner').textContent='Local demonstration · Synthetic A · Results stay encrypted on this device, not synced';
      })().catch(()=>{document.getElementById('m2FixtureBanner').textContent='Local fixture storage unavailable — reload to retry';});
    </script>`;
    html = html.replace("const FAMILY_ENABLED = false;", "const FAMILY_ENABLED = true;")
      .replace("const FAMILY_LOCAL_ADAPTER = null;", `const FAMILY_LOCAL_ADAPTER = ${adapter};`)
      .replace(
        "<body>",
        '<body><aside id="m2FixtureBanner" role="status" style="padding:12px;text-align:center;background:#fff4d4">Initializing local demonstration</aside>' +
          boot,
      );
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  };
}
