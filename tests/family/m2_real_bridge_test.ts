import { createClient } from "@supabase/supabase-js";
import { canonicalJson, randomHex, sha256 } from "../../supabase/functions/family-api/crypto.ts";
import manifest from "../../supabase/functions/family-api/m2-catalog.json" with {type:"json"};
const enabled=Deno.env.get("FAMILY_REAL_STACK")==="1";
const literal=(value:string)=>"'"+value.replaceAll("'","''")+"'";
function assert(value:unknown,message:string):asserts value {if(!value)throw new Error(message);}
async function sql(query:string):Promise<string>{
  const child=new Deno.Command("docker",{args:["exec","-i","supabase_db_grade6-reviewers-family","psql","-U","postgres","-d","postgres","-X","-qAt","-v","ON_ERROR_STOP=1"],stdin:"piped",stdout:"piped",stderr:"piped"}).spawn();
  const writer=child.stdin.getWriter();await writer.write(new TextEncoder().encode(query));await writer.close();
  const result=await child.output();if(!result.success){await Deno.writeTextFile("test-results/m2-bridge-sql-error.log",new TextDecoder().decode(result.stderr));throw new Error("Local SQL failed; inspect ignored diagnostic log.");}return new TextDecoder().decode(result.stdout).trim();
}
Deno.test({name:"M2 actual local SQL/Auth/Edge production bridge",ignore:!enabled,fn:async test=>{
  const status=JSON.parse(await Deno.readTextFile("test-results/qa-local-status.json"));
  assert(status.API_URL==="http://127.0.0.1:54321","Require owned loopback stack");
  const api=status.API_URL,anon=status.ANON_KEY;
  const admin=createClient(api,status.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const browser=createClient(api,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const childId=crypto.randomUUID(),siblingId=crypto.randomUUID(),deviceId=crypto.randomUUID(),sessionId=crypto.randomUUID(),expiredSourceId=crypto.randomUUID(),revokedSourceId=crypto.randomUUID();
  const token=randomHex(32),cache=randomHex(32),deviceToken=randomHex(32);
  let ownerToken="",otherToken="",familyId="",revision="",expiredEnvelope:any;
  const q2=manifest.assessments.find(row=>row.module_key==="Math6_Q2_Review_Module_v1.0.0" && row.kind==="exam")!;
  const pop=manifest.assessments.find(row=>row.module_key==="Math6_Q2_Review_Module_v1.0.0" && row.kind==="pop")!;
  const start=Date.now()-3600000;
  function envelope(correct:number,offset:number,assessment=q2,source=sessionId,quality="anchored"){
    return {client_version:1,attempt:{id:crypto.randomUUID(),authorization_session_id:source,assessment_id:assessment.id,first_correct:correct,answered_count:assessment.total,total:assessment.total,finalized:true,completed_at:new Date(start+offset*60000).toISOString(),time_quality:quality,administered_fingerprint:"a".repeat(64)}};
  }
  async function call(path:string,credential=token,body?:unknown,id?:string){
    const response=await fetch(api+"/functions/v1/family-api/v1"+path,{method:body?"POST":"GET",headers:{apikey:anon,authorization:"Bearer "+credential,origin:"http://127.0.0.1:8766",...(body?{"content-type":"application/json","idempotency-key":id||(body as any).attempt?.id||crypto.randomUUID()}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
    return {status:response.status,value:await response.json()};
  }
  function okay(result:{status:number;value:any},status=200){assert(result.status===status,`Expected ${status}, got ${result.status}/${result.value.error?.code}`);return result.value;}
  async function step(name:string,action:()=>Promise<void>){if(!await test.step(name,action))throw new Error("Dependent real bridge checks stopped.");}
  await step("owned synthetic environment; real pgcrypto and frozen catalog; no reset",async()=>{
    assert(await sql("select count(*) from auth.users where email is null or email not like 'qa-%@example.test';")==="0","Refuse non-QA local users");
    assert(await sql("select count(*) from private.assessments;")==="64","Real catalog count");
    assert(await sql("select exists(select 1 from pg_extension where extname='pgcrypto');")==="t","Real pgcrypto required");
    familyId=await sql("select id from private.families;");assert(/^[a-f0-9-]{36}$/.test(familyId),"Existing owned QA family required");
    const owner=await sql("select u.email from auth.users u join private.families f on f.owner_auth_id=u.id;");
    const link=await admin.auth.admin.generateLink({type:"magiclink",email:owner});
    assert(!link.error && link.data.properties?.hashed_token,"Local admin generates test owner login without sending mail");
    const login=await browser.auth.verifyOtp({token_hash:link.data.properties.hashed_token,type:"magiclink"});
    assert(!login.error && login.data.session,"Actual local Auth owner session");ownerToken=login.data.session.access_token;
    const other=await admin.auth.admin.createUser({email:`qa-m2-other-${crypto.randomUUID()}@example.test`,password:randomHex(32),email_confirm:true});
    assert(!other.error && other.data.user,"Synthetic non-owner account");
    const otherLink=await admin.auth.admin.generateLink({type:"magiclink",email:other.data.user.email!});assert(!otherLink.error,"Other link");
    const otherLogin=await browser.auth.verifyOtp({token_hash:otherLink.data.properties.hashed_token,type:"magiclink"});assert(!otherLogin.error && otherLogin.data.session,"Other login");otherToken=otherLogin.data.session.access_token;
    await sql(`insert into private.children(id,family_id,display_name,pin_salt,pin_hash) values
      (${literal(childId)},${literal(familyId)},'QA M2 bridge',decode(repeat('ab',16),'hex'),decode(repeat('cd',32),'hex')),
      (${literal(siblingId)},${literal(familyId)},'QA M2 sibling',decode(repeat('ab',16),'hex'),decode(repeat('cd',32),'hex'));
      insert into private.devices(id,family_id,label,token_hash,allowed_child_ids) values(${literal(deviceId)},${literal(familyId)},'QA M2 isolated device',decode(${literal(await sha256(deviceToken))},'hex'),array[${literal(childId)}::uuid]);
      insert into private.device_children(device_id,child_id,family_id,cache_key) values(${literal(deviceId)},${literal(childId)},${literal(familyId)},decode(${literal(cache)},'hex'));
      insert into private.child_sessions(id,device_id,child_id,token_hash,pin_version,device_generation,created_at,expires_at,revoked_at) values
      (${literal(sessionId)},${literal(deviceId)},${literal(childId)},decode(${literal(await sha256(token))},'hex'),1,1,now()-interval '2 hours',now()+interval '6 hours',null),
      (${literal(expiredSourceId)},${literal(deviceId)},${literal(childId)},decode(${literal(await sha256(randomHex(32)))},'hex'),1,1,now()-interval '3 hours',now()-interval '5 minutes',null),
      (${literal(revokedSourceId)},${literal(deviceId)},${literal(childId)},decode(${literal(await sha256(randomHex(32)))},'hex'),1,1,now()-interval '2 hours',now()+interval '6 hours',now());`);
    await Deno.writeTextFile("test-results/m2-bridge-browser-session.json",JSON.stringify({session:{token,cache_key:cache,child:{id:childId,display_name:"QA M2 bridge"},child_session_id:sessionId,expires_at:new Date(Date.now()+6*3600000).toISOString()},parent:{token:ownerToken,expires_at:new Date(Date.now()+3600000).toISOString()},api,anon}));
  });
  await step("actual health/bootstrap/catalog capabilities and complete frozen manifest",async()=>{
    const health=okay(await call("/health"));assert(health.capabilities.includes("assessment_history_v1"),"Health after real schema");
    const bootstrap=okay(await call("/child/bootstrap"));assert(bootstrap.progress_revision==="0" && bootstrap.catalog_digest===manifest.catalog_digest,"Bootstrap revision/manifest");
    const catalog=okay(await call("/child/catalog"));assert(canonicalJson(catalog.assessments)===canonicalJson(manifest.assessments),"Production catalog exact");
    okay(await call("/parent/catalog",ownerToken));okay(await call("/parent/catalog",otherToken),403);
    okay(await call("/child/catalog",deviceToken),401);okay(await call("/child/catalog",ownerToken),401);
  });
  const first=envelope(42,10),second=envelope(53,30);
  await step("concurrent exact ingest is one immutable row/revision; permanent duplicate after response loss",async()=>{
    const pair=await Promise.all([call("/child/attempts",token,first),call("/child/attempts",token,first)]);
    assert(pair.map(row=>row.status).sort().join(",")==="200,201","One accepted, one duplicate");
    assert(pair.every(row=>row.value.revision==="1"),"Duplicate does not increment");
    await sql(`delete from private.api_receipts where principal_id=${literal(childId)}::uuid;`);
    const retry=okay(await call("/child/attempts",token,first));assert(retry.status==="duplicate","Permanent replay after receipt removal");
    okay(await call("/child/attempts",token,{...first,attempt:{...first.attempt,first_correct:43}}),409);
    okay(await call("/child/attempts",token,{...first,child_id:siblingId}),422);
    okay(await call("/child/attempts",token,{...first,attempt:{...first.attempt,id:crypto.randomUUID(),total:0}}),422);
    okay(await call("/child/attempts",token,{...first,attempt:{...first.attempt,id:crypto.randomUUID(),first_correct:1.5}}),422);
    okay(await call("/child/attempts",ownerToken,first),401);
    okay(await call("/child/attempts",token,second),201);
    okay(await call("/child/attempts",token,envelope(10,11),first.attempt.id),409);
  });
  await step("independent fixed arithmetic and parent-child parity from complete SQL scope",async()=>{
    const result=okay(await call("/child/progress?quarter=2"));revision=result.revision;
    const exam=result.subjects[1].exam;
    assert(exam.prior.first_correct===42 && exam.latest.first_correct===53 && exam.latest.percentage===75.71 && exam.percentage_points===15.71 && exam.relative_percent===26.2 && exam.latest.grade.letter==="FS","Fixed 42/70 to 53/70 oracle");
    assert(result.revision==="2" && result.pending_count===0 && result.completeness==="complete","Complete server scope");
    const parent=okay(await call(`/parent/children/${childId}/progress?quarter=2`,ownerToken));assert(canonicalJson(parent.subjects)===canonicalJson(result.subjects),"Parent child canonical parity");
    const empty=okay(await call("/child/progress?quarter=1"));assert(empty.subjects.every((subject:any)=>subject.pop.state==="empty" && subject.exam.state==="empty"),"No Q2 leakage into Q1");
    okay(await call(`/parent/children/${childId}/progress?quarter=2`,otherToken),403);
    okay(await call(`/parent/children/${crypto.randomUUID()}/progress?quarter=2`,ownerToken),404);
  });
  let cursor="";
  await step("strict filters; revision cursor keeps late arrivals out and rejects wrong scope/tampering",async()=>{
    for(const query of ["quarter=2&quarter=2","quarter=2&child_id="+siblingId,"quarter=2&limit=1.5","quarter=3","quarter=2&sort=asc","quarter=2&subject=science","quarter=2&limit=0"]){okay(await call("/child/attempts?"+query),400);}
    okay(await call("/child/bootstrap?quarter=2"),404);
    const firstPage=okay(await call("/child/attempts?quarter=2&limit=1"));cursor=firstPage.next_cursor;assert(cursor && firstPage.items[0].id===second.attempt.id,"First page completion ordered");
    const late=envelope(49,20);okay(await call("/child/attempts",token,late),201);
    const next=okay(await call("/child/attempts?quarter=2&limit=1&cursor="+cursor));assert(next.revision===revision && next.items[0].id===first.attempt.id && next.next_cursor===null,"Late t2 excluded from traversal");
    const fresh=okay(await call("/child/progress?quarter=2"));assert(fresh.revision==="3" && fresh.subjects[1].exam.prior.id===late.attempt.id,"Explicit refresh includes t2 as immediate predecessor");
    okay(await call("/child/attempts?quarter=1&cursor="+cursor),400);
    okay(await call("/child/attempts?quarter=2&subject=math&cursor="+cursor),400);
    const decoded=JSON.parse(atob(cursor.replaceAll("-","+").replaceAll("_","/")));decoded.revision="999999";
    okay(await call("/child/attempts?quarter=2&cursor="+btoa(JSON.stringify(decoded)).replaceAll("+","-").replaceAll("/","_").replaceAll("=","")),400);
    const ordering=JSON.parse(atob(cursor.replaceAll("-","+").replaceAll("_","/")));ordering.last.completed_at=new Date(start+31*60000).toISOString();
    const orderingResult=await call("/child/attempts?quarter=2&cursor="+btoa(JSON.stringify(ordering)).replaceAll("+","-").replaceAll("/","_").replaceAll("=",""));
    assert(okay(orderingResult,400).error.code==="INVALID_CURSOR","Real ordering tuple must exist at the scoped revision");
    okay(await call(`/parent/children/${siblingId}/attempts?quarter=2&cursor=`+cursor,ownerToken),400);
  });
  await step("atomic pop correction, immutable first score, retained history and SQL guards",async()=>{
    const baseline=envelope(12,40,pop);const corrected={...baseline,correction:{final_correct:20,captured_at:baseline.attempt.completed_at}};
    okay(await call("/child/attempts",token,corrected),201);
    const result=okay(await call("/child/progress?quarter=2"));const summary=result.subjects[1].pop;
    assert(summary.latest.first_correct===12 && summary.latest.percentage===60 && summary.latest.correction.final_correct===20,"Separate correction snapshot");
    for(const query of [`update private.attempts set first_correct=0 where id=${literal(baseline.attempt.id)};`,`delete from private.attempts where id=${literal(baseline.attempt.id)};`,`update private.attempt_corrections set final_correct=12 where attempt_id=${literal(baseline.attempt.id)};`,`update private.assessments set total=19 where id=${literal(pop.id)};`]){
      let denied=false;try{await sql(query);}catch{denied=true;}assert(denied,"SQL immutable guard");
    }
    const invalid=envelope(15,41,pop);okay(await call("/child/attempts",token,{...invalid,correction:{final_correct:14,captured_at:invalid.attempt.completed_at}}),422);
    assert(await sql(`select count(*) from private.attempts where id=${literal(invalid.attempt.id)};`)==="0","Invalid correction inserts no baseline");
    const normal=envelope(10,42,pop);okay(await call("/child/attempts",token,normal),201);
    let denied=false;try{await sql(`insert into private.attempt_corrections values(${literal(normal.attempt.id)},${literal(childId)},20,'pop',20,now());`);}catch{denied=true;}assert(denied,"Later correction insert denied");
  });
  await step("expired original source uploads via current session; revoked source and source window fail",async()=>{
    const old=envelope(20,5,q2,expiredSourceId);expiredEnvelope=old;okay(await call("/child/attempts",token,old),201);
    const revoked=envelope(20,5,q2,revokedSourceId);okay(await call("/child/attempts",token,revoked),403);
    const invalid=envelope(20,59,q2,expiredSourceId);okay(await call("/child/attempts",token,invalid),422);
    const unknown=envelope(0,45,q2,sessionId,"client_unverified");okay(await call("/child/attempts",token,unknown),201);
    const result=okay(await call("/child/progress?quarter=2"));assert(result.subjects[1].exam.availability==="chronology_unavailable" && result.subjects[1].exam.latest===null && result.subjects[1].exam.chronology_count===1,"Uncertain chronology suppresses direction");
  });
  await step("browser roles cannot call service dispatcher or read private tables",async()=>{
    for(const credential of [anon,ownerToken]){
      const rpc=await fetch(api+"/rest/v1/rpc/family_dispatch",{method:"POST",headers:{apikey:anon,authorization:"Bearer "+credential,"content-type":"application/json"},body:JSON.stringify({operation:"child_m2_scope",credential_context:{token_hash:await sha256(token)},payload:{}})});assert(!rpc.ok,"Service dispatcher blocked");await rpc.body?.cancel();
      const table=await fetch(api+"/rest/v1/attempts?select=*",{headers:{apikey:anon,authorization:"Bearer "+credential,"Accept-Profile":"private"}});assert(!table.ok,"Private history blocked");await table.body?.cancel();
    }
  });
  await step("source revocation denies permanent duplicate disclosure and retains all attempts",async()=>{
    const count=await sql(`select count(*) from private.attempts where child_id=${literal(childId)};`);
    await sql(`update private.child_sessions set revoked_at=now() where id=${literal(expiredSourceId)};`);
    okay(await call('/child/attempts',token,expiredEnvelope),403);
    const history=okay(await call("/child/attempts?quarter=2&limit=100"));assert(history.items.length===Number(count),"Retained all accepted retakes");
    assert(await sql("select has_function_privilege('anon','public.family_dispatch(text,jsonb,jsonb)','EXECUTE') or has_table_privilege('authenticated','private.attempts','SELECT');")==="f","Least privilege grants");
  });
  await step("current expiry/revocation/archive/generation/PIN/allowlist checks precede reads and duplicate disclosure",async()=>{
    const cases=[
      [`update private.child_sessions set expires_at=now()-interval '1 minute' where id=${literal(sessionId)};`,`update private.child_sessions set expires_at=created_at+interval '8 hours' where id=${literal(sessionId)};`],
      [`update private.child_sessions set revoked_at=now() where id=${literal(sessionId)};`,`update private.child_sessions set revoked_at=null where id=${literal(sessionId)};`],
      [`update private.children set archived_at=now() where id=${literal(childId)};`,`update private.children set archived_at=null where id=${literal(childId)};`],
      [`update private.devices set generation=2 where id=${literal(deviceId)};`,`update private.devices set generation=1 where id=${literal(deviceId)};`],
      [`update private.children set pin_version=2 where id=${literal(childId)};`,`update private.children set pin_version=1 where id=${literal(childId)};`],
      [`update private.devices set revoked_at=now() where id=${literal(deviceId)};`,`update private.devices set revoked_at=null where id=${literal(deviceId)};`],
      [`update private.devices set allowed_child_ids=array[${literal(siblingId)}::uuid] where id=${literal(deviceId)};`,`update private.devices set allowed_child_ids=array[${literal(childId)}::uuid] where id=${literal(deviceId)};`],
    ];
    for(const [change,restore] of cases){await sql(change);try{const read=await call('/child/progress?quarter=2'),replay=await call('/child/attempts',token,first);assert([401,403].includes(read.status) && [401,403].includes(replay.status),"Current authorization denied before data/replay");}finally{await sql(restore);}}
    okay(await call('/child/bootstrap'));
  });
}});
