import { inventory } from "./m2_catalog_inventory.ts";
import { ApiError, fields, jsonBody } from "../../supabase/functions/family-api/validation.ts";
import { fixtureRepository } from "./m2_fixture_repository.ts";
import { canonicalJson, sha256 } from "../../supabase/functions/family-api/crypto.ts";
import { catalogEntries } from "../../supabase/functions/family-api/m2-contract.ts";

export async function m2BrowserFixture() {
  const catalog = await inventory();
  const issued_at = new Date(Date.now() - 2 * 3600000).toISOString();
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
  const catalogDigest = await sha256(canonicalJson(catalogEntries(catalog)));
  const principals = new Map([
    [session.token,{role:'child' as const,family_id:'10000000-0000-4000-8000-000000000001',child_id:source.child_id,device_id:source.device_id,session_id:source.id,expires_at,revoked:false}],
    ['fixture-parent',{role:'parent' as const,family_id:'10000000-0000-4000-8000-000000000001',expires_at,revoked:false}],
  ]);
  const children = [
    {id:source.child_id,family_id:'10000000-0000-4000-8000-000000000001',display_name:'Synthetic A',archived:false},
    {id:'20000000-0000-4000-8000-000000000002',family_id:'10000000-0000-4000-8000-000000000001',display_name:'Synthetic B',archived:false},
  ];
  const repository=fixtureRepository({catalog,principals,sessions:[source],children,now:()=>new Date().toISOString()});
  let serial = 0;
  for(const module of new Set(catalog.map(row=>row.module_key)))for(const kind of ['pop','exam'])for(const retake of [0,1]) {
    const assessment=catalog.find(row=>row.module_key===module && row.kind===kind)!;
    const attemptId=`60000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`;
    await repository.dispatch('child_attempt_record',{token_hash:session.token,idempotency_key:attemptId},{client_version:1,attempt:{id:attemptId,authorization_session_id:source.id,assessment_id:assessment.id,first_correct:kind==='pop'?Math.round(assessment.total*(retake?0.8:0.6)):Math.round(assessment.total*(retake?53/70:42/70)),answered_count:assessment.total,total:assessment.total,finalized:true,completed_at:new Date(Date.now()-(retake?30:60)*60000).toISOString(),time_quality:'anchored',administered_fingerprint:'a'.repeat(64)},...(kind==='pop'&&!retake?{correction:{final_correct:assessment.total,captured_at:new Date(Date.now()-59*60000).toISOString()}}:{})});
  }
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
    if(url.pathname.startsWith('/__m2/m1/')) {
      const token=request.headers.get('authorization')?.replace('Bearer ','');
      if(url.pathname.endsWith('/parent/family') && token==='fixture-parent')return json({api_version:1,timezone:'Asia/Manila',children,devices:[]});
      if(url.pathname.endsWith('/child/bootstrap') && token===session.token)return json({api_version:1,child:session.child,capabilities:['family_access']});
      if(url.pathname.endsWith('/child/lock') && token===session.token)return json({api_version:1,locked:true});
      return json({error:{message:'Local fixture access unavailable'}},403);
    }
    if (url.pathname.startsWith("/__m2/")) {
      try {
        if (
          request.method !== "POST" ||
          !principals.has(request.headers.get("authorization")?.replace('Bearer ','') || '') ||
          Date.now() >= Date.parse(expires_at)
        ) throw new ApiError(401, "UNLOCK_REQUIRED", "Local fixture access unavailable.");
        const body = await jsonBody(request);
        const credential=request.headers.get('authorization')!.replace('Bearer ','');
        if(['/__m2/bootstrap','/__m2/progress','/__m2/attempts'].includes(url.pathname)) {
          const parent=credential==='fixture-parent', selected=parent?children.find(child=>child.id===body.child_id):children[0];
          if(!selected)throw new ApiError(404,'PROFILE_NOT_FOUND','Profile unavailable');
          if(url.pathname==='/__m2/bootstrap')return json({child:{id:selected.id,display_name:selected.display_name},capabilities:['family_access','assessment_history_v1','progress_summary_v1'],contract_version:1,catalog_version:1,catalog_digest:catalogDigest});
          const payload={...body};delete payload.role;
          if(!parent)delete payload.child_id;
          return json(await repository.dispatch((parent?'parent_':'child_')+(url.pathname.endsWith('/progress')?'progress':'attempts'),parent?{owner_id:credential}:{token_hash:credential},payload));
        }
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
    if (!["family.html","family-parent.html"].includes(filename) && !catalog.some((row) => filename === row.module_key + ".html")) {
      return json({ error: "Unknown reviewer fixture" }, 404);
    }
    let html = await Deno.readTextFile(new URL(`../../${filename==='family-parent.html'?'family.html':filename}`, import.meta.url));
    const adapter = `Object.freeze({
      catalog:${JSON.stringify(catalog)},catalogDigest:${JSON.stringify(catalogDigest)},
      async call(operation,session,body,signal) {
        const response=await fetch('/__m2/'+operation,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.token},body:JSON.stringify(body),signal:signal || AbortSignal.timeout(10000)});
        const result=await response.json();if(!response.ok){const error=new Error('Local fixture unavailable');error.status=response.status;throw error;}return result;
      },
      bootstrap(session,role,child,signal){return this.call('bootstrap',session,{role,child_id:child.id},signal);},
      progress(session,role,child,quarter,signal){return this.call('progress',session,{role,child_id:child.id,quarter},signal);},
      attempts(session,role,child,filters,signal){return this.call('attempts',session,{role,child_id:child.id,...filters},signal);},
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
      window.__m2Ready=(async()=>{
        const session=${JSON.stringify(session)};
        const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('grade6-family-v1',3);request.onupgradeneeded=()=>{for(const store of ['credentials','records','outbox','metadata','reports'])if(!request.result.objectStoreNames.contains(store))request.result.createObjectStore(store);};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
        session.access_epoch=await new Promise(resolve=>{const tx=db.transaction('metadata','readonly');const request=tx.objectStore('metadata').get('access_epoch');tx.oncomplete=()=>{db.close();resolve(request.result||0);};});
        ${filename==='family-parent.html'?`sessionStorage.removeItem('grade6-family-child-v1');sessionStorage.setItem('grade6-family-parent-v1',JSON.stringify({token:'fixture-parent',refresh_token:'fixture-refresh',expires_at:${JSON.stringify(expires_at)}}));`:`sessionStorage.removeItem('grade6-family-parent-v1');sessionStorage.setItem('grade6-family-child-v1',JSON.stringify(session));`}
        document.getElementById('m2FixtureBanner').textContent='Local demonstration · Synthetic A · Results stay encrypted on this device, not synced';
      })().catch(()=>{document.getElementById('m2FixtureBanner').textContent='Local fixture storage unavailable — reload to retry';});
    </script>`;
    html = html.replace("const FAMILY_ENABLED = false;", "const FAMILY_ENABLED = true;")
      .replace('const FAMILY_HISTORY_ENABLED = false;','const FAMILY_HISTORY_ENABLED = true;')
      .replace('const FAMILY_REPORT_ENABLED = false;','const FAMILY_REPORT_ENABLED = true;')
      .replace("const FAMILY_LOCAL_ADAPTER = null;", `const FAMILY_LOCAL_ADAPTER = ${adapter};`)
      .replace(
        "<body>",
        '<body><aside id="m2FixtureBanner" role="status" style="padding:12px;text-align:center;background:#fff4d4">Initializing local demonstration</aside>' +
          boot,
      );
    if(['family.html','family-parent.html'].includes(filename)) {
      html=html.replace(/const FAMILY_SUPABASE_URL = ["'][^"']+["'];/,'const FAMILY_SUPABASE_URL = "http://127.0.0.1:8766";').replace(/const ready\s*=[\s\S]*?;/,'const ready = FAMILY_ENABLED;');
      html=html.replace('init().catch((error) => {',"window.__m2Ready.then(init).catch((error) => {");
      html=html.replace('const API = FAMILY_SUPABASE_URL + "/functions/v1/family-api/v1";','const API = FAMILY_SUPABASE_URL + "/__m2/m1/v1";');
      for(const row of catalog)html=html.replaceAll('href="'+row.module_key+'.html#report"','href="/__family_m2_fixture__/'+row.module_key+'.html#report"');
    }
    else html=html.replace('</body>',"<script>window.addEventListener('load',async()=>{await window.__m2Ready;if(location.hash==='#report'){document.getElementById('welcomeOverlay')?.classList.add('hidden');document.getElementById('reportTabBtn')?.click();renderReportCardMain();}});</script></body>");
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  };
}
