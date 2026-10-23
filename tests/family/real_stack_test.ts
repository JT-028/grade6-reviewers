import { createClient } from "@supabase/supabase-js";
import { createHandler } from "../../supabase/functions/family-api/index.ts";
import { supabaseRepository } from "../../supabase/functions/family-api/auth.ts";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

type Json = Record<string, any>;
const container = "supabase_db_grade6-reviewers-family";
const enabled = Deno.env.get("FAMILY_REAL_STACK") === "1";
const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;

async function sql(query: string): Promise<string> {
  const process = new Deno.Command("docker", {
    args: ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-X", "-qAt", "-v", "ON_ERROR_STOP=1"],
    stdin: "piped", stdout: "piped", stderr: "piped",
  }).spawn();
  const writer = process.stdin.getWriter();
  await writer.write(new TextEncoder().encode(query));
  await writer.close();
  const result = await process.output();
  if (!result.success) {
    await Deno.writeTextFile("test-results/qa-real-sql-error.log", new TextDecoder().decode(result.stderr));
    throw new Error("Real local PostgreSQL assertion failed; see ignored SQL error log.");
  }
  return new TextDecoder().decode(result.stdout).trim();
}

Deno.test({
  name: "M1 real local Supabase: exact pgcrypto migration, Auth, Edge HTTP and private authorization",
  ignore: !enabled,
  fn: async (test) => {
    async function runStep(name: string, action: () => Promise<void>) {
      const passed = await test.step(name, action);
      if (!passed) throw new Error('A real-stack prerequisite failed; dependent checks were stopped.');
    }
    const status = JSON.parse(await Deno.readTextFile("test-results/qa-local-status.json"));
    const api = String(status.API_URL);
    assert(new URL(api).href === "http://127.0.0.1:54321/", "Integration fixtures require the owned loopback Supabase API.");
    const anon = String(status.ANON_KEY), service = String(status.SERVICE_ROLE_KEY);
    const secrets = Object.fromEntries((await Deno.readTextFile("test-results/qa-functions.env"))
      .trim().split(/\r?\n/).map((line) => line.replace(/^\uFEFF/, "").split("=", 2)));
    assert(/^[a-f0-9]{64}$/.test(secrets.PAIR_CLAIM_KEY), "Local claim key fixture must exist.");
    const admin = createClient(api, service, {auth:{persistSession:false,autoRefreshToken:false}});
    const directHandler = createHandler(supabaseRepository(api,service),{pinPepper:secrets.FAMILY_PIN_PEPPER,claimKey:secrets.PAIR_CLAIM_KEY});
    const client = () => createClient(api, anon, {auth:{persistSession:false,autoRefreshToken:false}});
    const password = crypto.randomUUID() + crypto.randomUUID();
    const marker = crypto.randomUUID();
    const ownerEmail = `qa-owner-${marker}@example.test`;
    const otherEmail = `qa-other-${marker}@example.test`;
    let ownerId = "", otherId = "", parentToken = "", otherToken = "";
    let childId = "", siblingId = "", deviceId = "", deviceToken = "", childToken = "";
    let sessionId = "", pairId = "", approval = "";
    let pin = "123456";
    const pollingSecret = Array.from(crypto.getRandomValues(new Uint8Array(32)), (v) => v.toString(16).padStart(2,"0")).join("");
    const sha256 = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), (v)=>v.toString(16).padStart(2,"0")).join("");
    async function request(path: string, method = "GET", body?: Json, token?: string, id = crypto.randomUUID(), origin = "http://127.0.0.1:8766") {
      const headers: Record<string,string> = {apikey:anon, origin};
      if (token) headers.authorization = `Bearer ${token}`;
      if (method !== "GET") { headers["content-type"]="application/json"; headers["idempotency-key"]=id; }
      const response = await fetch(`${api}/functions/v1/family-api/v1${path}`, {method,headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20_000)});
      let data: Json;
      try { data = await response.json(); } catch { throw new Error(`Local Edge returned non-JSON at ${path}: HTTP${response.status}`); }
      return {status:response.status,data,headers:response.headers};
    }
    const okay = (response: {status:number;data:Json}, expected=200) => {
      assert(response.status === expected, `Expected HTTP${expected}, got HTTP${response.status} (${response.data.error?.code || "no API code"}).`);
      assert(response.data.api_version === 1 && typeof response.data.request_id === "string" && !Number.isNaN(Date.parse(response.data.server_time)), "Edge response must contain the complete v1 envelope.");
    };

    await runStep("exact migration is present and real pgcrypto encrypts, randomizes and decrypts", async () => {
      assert(await sql("select count(*) from information_schema.tables where table_schema='private' and table_name='children';") === "1", "Exact migration must have been applied by the local Supabase stack.");
      assert((await sql("select extversion from pg_extension where extname='pgcrypto';")).length > 0, "Real pgcrypto extension is required; no shims.");
      assert(await sql(`select extensions.pgp_sym_decrypt(extensions.pgp_sym_encrypt('local synthetic payload',${literal(secrets.PAIR_CLAIM_KEY)},'cipher-algo=aes256'),${literal(secrets.PAIR_CLAIM_KEY)}) = 'local synthetic payload';`) === "t", "Actual AES256 PGP round trip must work.");
      assert(await sql(`select extensions.pgp_sym_encrypt('same',${literal(secrets.PAIR_CLAIM_KEY)},'cipher-algo=aes256') <> extensions.pgp_sym_encrypt('same',${literal(secrets.PAIR_CLAIM_KEY)},'cipher-algo=aes256');`) === "t", "Real receipt encryption must be randomized.");
    });
    await runStep("real local Auth has no public signup and permits manually confirmed test parents", async () => {
      assert(await sql("select count(*) from auth.users where email is null or email not like 'qa-%@example.test';") === "0", "Refuse to reset an environment containing non-QA users, including email-less accounts.");
      await sql("truncate private.api_receipts,private.rate_windows,private.child_sessions,private.pair_requests,private.device_children,private.devices,private.children,private.families;");
      const {error:signupError} = await client().auth.signUp({email:`qa-signup-${marker}@example.test`,password});
      assert(!!signupError, "Public Auth signup must be disabled.");
      const owner = await admin.auth.admin.createUser({email:ownerEmail,password,email_confirm:true});
      const other = await admin.auth.admin.createUser({email:otherEmail,password,email_confirm:true});
      assert(!owner.error && owner.data.user && !other.error && other.data.user, `Local Auth admin fixture failed: owner=${owner.error?.status || "ok"}/${owner.error?.code || "none"}, other=${other.error?.status || "ok"}/${other.error?.code || "none"}.`);
      ownerId = owner.data.user.id; otherId = other.data.user.id;
      await sql(`insert into private.families(owner_auth_id) values(${literal(ownerId)}::uuid);`);
      const ownerLogin = await client().auth.signInWithPassword({email:ownerEmail,password});
      const otherLogin = await client().auth.signInWithPassword({email:otherEmail,password});
      assert(!ownerLogin.error && ownerLogin.data.session && !otherLogin.error && otherLogin.data.session, `Local password login failed: owner=${ownerLogin.error?.status || "ok"}/${ownerLogin.error?.code || "none"}, other=${otherLogin.error?.status || "ok"}/${otherLogin.error?.code || "none"}.`);
      parentToken = ownerLogin.data.session.access_token; otherToken = otherLogin.data.session.access_token;
    });
    await runStep("actual Edge runtime serves health and rejects unauthenticated, forged and non-owner parents", async () => {
      okay(await request("/health"));
      okay(await request("/parent/family", "GET", undefined, parentToken));
      okay(await request("/parent/family"),401);
      const denied = await request("/parent/family","GET",undefined,otherToken);
      okay(denied,403); assert(denied.data.error.code === "PARENT_NOT_PROVISIONED", "A valid Auth account must not imply family ownership.");
      const parts = parentToken.split(".");
      parts[2] = (parts[2][0] === "A" ? "B" : "A") + parts[2].slice(1);
      okay(await request("/parent/family","GET",undefined,parts.join(".")),401);
    });
    await runStep("real REST denies browser RPC and non-exposed private schema even with a valid parent JWT", async () => {
      for (const token of [anon,parentToken]) {
        const rpc = await fetch(`${api}/rest/v1/rpc/family_dispatch`, {method:"POST",headers:{apikey:anon,authorization:`Bearer ${token}`,"content-type":"application/json"},body:JSON.stringify({operation:"parent_family",credential_context:{owner_id:ownerId},payload:{}})});
        assert(!rpc.ok, "Browser credentials cannot call the service-only dispatcher."); await rpc.body?.cancel();
        const table = await fetch(`${api}/rest/v1/children?select=*`, {headers:{apikey:anon,authorization:`Bearer ${token}`,"Accept-Profile":"private"}});
        assert(!table.ok, "Private schema cannot be exposed through browser REST."); await table.body?.cancel();
      }
    });
    await runStep("concurrent duplicate profile creation commits once and rejects conflicting work", async () => {
      const mutation = crypto.randomUUID(), body = {display_name:"QA <learner> O'Neil",pin};
      const [one,two] = await Promise.all([request("/parent/children","POST",body,parentToken,mutation),request("/parent/children","POST",body,parentToken,mutation)]);
      okay(one,201); okay(two,201); childId=one.data.child.id;
      assert(childId===two.data.child.id, "Concurrent retries must return one committed child.");
      okay(await request("/parent/children","POST",{display_name:"Changed intent",pin},parentToken,mutation),409);
      const sibling = await request("/parent/children","POST",{display_name:"QA sibling",pin},parentToken);
      okay(sibling,201); siblingId=sibling.data.child.id;
      const family = await request("/parent/family","GET",undefined,parentToken); okay(family);
      assert(family.data.children.length===2 && !JSON.stringify(family.data).includes("pin_hash"), "Parent roster exposes profiles, not PIN verifiers.");
    });
    await runStep("real pairing requires its secret, limits the roster and replays an encrypted claim", async () => {
      pairId=crypto.randomUUID(); const mutation=crypto.randomUUID();
      const body={request_id:pairId,poll_hash:await sha256(pollingSecret),device_label:"QA local tablet"};
      const pair=await request("/pair-requests","POST",body,undefined,mutation);okay(pair,201);approval=pair.data.approval_code;
      const replay=await request("/pair-requests","POST",body,undefined,mutation);okay(replay,201);
      assert(replay.data.approval_code===approval,"Lost pairing response must return the original code.");
      okay(await request(`/pair-requests/${pairId}/claim`,"POST",{},"0".repeat(64)),401);
      const pending=await request(`/pair-requests/${pairId}/claim`,"POST",{},pollingSecret);okay(pending);assert(pending.data.status==="pending","Unapproved device remains pending.");
      const approved=await request("/parent/pair-approvals","POST",{approval_code:approval,child_ids:[childId]},parentToken);okay(approved);deviceId=approved.data.device_id;
      const claimMutation=crypto.randomUUID();
      const claim=await request(`/pair-requests/${pairId}/claim`,"POST",{},pollingSecret,claimMutation);okay(claim);deviceToken=claim.data.device_token;
      const claimReplay=await request(`/pair-requests/${pairId}/claim`,"POST",{},pollingSecret,claimMutation);okay(claimReplay);
      assert(deviceToken===claimReplay.data.device_token,"Actual encrypted claim replay must preserve the device credential.");
      const roster=await request("/device/children","GET",undefined,deviceToken);okay(roster);
      assert(roster.data.children.length===1 && roster.data.children[0].id===childId,"Device roster must not expose siblings.");
      okay(await request("/child/bootstrap","GET",undefined,deviceToken),401);
      assert(await sql(`select position(convert_to(${literal(deviceToken)},'utf8') in encrypted_claim)=0 from private.pair_requests where id=${literal(pairId)}::uuid;`)==="t","Persisted pair ciphertext cannot contain the raw device credential.");
    });
    await runStep("real PIN derivation rejects sibling/wrong PIN and replays a successful scoped session", async () => {
      okay(await request("/child/unlock","POST",{child_id:siblingId,pin},deviceToken),401);
      okay(await request("/child/unlock","POST",{child_id:childId,pin:"654321"},deviceToken),401);
      const mutation=crypto.randomUUID(), body={child_id:childId,pin};
      const unlocked=await request("/child/unlock","POST",body,deviceToken,mutation);okay(unlocked);
      childToken=unlocked.data.child_session_token;sessionId=unlocked.data.child_session_id;
      assert(unlocked.data.child.id===childId && /^[a-f0-9]{64}$/.test(unlocked.data.cache_key),"Unlock returns only the permitted child's session/key.");
      const replay=await request("/child/unlock","POST",body,deviceToken,mutation);okay(replay);
      assert(replay.data.child_session_token===childToken && replay.data.child_session_id===sessionId,"Actual SQL receipt must replay one child session.");
      const bootstrap=await request("/child/bootstrap","GET",undefined,childToken);okay(bootstrap);assert(bootstrap.data.child.id===childId,"Child session owns only its own bootstrap.");
      assert(await sql(`select position(convert_to(${literal(childToken)},'utf8') in encrypted_response)=0 from private.api_receipts where principal_kind='device' and idempotency_key=${literal(mutation)}::uuid;`)==="t","Persisted session receipt cannot contain its plaintext token.");
    });
    await runStep("wrong receipt key cannot decrypt production pgcrypto ciphertext", async () => {
      let rejected=false;
      try {await sql(`select extensions.pgp_sym_decrypt(encrypted_claim,${literal("0".repeat(64))}) from private.pair_requests where id=${literal(pairId)}::uuid;`);}catch{rejected=true;}
      assert(rejected,"Real pgcrypto must reject the wrong encryption key.");
    });
    await runStep("concurrent PIN reset invalidates a racing old-PIN session", async () => {
      const [unlock,reset]=await Promise.all([request("/child/unlock","POST",{child_id:childId,pin},deviceToken),request(`/parent/children/${childId}`,"PATCH",{pin:"234567"},parentToken)]);
      okay(reset); assert([200,401].includes(unlock.status),"Racing old unlock may finish before reset or fail, never bypass it.");
      if(unlock.status===200) assert([401,403].includes((await request("/child/bootstrap","GET",undefined,unlock.data.child_session_token)).status),"Any old-PIN session issued in the race is invalid after reset.");
      assert([401,403].includes((await request("/child/bootstrap","GET",undefined,childToken)).status),"Existing session is invalid after PIN reset.");
      pin="234567";
      const next=await request("/child/unlock","POST",{child_id:childId,pin},deviceToken);okay(next);childToken=next.data.child_session_token;sessionId=next.data.child_session_id;
    });
    await runStep("real PIN reservation enforces cooldown before unlimited guessing", async () => {
      await sql("delete from private.rate_windows where scope in ('pin_device','pin_child');");
      for(let attempt=0;attempt<5;attempt++)okay(await request("/child/unlock","POST",{child_id:childId,pin:"654321"},deviceToken),401);
      const limited=await request("/child/unlock","POST",{child_id:childId,pin},deviceToken);okay(limited,429);
      assert(limited.headers.has("Retry-After"),"Rate limit response must tell the client when to retry.");
      await sql("delete from private.rate_windows where scope in ('pin_device','pin_child');");
    });
    await runStep("expired child session and expired pairing are rejected; cleanup retains profiles", async () => {
      await sql(`update private.child_sessions set created_at=now()-interval '2 hours',expires_at=now()-interval '1 minute' where id=${literal(sessionId)}::uuid;`);
      okay(await request("/child/bootstrap","GET",undefined,childToken),401);
      await sql(`update private.pair_requests set expires_at=now()-interval '1 minute' where id=${literal(pairId)}::uuid;`);
      okay(await request(`/pair-requests/${pairId}/claim`,"POST",{},pollingSecret),410);
      await sql(`update private.pair_requests set expires_at=now()-interval '2 days' where id=${literal(pairId)}::uuid;`);
      okay(await request("/parent/family","GET",undefined,parentToken));
      assert(await sql("select (select count(*) from private.pair_requests)=0 and (select count(*) from private.children)=2;")==="t","Expired pair cleanup must preserve family profiles.");
    });
    await runStep("revocation rejects stored device credentials and retains the recovery key", async () => {
      okay(await request(`/parent/devices/${deviceId}`,"PATCH",{revoked:true},parentToken));
      okay(await request("/device/children","GET",undefined,deviceToken),403);
      okay(await request("/child/unlock","POST",{child_id:childId,pin},deviceToken),403);
      assert(await sql(`select count(*) from private.device_children where device_id=${literal(deviceId)}::uuid;`)==="1","Revocation retains key records for explicit future recovery.");
    });
    await runStep("production-origin CORS works, untrusted origin fails, and parent errors reveal no secrets", async () => {
      const allowed=await request("/parent/family","GET",undefined,parentToken,crypto.randomUUID(),"https://jt-028.github.io");okay(allowed);
      assert(["*","https://jt-028.github.io"].includes(allowed.headers.get("Access-Control-Allow-Origin") || ""),"Local gateway must permit the legitimate browser origin.");
      const denied=await request("/parent/family","GET",undefined,parentToken,crypto.randomUUID(),"https://untrusted.example");okay(denied,403);
      assert(!JSON.stringify(denied.data).includes(service) && denied.data.error.code==="ORIGIN_NOT_ALLOWED","Untrusted Origin must be denied by the app even if local Kong adds wildcard CORS.");
      const directAllowed=await directHandler(new Request(`${api}/functions/v1/family-api/v1/parent/family`,{headers:{authorization:`Bearer ${parentToken}`,origin:"https://jt-028.github.io"}}));
      assert(directAllowed.status===200 && directAllowed.headers.get("Access-Control-Allow-Origin")==="https://jt-028.github.io","Actual handler plus real Auth/DB must emit the exact production-origin allowlist.");await directAllowed.body?.cancel();
      const directDenied=await directHandler(new Request(`${api}/functions/v1/family-api/v1/parent/family`,{headers:{authorization:`Bearer ${parentToken}`,origin:"https://untrusted.example"}}));
      assert(directDenied.status===403 && !directDenied.headers.has("Access-Control-Allow-Origin"),"Handler must not grant untrusted origins a CORS header.");await directDenied.body?.cancel();
    });
  },
});
