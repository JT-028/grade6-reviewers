import manifest from "../../supabase/functions/family-api/m2-catalog.json" with {type:"json"};
const runtime=JSON.parse(await Deno.readTextFile("test-results/m2-bridge-browser-session.json"));
if(runtime.api!=="http://127.0.0.1:54321")throw new Error("Loopback backend required");
const files=["family.html",...new Set(manifest.assessments.map(row=>row.module_key+".html"))];
Deno.serve({hostname:"127.0.0.1",port:8767},async request=>{
  const url=new URL(request.url);
  if(url.hostname!=="127.0.0.1" || url.port!=="8767")return new Response("Loopback only",{status:403});
  if(url.pathname.startsWith("/functions/v1/family-api/") || url.pathname.startsWith("/auth/v1/")){
    // Existing test server owns port 8766. This transparent loopback relay preserves M1's exact CORS allowlist.
    const headers=new Headers(request.headers);headers.set("origin","http://127.0.0.1:8766");headers.delete("host");
    const upstream=await fetch(runtime.api+url.pathname+url.search,{method:request.method,headers,body:["GET","HEAD"].includes(request.method)?undefined:request.body,signal:AbortSignal.timeout(15000)});
    return new Response(upstream.body,{status:upstream.status,headers:{"content-type":"application/json","cache-control":"no-store"}});
  }
  const filename=url.pathname.slice(1);
  if(!files.includes(filename))return new Response("Unknown local integration page",{status:404});
  let html=await Deno.readTextFile(filename);
  html=html.replace("const FAMILY_ENABLED = false;","const FAMILY_ENABLED = true;").replace("const FAMILY_HISTORY_ENABLED = false;","const FAMILY_HISTORY_ENABLED = true;").replace("const FAMILY_REPORT_ENABLED = false;","const FAMILY_REPORT_ENABLED = true;")
    .replace(/const FAMILY_BRIDGE_URL = '[^']+';/,"const FAMILY_BRIDGE_URL = 'http://127.0.0.1:8767';")
    .replace(/const FAMILY_BRIDGE_KEY = '[^']+';/,"const FAMILY_BRIDGE_KEY = "+JSON.stringify(runtime.anon)+";")
    .replace(/const FAMILY_SUPABASE_URL = "[^"]+";/,'const FAMILY_SUPABASE_URL = "http://127.0.0.1:8767";')
    .replace(/const FAMILY_SUPABASE_PUBLISHABLE_KEY = "[^"]+";/,'const FAMILY_SUPABASE_PUBLISHABLE_KEY = '+JSON.stringify(runtime.anon)+';')
    .replace(/const ready\s*=[\s\S]*?;/,'const ready = FAMILY_ENABLED;');
  const boot=`<script>
    if(!sessionStorage.getItem('grade6-family-child-v1'))sessionStorage.setItem('grade6-family-child-v1',JSON.stringify({...${JSON.stringify(runtime.session)},access_epoch:0}));
    window.__bridgeRequests=[];
    const bridgeFetch=window.fetch.bind(window);
    window.fetch=async(...args)=>{const response=await bridgeFetch(...args);const path=String(args[0]);if(path.includes('/family-api/'))window.__bridgeRequests.push({path:new URL(path,location.href).pathname,status:response.status});return response;};
  </script>`;
  html=html.replace(/<body([^>]*)>/,'<body$1><aside role="status" style="padding:12px;background:#fff4d4">Local production bridge · synthetic data · real loopback SQL/Auth/Edge</aside>'+boot);
  return new Response(html,{headers:{"content-type":"text/html;charset=utf-8","cache-control":"no-store"}});
});
