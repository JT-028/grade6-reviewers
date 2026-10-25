import vm from "node:vm";
import { IDBFactory } from "npm:fake-indexeddb@6.2.4";
import { progressFromResults, academicDigest, reportProjection } from "../../supabase/functions/family-api/m2-progress.ts";
import { resultDTO, type Assessment, type Envelope } from "../../supabase/functions/family-api/m2-contract.ts";
import { inventory } from "./m2_catalog_inventory.ts";
import { canonicalJson } from "../../supabase/functions/family-api/crypto.ts";
function assert(value:unknown,label:string):asserts value {if(!value)throw new Error(label);}
async function click(element:Element|undefined){const action=element?.events.get('click');assert(action,'button action exists');await action();}
class Element {
  tagName:string; children:Element[]=[]; events=new Map<string,()=>unknown>(); style={cssText:''}; attributes=new Map<string,string>(); ownText=''; disabled=false; value=''; selected=false;
  constructor(tag='div'){this.tagName=tag;}
  set textContent(value:string){this.ownText=value;this.children=[];}
  get textContent():string{return this.ownText+this.children.map(child=>child.textContent).join('');}
  append(...children:Element[]){this.children.push(...children);}
  replaceChildren(...children:Element[]){this.ownText='';this.children=children;}
  setAttribute(name:string,value:string){this.attributes.set(name,value);}
  addEventListener(name:string,action:()=>unknown){this.events.set(name,action);}
}
const child={id:'20000000-0000-4000-8000-000000000001',display_name:'Synthetic A'};
const now='2026-10-24T04:00:00.000Z';
const assessment:Assessment={id:'Math6_Q2_Review_Module_v1.0.0:pop:flashcards:r1',module_key:'Math6_Q2_Review_Module_v1.0.0',subject:'math',quarter:2,kind:'pop',set_key:'flashcards',content_revision:1,catalog_digest:'a'.repeat(64),total:10,grade_policy:'deped-descriptor-rounded-v1',label:'Synthetic assessment',retired:false};
function row(number:number,correct:number){const envelope:Envelope={client_version:1,attempt:{id:`60000000-0000-4000-8000-${String(number).padStart(12,'0')}`,authorization_session_id:'50000000-0000-4000-8000-000000000001',assessment_id:assessment.id,first_correct:correct,answered_count:10,total:10,completed_at:`2026-10-24T0${number}:00:00.000Z`,time_quality:'anchored',finalized:true,administered_fingerprint:'a'.repeat(64)}};return resultDTO(envelope,assessment,child.id,now);}
function progress(profile=child,quarter=2){return progressFromResults({child:profile,quarter,rows:profile.id===child.id?[row(1,6),row(3,8)]:[],revision:'2',catalog_digest:'a'.repeat(64),as_of:now,provenance:'local_fixture'});}
async function harness(module:string){
  const source=await Deno.readTextFile(new URL(`../../${module}.html`,import.meta.url));
  const block=source.slice(source.indexOf('// FAMILY_REPORT_START'),source.indexOf('// FAMILY_REPORT_END'));
  const document={hidden:false,createElement:(tag:string)=>new Element(tag)};
  const indexedDB=new IDBFactory();
  const context=vm.createContext({document,indexedDB,crypto,TextEncoder,TextDecoder,AbortController,structuredClone,navigator:{onLine:true},setTimeout:()=>1,clearTimeout:()=>{}});
  vm.runInContext(block.replace('FAMILY_HISTORY_ENABLED = false','FAMILY_HISTORY_ENABLED = true').replace('FAMILY_REPORT_ENABLED = false','FAMILY_REPORT_ENABLED = true')+';globalThis.report=familyReport',context);
  const report=context.report,host=new Element(),session={token:'b'.repeat(64),cache_key:'c'.repeat(64),access_epoch:0,expires_at:new Date(Date.now()+3600000).toISOString()};
  const adapter={bootstrap:async(_session:unknown,_role:unknown,profile:typeof child)=>({child:profile,capabilities:['assessment_history_v1','progress_summary_v1'],contract_version:1,catalog_digest:'a'.repeat(64)}),progress:async(_session:unknown,_role:unknown,profile:typeof child,quarter:number)=>progress(profile,quarter),attempts:async()=>({items:[row(3,8),row(1,6)],next_cursor:null,revision:'2',as_of:now})};
  const options={role:'child',session,child,quarter:2,origin:module,catalog:[assessment],catalogDigest:'a'.repeat(64),adapter};
  return {report,host,options,adapter,indexedDB,context,source};
}
Deno.test('M2-B generated all-eight inline parity, guest separation and encrypted report store',async()=>{
  const modules=[...new Set((await inventory()).map(row=>row.module_key))];
  const golden=JSON.parse(await Deno.readTextFile(new URL('fixtures/m2-projection-oracle.json',import.meta.url))).projection;
  const expectedDigest='25bc60d141a6cd1d677c2682846a968ac19339d31a59712d7ac3a3b285f7dd63';
  assert(await academicDigest(reportProjection(progress()))===expectedDigest,'independent frozen digest');
  for(const module of modules){
    const h=await harness(module);await h.report.show(h.host,h.options);
    assert(await h.report.core.academicDigest(h.report.projection)===expectedDigest,'same canonical digest '+module);
    assert(canonicalJson(h.report.projection)===canonicalJson(golden),'fixed complete ReportProjection '+module);
    assert(h.host.children.filter((element:Element)=>element.tagName==='article').length===8,'eight kind cards '+module);
    assert(h.host.textContent.includes('80.00%')&&h.host.textContent.includes('+33.3%')&&!h.host.textContent.includes('99/100'),'raw oracle and no guest substitution '+module);
    assert(h.source.includes('if (familyRenderPrivateReport(wrap)) return;'),'existing report boundary '+module);
    const database=await new Promise<IDBDatabase>((resolve,reject)=>{const request=h.indexedDB.open('grade6-family-v1',3);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    const encrypted=await new Promise<any>(resolve=>{const tx=database.transaction('reports'),request=tx.objectStore('reports').get([child.id,'quarter-2']);tx.oncomplete=()=>resolve(request.result);});
    assert(encrypted.schema_version===1 && !JSON.stringify(encrypted).includes('Synthetic'),'encrypted projection only');
    const bytes=new Uint8Array(32).fill(204),key=await crypto.subtle.importKey('raw',bytes,'AES-GCM',false,['decrypt']);bytes.fill(0);
    const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:encrypted.iv,additionalData:new TextEncoder().encode(JSON.stringify(['reports',[child.id,'quarter-2'],1]))},key,encrypted.ciphertext);
    assert(JSON.parse(new TextDecoder().decode(plain)).projection.child.id===child.id,'correct AAD decrypts');
    database.close();h.report.clear();
  }
});
Deno.test('M2-B delayed child/quarter, lock, expiry/error and offline report boundaries',async()=>{
  const h=await harness('Math6_Q2_Review_Module_v1.0.0');
  let release:((value:unknown)=>void)|undefined;
  const delayed={...h.adapter,progress:()=>new Promise(resolve=>{release=resolve;})};
  const first=h.report.show(h.host,{...h.options,adapter:delayed});
  while(!release)await new Promise(resolve=>setTimeout(resolve,1));
  const other={id:'20000000-0000-4000-8000-000000000002',display_name:'Synthetic B'};
  await h.report.show(h.host,{...h.options,child:other,quarter:1});
  release(progress());await first;
  assert(h.host.textContent.includes('Synthetic B')&&!h.host.textContent.includes('Synthetic A')&&h.report.projection.quarter===1,'late A response cannot replace B Q1');
  await h.report.show(h.host,h.options);
  h.context.navigator.onLine=false;h.report.offline();assert(h.host.textContent.includes('Stale')&&h.report.projection.stale,'authorized open page stale label');
  h.report.clear();assert(h.report.projection===null&&!h.host.textContent.includes('80.00%'),'lock erases decrypted DOM');
  let locked=false;await h.report.show(h.host,{...h.options,onLock:()=>{locked=true;},adapter:{...h.adapter,bootstrap:()=>Promise.reject(Object.assign(new Error('revoked'),{status:403}))}});
  assert(locked && h.report.projection===null,'authoritative revoke locks');
  await h.report.show(h.host,{...h.options,adapter:{...h.adapter,progress:()=>Promise.reject(new Error('outage'))}});
  assert(h.report.projection===null&&h.host.textContent.includes('not available')&&!h.host.textContent.includes('No results recorded'),'failed response never successful empty');
  await h.report.show(h.host,{...h.options,session:{...h.options.session,access_epoch:1}});assert(h.report.projection===null,'missed epoch locks before rendering');
  h.report.clear();
});
Deno.test('M2-B delayed pending middle result requires complete fixed-revision history',async()=>{
  const h=await harness('Math6_Q2_Review_Module_v1.0.0');
  const pending=row(2,7),recordKey=[child.id,assessment.module_key,pending.id];
  const database=await new Promise<IDBDatabase>((resolve,reject)=>{const request=h.indexedDB.open('grade6-family-v1',3);request.onupgradeneeded=()=>{for(const name of ['records','reports','metadata'])request.result.createObjectStore(name);};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  const bytes=new Uint8Array(32).fill(204),key=await crypto.subtle.importKey('raw',bytes,'AES-GCM',false,['encrypt']);bytes.fill(0);
  const iv=crypto.getRandomValues(new Uint8Array(12)),ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(JSON.stringify(['records',...recordKey,1]))},key,new TextEncoder().encode(JSON.stringify({pending:true,assessment:{...assessment,source_pool_count:12},envelope:{client_version:1,attempt:{...pending,assessment_id:assessment.id},correction:null}})));
  await new Promise<void>((resolve,reject)=>{const tx=database.transaction('records','readwrite');tx.objectStore('records').put({schema_version:1,iv,ciphertext},recordKey);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});database.close();
  await h.report.show(h.host,h.options);
  assert(h.report.projection.subjects[1].pop.prior.id===pending.id&&h.report.projection.pending_count===1&&h.report.projection.completeness==='complete','full matching history inserts delayed middle result');
  await h.report.show(h.host,{...h.options,adapter:{...h.adapter,attempts:()=>Promise.reject(new Error('history unavailable'))}});
  assert(h.report.projection.subjects[1].pop.prior.id===row(1,6).id&&h.report.projection.completeness==='partial'&&h.host.textContent.includes('Comparison unavailable: complete matching history'),'partial cache cannot fabricate replacement pair');
  const cleanup=await new Promise<IDBDatabase>(resolve=>{const request=h.indexedDB.open('grade6-family-v1',3);request.onsuccess=()=>resolve(request.result);});
  await new Promise<void>(resolve=>{const tx=cleanup.transaction('records','readwrite');tx.objectStore('records').delete(recordKey);tx.oncomplete=()=>resolve();});cleanup.close();
  const refresh=h.host.children.find((element:Element)=>element.tagName==='button'&&element.textContent==='Refresh report');
  await click(refresh);
  assert(h.report.projection.pending_count===0&&!h.host.textContent.includes('Comparison unavailable: complete matching history'),'refresh removes acknowledged pending detail');
  h.report.clear();
});
Deno.test('Luna history refresh starts a new revision and rejects malformed rows',async()=>{
  const h=await harness('Math6_Q2_Review_Module_v1.0.0');let revision='2',malformed=false;
  h.adapter.attempts=async()=>({items:[malformed?{...row(3,8),percentage:99}:row(3,8)],next_cursor:null,revision,as_of:now});
  await h.report.show(h.host,h.options);
  const card=h.host.children.filter((element:Element)=>element.tagName==='article')[2];
  const history=card.children.find((element:Element)=>element.tagName==='button');
  await click(history);revision='3';await click(history);
  assert(card.textContent.includes('History snapshot revision 3')&&!card.textContent.includes('History unavailable'),'new history traversal can advance revision');
  malformed=true;await click(history);
  assert(card.textContent.includes('History unavailable')&&!card.textContent.includes('99.00%'),'malformed history never renders');
  h.report.clear();
});
