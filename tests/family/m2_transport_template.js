// FAMILY_TRANSPORT_START
const FAMILY_BRIDGE_URL = 'https://hzgvhkgsxvodmdurysvf.supabase.co';
const FAMILY_BRIDGE_KEY = 'sb_publishable_8x8A8Xja_0SzOwZQVSEqnQ_8g7zEWcg';
const FAMILY_MANIFEST_DIGEST = '7135e117adf31f172c1cbc0f4710374d4fd0891645e42a77eacdc69d6ce612c6';
const FAMILY_PRODUCTION_ADAPTER = (() => {
  let catalog = null, flushing = false, authorization = null;
  const canonical = value => Array.isArray(value) ? '['+value.map(canonical).join(',')+']' : value && typeof value === 'object' ? '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}' : JSON.stringify(value);
  const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),byte=>byte.toString(16).padStart(2,'0')).join('');
  const fail = (message,status=503,code='M2_UNAVAILABLE',retryable=false) => Object.assign(new Error(message),{status,code,retryable});
  async function call(path, session, signal, body, id) {
    if (!FAMILY_HISTORY_ENABLED || !session?.token || Date.parse(session.expires_at)<=Date.now()) throw fail('Unlock online to continue.',401,'UNLOCK_REQUIRED');
    const controller = new AbortController(), timer=setTimeout(()=>controller.abort(),10000);
    const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});
    if(signal?.aborted)controller.abort();
    try {
      const response=await fetch(FAMILY_BRIDGE_URL+'/functions/v1/family-api/v1'+path,{method:body?'POST':'GET',headers:{apikey:FAMILY_BRIDGE_KEY,Authorization:'Bearer '+session.token,...(body?{'Content-Type':'application/json','Idempotency-Key':id}:{})},body:body?JSON.stringify(body):undefined,signal:controller.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
      const text=await response.text();
      if(text.length>262144)throw fail('Invalid history response.');
      const value=JSON.parse(text);
      if(value.api_version!==1 || typeof value.request_id!=='string' || !Number.isFinite(Date.parse(value.server_time)))throw fail('Invalid history response.');
      if(!response.ok)throw fail(value.error?.message || 'Family history unavailable.',response.status,value.error?.code || 'SERVICE_UNAVAILABLE',response.status===429 || response.status>=500);
      const {api_version,request_id,server_time,...payload}=value;
      return {payload,server_time};
    } catch(error) {
      if(error.status)throw error;
      throw fail('Connect online to retry family history.',0,'NETWORK_UNAVAILABLE',true);
    } finally {clearTimeout(timer);signal?.removeEventListener('abort',abort);}
  }
  async function bootstrap(session,role,child,signal) {
    const started=performance.now();
    const access=await call(role==='parent'?'/parent/family':'/child/bootstrap',session,signal);
    const manifest=await call('/'+role+'/catalog',session,signal);
    const value=manifest.payload;
    if(value.contract_version!==1 || value.catalog_version!==1 || value.catalog_digest!==FAMILY_MANIFEST_DIGEST || !Array.isArray(value.assessments) || value.assessments.length!==64 || new TextEncoder().encode(JSON.stringify(value)).length>65536 || await hash(canonical(value.assessments))!==FAMILY_MANIFEST_DIGEST)throw fail('Assessment catalog version unavailable.');
    const keys=['id','module_key','subject','quarter','kind','set_key','content_revision','catalog_digest','total','grade_policy','label','retired'].sort();
    let previous='';
    for(const row of value.assessments) {
      const module=/^(History|Math|Geography|Language)6_(Q2_)?Review_Module_v1\.0\.0$/.exec(row.module_key);
      if(canonical(Object.keys(row).sort())!==canonical(keys) || !module || module[1].toLowerCase()!==row.subject || (module[2]?2:1)!==row.quarter || row.id<=previous || row.id!==`${row.module_key}:${row.kind}:${row.set_key}:r${row.content_revision}` || !['pop','exam'].includes(row.kind) || !Number.isInteger(row.total) || row.total<1 || row.total>100 || row.content_revision!==1 || !/^[a-f0-9]{64}$/.test(row.catalog_digest) || row.grade_policy!=='deped-descriptor-rounded-v1' || typeof row.retired!=='boolean' || typeof row.label!=='string')throw fail('Assessment catalog version unavailable.');
      previous=row.id;
    }
    const profile=role==='parent'?access.payload.children?.find(row=>row.id===child.id && !row.archived):access.payload.child;
    if(!profile || profile.id!==child.id || (role==='child' && (!access.payload.capabilities?.includes('assessment_history_v1') || !access.payload.capabilities?.includes('progress_summary_v1') || access.payload.contract_version!==1 || access.payload.catalog_version!==1 || access.payload.catalog_digest!==FAMILY_MANIFEST_DIGEST)))throw fail('Family history is not available.');
    catalog=value.assessments;
    const verified={...access.payload,child:{id:profile.id,display_name:profile.display_name},capabilities:['family_access','assessment_history_v1','progress_summary_v1'],contract_version:1,catalog_version:1,catalog_digest:FAMILY_MANIFEST_DIGEST,clock:{server_epoch:Date.parse(access.server_time),monotonic_at:performance.now(),wall_at:Date.now(),round_trip_ms:performance.now()-started}};
    if(role==='child')authorization={token:session.token,sessionId:session.child_session_id,childId:child.id,expires:session.expires_at,access:verified};
    return verified;
  }
  function path(role,child,type){return role==='parent'?'/parent/children/'+encodeURIComponent(child.id)+'/'+type:'/child/'+type;}
  async function flush(session,guard) {
    if(flushing || document.hidden || navigator.onLine===false || !guard.current())return;
    flushing=true;
    const database=()=>new Promise((resolve,reject)=>{
      const open=indexedDB.open('grade6-family-v1',3);
      let blocked=false;
      open.onupgradeneeded=()=>{for(const store of ['credentials','records','outbox','metadata','reports'])if(!open.result.objectStoreNames.contains(store))open.result.createObjectStore(store);};
      open.onerror=()=>reject(new Error('Private storage unavailable.'));
      open.onblocked=()=>{blocked=true;reject(new Error('Close older family tabs and reload.'));};
      open.onsuccess=()=>{if(blocked){open.result.close();return;}open.result.onversionchange=()=>open.result.close();resolve(open.result);};
    });
    const epoch=session.access_epoch;
    try {
      await bootstrap(session,'child',session.child);
      if(!guard.current())return;
      const db=await database();
      const entries=await new Promise((resolve,reject)=>{
        const tx=db.transaction(['outbox','metadata'],'readonly'),access=tx.objectStore('metadata').get('access_epoch'),entries=[];
        const request=tx.objectStore('outbox').openCursor(IDBKeyRange.bound([session.child.id],[session.child.id,[]]));
        request.onsuccess=()=>{const cursor=request.result;if(cursor && entries.length<25){entries.push({key:cursor.key,value:cursor.value});cursor.continue();}};
        tx.oncomplete=()=>{db.close();if((access.result||0)!==epoch)reject(fail('Access changed.',401,'ACCESS_CHANGED'));else resolve(entries);};tx.onerror=tx.onabort=()=>{db.close();reject(new Error('Pending results unavailable.'));};
      });
      const bytes=new Uint8Array(session.cache_key.match(/../g).map(pair=>parseInt(pair,16)));
      let key;try{key=await crypto.subtle.importKey('raw',bytes,'AES-GCM',false,['encrypt','decrypt']);}finally{bytes.fill(0);}
      const decode=async(store,entry)=>{if(entry.value?.schema_version!==1)throw new Error('Unsupported pending record.');const additionalData=new TextEncoder().encode(canonical([store,...entry.key,1]));return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:entry.value.iv,additionalData},key,entry.value.ciphertext)));};
      for(const entry of entries){
        if(!guard.current() || document.hidden)return;
        const envelope=await decode('outbox',entry);
        if(!guard.current())return;
        if(envelope.attempt.id!==entry.key[2] || !catalog.some(row=>row.id===envelope.attempt.assessment_id && row.module_key===entry.key[1]))throw new Error('Assessment version unavailable.');
        const ack=(await call('/child/attempts',session,undefined,envelope,envelope.attempt.id)).payload;
        if(ack.attempt_id!==envelope.attempt.id || !['accepted','duplicate'].includes(ack.status) || ack.provenance!=='server' || typeof ack.revision!=='string' || !/^[1-9]\d*$/.test(ack.revision) || !Number.isFinite(Date.parse(ack.received_at)) || Object.keys(ack).length!==5)throw new Error('Invalid acknowledgement.');
        if(!guard.current())return;
        const reader=await database();
        const stored=await new Promise((resolve,reject)=>{const tx=reader.transaction('records','readonly'),request=tx.objectStore('records').get(entry.key);tx.oncomplete=()=>{reader.close();resolve(request.result);};tx.onabort=tx.onerror=()=>{reader.close();reject(new Error('Result unavailable.'));};});
        const record=await decode('records',{key:entry.key,value:stored});
        if(canonical(record.envelope)!==canonical(envelope))throw new Error('Pending result changed.');
        Object.assign(record,{pending:false,provenance:'server',received_at:ack.received_at,revision:ack.revision});
        const iv=crypto.getRandomValues(new Uint8Array(12)),additionalData=new TextEncoder().encode(canonical(['records',...entry.key,1]));
        const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData},key,new TextEncoder().encode(canonical(record)));
        if(!guard.current())return;
        const writer=await database();
        await new Promise((resolve,reject)=>{const tx=writer.transaction(['records','outbox','metadata'],'readwrite'),access=tx.objectStore('metadata').get('access_epoch');let changed=false;access.onsuccess=()=>{changed=(access.result||0)!==epoch;if(changed || !guard.current()){tx.abort();return;}tx.objectStore('records').put({schema_version:1,iv,ciphertext},entry.key);tx.objectStore('outbox').delete(entry.key);};tx.oncomplete=()=>{writer.close();resolve();};tx.onerror=tx.onabort=()=>{writer.close();reject(changed?fail('Access changed.',401,'ACCESS_CHANGED'):new Error('Acknowledgement was not saved.'));};});
      }
      if(guard.current())guard.status(entries.length===25?'Synced 25 results. Sync remaining to continue.':entries.length?'Pending results synced.':'No pending results on this device.',entries.length===25);
    } catch(error){if(guard.current()){if(error.status===401 || error.status===403)guard.lock();else guard.status(error.code==='M2_UNAVAILABLE'?'Not synced — family history or assessment version unavailable; saved result retained.':error.status===409 || error.status===422?'Not synced — saved result needs attention; original record retained.':'Saved on this device — not synced. Connect online and retry.',true,error);}}
    finally{flushing=false;}
  }
  return {get catalog(){return catalog;},catalogDigest:FAMILY_MANIFEST_DIGEST,bootstrap,flush,invalidate(){authorization=null;},
    async authorize(session,assessment){let access;try{access=await bootstrap(session,'child',session.child);}catch(error){if(error.status!==0 || !authorization || authorization.token!==session.token || authorization.sessionId!==session.child_session_id || authorization.childId!==session.child.id || Date.parse(authorization.expires)<=Date.now())throw error;access=authorization.access;}const row=catalog.find(row=>row.id===assessment.id);if(!row || row.catalog_digest!==assessment.catalog_digest || row.total!==assessment.total)throw fail('Assessment version unavailable.');return {catalog_version:1,catalog_digest:row.catalog_digest,clock:access.clock};},
    async progress(session,role,child,quarter,signal){return (await call(path(role,child,'progress')+'?quarter='+quarter,session,signal)).payload;},
    async attempts(session,role,child,filters,signal){return (await call(path(role,child,'attempts')+'?'+new URLSearchParams(Object.entries(filters).map(([key,value])=>[key,String(value)])),session,signal)).payload;},
  };
})();
// FAMILY_TRANSPORT_END
