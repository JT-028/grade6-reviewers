// FAMILY_REPORT_START
const FAMILY_HISTORY_ENABLED = false;
const FAMILY_REPORT_ENABLED = false;
const FAMILY_JPEG_ENABLED = false;
const familyReport = (() => {
  const canonicalJson = value => Array.isArray(value) ? '[' + value.map(canonicalJson).join(',') + ']' : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonicalJson(value[key])).join(',') + '}' : JSON.stringify(value);
  const sha256 = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, '0')).join('');
  function resultGrade(correct, total) {
    const rounded_pct = Math.round(100 * correct / total);
    const [letter,name] = rounded_pct >= 90 ? ['O','Outstanding'] : rounded_pct >= 85 ? ['VS','Very Satisfactory'] : rounded_pct >= 80 ? ['S','Satisfactory'] : rounded_pct >= 75 ? ['FS','Fairly Satisfactory'] : ['DNME','Did Not Meet Expectations'];
    return {rounded_pct,letter,name};
  }
  const utc = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString()===value;
  /* M2_PROGRESS_CORE */
  let owner = null, generation = 0;
  const node = (tag, text) => { const element = document.createElement(tag); if (text !== undefined) element.textContent = text; return element; };
  function clear(message = 'Unlock online to view your private report.') {
    generation++;
    if (!owner) return;
    owner.controller.abort();
    if(owner.expiryTimer)clearTimeout(owner.expiryTimer);
    owner.key = null; owner.projection = null; owner.session = null;
    owner.host.replaceChildren(node('p', message));
    owner = null;
  }
  function db() {
    return new Promise((resolve,reject) => {
      const request = indexedDB.open('grade6-family-v1',3);
      request.onupgradeneeded = () => { for (const store of ['credentials','records','outbox','metadata','reports']) if (!request.result.objectStoreNames.contains(store)) request.result.createObjectStore(store); };
      request.onblocked = () => reject(new Error('Close older family tabs and reload.'));
      request.onerror = () => reject(new Error('Private storage unavailable.'));
      request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); clear('Storage changed. Unlock online again.'); }; resolve(request.result); };
    });
  }
  async function epoch() {
    const database = await db();
    return await new Promise((resolve,reject) => {
      const tx = database.transaction('metadata','readonly'), request = tx.objectStore('metadata').get('access_epoch');
      tx.oncomplete = () => { database.close(); resolve(request.result || 0); };
      tx.onerror = tx.onabort = () => { database.close(); reject(new Error('Private access check failed.')); };
    });
  }
  function current(state) {
    return owner === state && state.generation === generation && state.session && Date.parse(state.session.expires_at) > Date.now() && (!state.isCurrent || state.isCurrent());
  }
  async function cache(state, projection, sequence) {
    if (state.role !== 'child' || !current(state)) return;
    const keyBytes = new Uint8Array(state.session.cache_key.match(/../g).map(pair => parseInt(pair,16)));
    try { state.key = await crypto.subtle.importKey('raw',keyBytes,'AES-GCM',false,['encrypt','decrypt']); } finally { keyBytes.fill(0); }
    const key = [state.child.id,'quarter-'+state.quarter], iv = crypto.getRandomValues(new Uint8Array(12));
    const additionalData = new TextEncoder().encode(canonicalJson(['reports',key,1]));
    const ciphertext = await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData},state.key,new TextEncoder().encode(canonicalJson({projection,catalog:state.catalog,confirmed_at:projection.last_confirmed_at})));
    if (!current(state) || state.sequence !== sequence) return;
    const database = await db();
    await new Promise((resolve,reject) => {
      const tx = database.transaction(['metadata','reports'],'readwrite'), access = tx.objectStore('metadata').get('access_epoch');
      access.onsuccess = () => { if (!current(state) || state.sequence !== sequence || (access.result || 0) !== state.epoch) { tx.abort(); return; } tx.objectStore('reports').put({schema_version:1,iv,ciphertext},key); };
      tx.oncomplete = () => { database.close(); resolve(); };
      tx.onerror = tx.onabort = () => { database.close(); reject(new Error('Report not saved on this device.')); };
    });
  }
  async function pendingResults(state) {
    if (state.role !== 'child') return [];
    const database = await db();
    const encrypted = await new Promise((resolve,reject)=>{
      const tx = database.transaction(['records','metadata'],'readonly'), store = tx.objectStore('records'), keys = store.getAllKeys(), values = store.getAll(), access = tx.objectStore('metadata').get('access_epoch');
      tx.oncomplete = () => { database.close(); if((access.result || 0)!==state.epoch || !current(state))reject(new Error('Access changed'));else resolve(keys.result.map((key,index)=>({key,value:values.result[index]})).filter(row=>Array.isArray(row.key)&&row.key[0]===state.child.id)); };
      tx.onerror = tx.onabort = () => {database.close();reject(new Error('Private storage unavailable'));};
    });
    const bytes = new Uint8Array(state.session.cache_key.match(/../g).map(pair=>parseInt(pair,16)));
    let key; try { key = await crypto.subtle.importKey('raw',bytes,'AES-GCM',false,['decrypt']); } finally {bytes.fill(0);}
    const rows = [];
    for(const entry of encrypted) {
      if(!current(state)) return [];
      if(entry.value.schema_version!==1)throw new Error('Unsupported encrypted record');
      const additionalData = new TextEncoder().encode(canonicalJson(['records',...entry.key,1]));
      const plaintext = await crypto.subtle.decrypt({name:'AES-GCM',iv:entry.value.iv,additionalData},key,entry.value.ciphertext);
      const record = JSON.parse(new TextDecoder().decode(plaintext));
      if (!record.pending || record.assessment.quarter!==state.quarter) continue;
      const attempt = record.envelope.attempt, assessment = record.assessment;
      if(attempt.id!==entry.key[2] || assessment.module_key!==entry.key[1] || !state.catalog.some(row=>row.id===assessment.id && row.catalog_digest===assessment.catalog_digest && row.total===attempt.total))throw new Error('Invalid pending record');
      const {id,module_key,subject,quarter,kind,set_key,content_revision,label,retired,grade_policy}=assessment;
      const identity={id,module_key,subject,quarter,kind,set_key,content_revision,label,retired,grade_policy};
      rows.push(reportResult({id:attempt.id,child_id:state.child.id,assessment:identity,first_correct:attempt.first_correct,total:attempt.total,answered_count:attempt.answered_count,completed_at:attempt.completed_at,time_quality:attempt.time_quality,administered_fingerprint:attempt.administered_fingerprint,received_at:attempt.completed_at || new Date().toISOString(),percentage:resultPercentage(attempt.first_correct,attempt.total),grade:resultGrade(attempt.first_correct,attempt.total),correction:record.envelope.correction ? {...record.envelope.correction,total:attempt.total} : null},state.catalog));
    }
    return rows;
  }
  async function overlay(state, progress) {
    reportProjection(progress,false,state.catalog);
    state.pending = [];
    const pending = await pendingResults(state);
    if(!pending.length)return reportProjection(progress,false,state.catalog);
    state.pending = pending;
    try {
      let cursor, revision, rows = [];
      do {
        const page = await state.adapter.attempts(state.session,state.role,state.child,{quarter:state.quarter,limit:100,...(cursor?{cursor}:{})},state.controller.signal);
        if(!current(state) || page.revision!==progress.revision || (revision && revision!==page.revision) || !Array.isArray(page.items))throw new Error('Incomplete matching history');
        revision=page.revision;rows.push(...page.items.map(row=>reportResult(row,state.catalog)));cursor=page.next_cursor;
      } while(cursor);
      if(rows.some(row=>row.child_id!==state.child.id || row.assessment.quarter!==state.quarter))throw new Error('Invalid history scope');
      const ids = new Set(rows.map(row=>row.id)), unique = pending.filter(row=>!ids.has(row.id));
      state.pending = [];
      return reportProjection(progressFromResults({...progress,rows:[...rows,...unique],pending_count:unique.length,provenance:unique.length?'encrypted_cache':progress.provenance}),false,state.catalog);
    } catch(error) {
      if(error.status===401 || error.status===403)throw error;
      return reportProjection({...progress,pending_count:pending.length,completeness:'partial'});
    }
  }
  const date = value => value ? new Date(value).toLocaleString('en-PH',{timeZone:'Asia/Manila'}) + ' Asia/Manila' : 'Unknown completion date';
  function resultLines(row, title) {
    const group = node('div');
    group.append(node('h4',title+' · '+row.assessment.label+' · '+row.assessment.set_key+' · revision '+row.assessment.content_revision), node('p',row.first_correct+'/'+row.total+' · '+row.percentage.toFixed(2)+'% · '+row.grade.rounded_pct+'% '+row.grade.letter+' — '+row.grade.name), node('p',(row.time_quality === 'anchored' ? 'Completed: ' : 'Reported: ')+date(row.completed_at)));
    if (row.correction) group.append(node('p','After corrections: '+row.correction.final_correct+'/'+row.correction.total+' · '+date(row.correction.captured_at)+' (baseline unchanged)'));
    return group;
  }
  function draw(state, projection) {
    if (!current(state)) return;
    const host = state.host; host.replaceChildren(); host.style.cssText = 'overflow-wrap:anywhere;max-width:100%;';
    host.append(node('h2',projection.child.display_name+' — Quarter '+projection.quarter+' report card'),node('p','Originating reviewer: '+state.origin),node('p','Selected quarter summary — latest and prior per subject and assessment type'),node('p',(projection.provenance === 'local_fixture' ? 'Local demonstration. ' : '')+(projection.stale ? 'Stale — connection lost. ' : '')+(projection.completeness === 'partial' ? 'Partial report. ' : '')+'As of '+date(projection.as_of)+' · Last confirmed: '+(projection.last_confirmed_at ? date(projection.last_confirmed_at) : 'None')+' · Pending on this device: '+projection.pending_count+' — not synced'));
    const label = node('label','Report quarter '), select = node('select'); select.setAttribute('aria-label','Report quarter');
    for (const quarter of [1,2]) { const option = node('option','Quarter '+quarter); option.value = String(quarter); option.selected = quarter === state.quarter; select.append(option); }
    select.addEventListener('change',()=>{state.onQuarter?.(Number(select.value));show(state.host,{...state.options,quarter:Number(select.value)});}); label.append(select); host.append(label);
    const retry = node('button','Refresh report'); retry.type = 'button'; retry.addEventListener('click',()=>load(state,true)); host.append(retry);
    if(state.pending?.length) {
      host.append(node('h3','Pending results on this device — not synced'),node('p','Comparison unavailable: complete matching history could not be loaded. Confirmed results below remain separate.'));
      for(const row of state.pending)host.append(resultLines(row,'Pending result'));
    }
    for (const subject of projection.subjects) for (const kind of ['pop','exam']) {
      const summary = subject[kind], card = node('article'); card.style.cssText = 'border:1px solid #aaa;border-radius:8px;padding:16px;margin:16px 0;background:#fff;color:#17212b;';
      card.append(node('h3',subject.subject[0].toUpperCase()+subject.subject.slice(1)+' · '+(kind === 'pop' ? 'Pop quiz' : 'Practice exam')));
      const labels = {empty:'No results recorded for this quarter.',first_result:'First result',unchanged:'Unchanged',improved:'Improved',declined:'Declined'};
      card.append(node('p',summary.availability === 'chronology_unavailable' ? 'Reported result; completion order unavailable ('+summary.chronology_count+')' : labels[summary.state]));
      if (summary.latest) card.append(resultLines(summary.latest,'Latest'));
      if (summary.prior) card.append(resultLines(summary.prior,'Prior comparable result'));
      if (summary.chronology_example) card.append(resultLines(summary.chronology_example,'Reported result; completion order unavailable'));
      if (summary.percentage_points !== null) card.append(node('p',(summary.percentage_points > 0 ? '+' : '')+summary.percentage_points.toFixed(2)+' percentage points · '+(summary.relative_percent === null ? 'Relative change unavailable: prior score is zero' : (summary.relative_percent > 0 ? '+' : '')+summary.relative_percent.toFixed(1)+'% relative change')));
      if (summary.latest) card.append(node('p',summary.message));
      const history = node('button','View '+subject.subject+' '+kind+' history'); history.type = 'button';
      const detail = node('div'); detail.setAttribute('aria-live','polite');
      let cursor, sequence = 0, revision;
      history.addEventListener('click', async () => {
        const requestSequence = ++sequence; history.disabled = true;
        try {
          const page = await state.adapter.attempts(state.session,state.role,state.child,{quarter:state.quarter,subject:subject.subject,kind,limit:25,...(cursor ? {cursor} : {})},state.controller.signal);
          if (!current(state) || sequence !== requestSequence) return;
          const historyEpoch=await epoch();
          if(!current(state) || sequence !== requestSequence)return;
          if (historyEpoch !== state.epoch) { clear(); return; }
          if (!Array.isArray(page.items) || page.items.some(row=>{reportResult(row,state.catalog);return row.child_id!==state.child.id || row.assessment.quarter!==state.quarter || row.assessment.subject!==subject.subject || row.assessment.kind!==kind;}) || (cursor && revision !== page.revision)) throw new Error('Invalid history scope.');
          if (!cursor) detail.replaceChildren(node('p','History snapshot revision '+page.revision+' · '+date(page.as_of)));
          revision = page.revision;
          for (const row of page.items) detail.append(resultLines(row,row.time_quality === 'anchored' ? 'Recorded attempt' : 'Reported result; completion order unavailable'));
          if (!page.items.length) detail.append(node('p','No recorded attempts.'));
          cursor = page.next_cursor; history.textContent = cursor ? 'Load more history' : 'Refresh history';
        } catch (error) { if(current(state)) {if(error.status===401 || error.status===403){const lock=state.onLock;clear();lock?.();}else detail.append(node('p','History unavailable. Retry online.'));} }
        finally { if(current(state)) history.disabled = false; }
      });
      card.append(history,detail); host.append(card);
    }
    const jpeg = node('button','Prepare JPEG report card'); jpeg.disabled = true; host.append(jpeg,node('p','JPEG preparation is not available in this local statistics slice.'));
    const status = node('p',state.notice || 'Report loaded.'); status.setAttribute('role','status'); host.append(status);
  }
  async function load(state, refresh = false) {
    if (!current(state)) return;
    const sequence = ++state.sequence, previous = state.projection;
    if (!previous || !refresh) state.host.replaceChildren(node('p','Checking private access and loading report…'));
    try {
      const access = await state.adapter.bootstrap(state.session,state.role,state.child,state.controller.signal);
      if (!current(state) || sequence !== state.sequence) return;
      if (!access.capabilities?.includes('assessment_history_v1') || !access.capabilities?.includes('progress_summary_v1') || access.contract_version !== 1 || access.child.id !== state.child.id || access.catalog_digest !== state.catalogDigest) throw new Error('Family history is not available.');
      const bootstrapEpoch=await epoch();
      if(!current(state) || sequence !== state.sequence)return;
      if (bootstrapEpoch !== state.epoch) { clear(); return; }
      const progress = await state.adapter.progress(state.session,state.role,state.child,state.quarter,state.controller.signal);
      if (!current(state) || sequence !== state.sequence) return;
      if (progress.child.id !== state.child.id || progress.quarter !== state.quarter || progress.catalog_digest !== state.catalogDigest || (previous && BigInt(progress.revision) < BigInt(previous.revision))) throw new Error('Invalid report scope.');
      let projection = await overlay(state,progress);
      const responseEpoch=await epoch();
      if(!current(state) || sequence !== state.sequence)return;
      if (responseEpoch !== state.epoch) { clear(); return; }
      state.projection = projection;
      state.notice = '';
      try { await cache(state,projection,sequence); } catch { if (current(state)) state.notice = 'Report loaded; encrypted report cache was not saved. Retry online.'; }
      if (!current(state) || sequence !== state.sequence) return;
      draw(state,projection);
      if (state.onAuthorized) state.onAuthorized();
    } catch (error) {
      if (!current(state) || sequence !== state.sequence) return;
      if (error.status === 401 || error.status === 403) { const lock = state.onLock; clear(); lock?.(); return; }
      if (previous && navigator.onLine === false) { state.projection = {...previous,stale:true}; state.notice = 'Previously authorized report; offline remote revocation cannot be checked.'; draw(state,state.projection); }
      else { state.projection = null; state.key = null; state.host.replaceChildren(node('p','Family history is not available. Connect online and retry.'), retryButton(state)); }
    }
  }
  function retryButton(state) { const button = node('button','Retry report'); button.type='button'; button.addEventListener('click',()=>load(state)); return button; }
  async function show(host, options) {
    clear();
    const state = {...options,options,host,session:options.session,child:options.child,quarter:options.quarter,generation,sequence:0,projection:null,key:null,controller:new AbortController()}; owner = state;
    if(state.session)state.expiryTimer=setTimeout(()=>{if(current(state)||owner===state){const lock=state.onLock;clear('Private session expired. Unlock online again.');lock?.();}},Math.max(0,Date.parse(state.session.expires_at)-Date.now()));
    host.replaceChildren(node('p','Checking private access…'));
    try {
      if (!FAMILY_HISTORY_ENABLED || !FAMILY_REPORT_ENABLED || !state.adapter || !state.session || Date.parse(state.session.expires_at) <= Date.now()) throw new Error('Unlock required');
      state.epoch = await epoch();
      if (!current(state)) return;
      if (state.role === 'child' && state.session.access_epoch !== state.epoch) { clear(); state.onLock?.(); return; }
      if (!current(state)) return;
      await load(state);
    } catch { if (current(state)) host.replaceChildren(node('p','Family history is not available. Unlock online to retry.')); }
  }
  function suspend() {
    if (!owner) return;
    const state = owner, options = state.options, host = state.host;
    clear('Private report hidden. Rechecking access online…');
    if (!document.hidden) show(host,options);
    else owner = null;
  }
  function offline() { if(owner && current(owner) && owner.projection) { owner.projection={...owner.projection,stale:true};owner.notice='Previously authorized report; offline remote revocation cannot be checked.';draw(owner,owner.projection); } }
  return {show,clear,suspend,offline,core:{compareResults,progressFromResults,reportProjection,academicDigest},get projection(){return owner?.projection || null;}};
})();
// FAMILY_REPORT_END
