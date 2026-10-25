// FAMILY_M2_START
const FAMILY_ENABLED = false;
const FAMILY_LOCAL_ADAPTER = null; // Dedicated local fixture server injects this; no public toggle.
const FAMILY_CATALOG = /* GENERATED */ [];
const FAMILY_SESSION_KEY = 'grade6-family-child-v1';
let familyAccessGeneration = 0;
const familyCaptures = new Set();
const familyLockChannel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('grade6-family-lock-v1') : null;
function familyCanonical(value) {
  if (Array.isArray(value)) return '[' + value.map(familyCanonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + familyCanonical(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
async function familyHash(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}
function familySampleItems(questions) {
  return questions.map(item => ({
    q: String(item.q), type: item.type === 'fill' ? 'fill' : 'choice',
    options: Array.isArray(item.opts) ? item.opts.map(String).sort() : [],
    answers: item.type === 'fill' ? [...new Set((item.accept || [item.ans]).map(answer => String(answer).toLowerCase()))].sort() : [String(item.opts[item.ans])]
  })).map(familyCanonical).sort();
}
function familySession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(FAMILY_SESSION_KEY) || 'null');
    return session && /^[a-f0-9]{64}$/i.test(session.token) && /^[a-f0-9]{64}$/i.test(session.cache_key) && session.child?.id && session.child_session_id && Date.parse(session.expires_at) > Date.now() ? session : null;
  } catch { return null; }
}
function familyCurrent(capture) {
  const current = familySession();
  return !!capture && capture.generation === familyAccessGeneration && capture.session && current && current.token === capture.session.token && current.child.id === capture.session.child.id && current.child_session_id === capture.session.child_session_id;
}
function familyStatus(message, retryCapture) {
  if (!FAMILY_ENABLED || !FAMILY_LOCAL_ADAPTER) return;
  let node = document.getElementById('familyCaptureStatus');
  if (!node) {
    node = document.createElement('aside');
    node.id = 'familyCaptureStatus';
    node.setAttribute('role', 'status');
    node.style.cssText = 'padding:12px;text-align:center;background:#fff4d4;color:#302813';
    document.body.appendChild(node);
  }
  node.replaceChildren(document.createTextNode(message));
  if (retryCapture) {
    const button = document.createElement('button');
    button.textContent = 'Retry saving';
    button.addEventListener('click', () => familyPersist(retryCapture));
    node.appendChild(button);
  }
}
function familyDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('grade6-family-v1', 3);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of ['credentials', 'records', 'outbox', 'metadata', 'reports']) if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
    };
    request.onblocked = () => reject(new Error('Close older family tabs and reload to save.'));
    request.onerror = () => reject(new Error('Browser storage is unavailable.'));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); familyClear(); };
      resolve(db);
    };
  });
}
async function familyEpoch() {
  const db = await familyDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readonly');
    const request = tx.objectStore('metadata').get('access_epoch');
    tx.oncomplete = () => { db.close(); resolve(request.result || 0); };
    tx.onerror = tx.onabort = () => { db.close(); reject(new Error('Access check failed.')); };
  });
}
async function familyCheckEpoch() {
  if (!FAMILY_ENABLED || !FAMILY_LOCAL_ADAPTER) return;
  const session = familySession(), generation = familyAccessGeneration;
  if (!session) { familyInvalidate(); return; }
  let epoch;
  try { epoch = await familyEpoch(); } catch {}
  if (generation !== familyAccessGeneration || familySession()?.token !== session.token) return;
  if (epoch === undefined || session.access_epoch !== epoch || [...familyCaptures].some(capture => capture.epoch !== undefined && capture.epoch !== epoch)) familyInvalidate();
}
function familyClear() {
  if (typeof familyReport !== 'undefined') familyReport.clear();
  familyAccessGeneration++;
  for (const capture of familyCaptures) { capture.session = null; capture.frozen = null; }
  familyCaptures.clear();
  document.getElementById('familyCaptureStatus')?.remove();
  if (window.familyPrivateCaptureActive) {
    pq = null; exam = null;
    if (window._popTimer) clearInterval(window._popTimer);
    if (window._examTimer) clearInterval(window._examTimer);
    document.getElementById('popquizOverlay')?.classList.remove('show');
    for (const id of ['popquizModal', 'examActive', 'reportCardWrap', 'reportCardWrapMain']) document.getElementById(id)?.replaceChildren();
    progress = loadProgress(currentUser);
    window.familyPrivateCaptureActive = false;
    refreshAllUI();
  }
}
async function familyInvalidate() {
  familyClear();
  try { sessionStorage.removeItem(FAMILY_SESSION_KEY); } catch { /* No plaintext fallback. */ }
}
familyLockChannel?.addEventListener('message', event => {
  if (['lock', 'parent-lock', 'switch'].includes(event.data?.type)) familyInvalidate();
});
window.addEventListener('focus', familyCheckEpoch);
window.addEventListener('pagehide', familyClear);
document.addEventListener('visibilitychange', () => { if (!document.hidden) familyCheckEpoch(); });
function familyBegin(kind, setKey, questions) {
  if (!FAMILY_ENABLED || !FAMILY_LOCAL_ADAPTER || !questions.length) return null;
  const session = familySession();
  const assessment = FAMILY_CATALOG.find(row => row.kind === kind && row.set_key === setKey);
  if (!session || !assessment || questions.length !== assessment.total) return null;
  window.familyPrivateCaptureActive = true;
  const capture = { id: crypto.randomUUID(), generation: familyAccessGeneration, session, assessment, frozen: null, saved: false, saving: false, epoch: undefined };
  const semanticSample = familyCanonical(familySampleItems(questions));
  capture.ready = (async () => {
    capture.epoch = await familyEpoch();
    if (!familyCurrent(capture)) throw new Error('Access changed.');
    if (session.access_epoch !== capture.epoch) { familyInvalidate(); throw new Error('Access changed.'); }
    const verified = await FAMILY_LOCAL_ADAPTER.authorize(session, assessment);
    if (!familyCurrent(capture) || capture.session.access_epoch !== capture.epoch || verified.catalog_version !== 1 || verified.catalog_digest !== assessment.catalog_digest) throw new Error('Access or assessment version changed.');
    capture.fingerprint = await familyHash(semanticSample);
    capture.clock = verified.clock || null;
    return verified;
  })();
  capture.ready.catch(() => { if (familyCurrent(capture)) familyStatus('Not saved — unlock an authorized local profile and retry.'); });
  familyCaptures.add(capture);
  setTimeout(() => { if (familyCaptures.has(capture) && !familyCurrent(capture)) familyInvalidate(); }, Math.max(0, Date.parse(session.expires_at) - Date.now()));
  return capture;
}
function familyCompletion(capture) {
  const now = Date.now(), mono = performance.now();
  const anchor = capture.clock;
  const valid = anchor && Number.isFinite(anchor.server_epoch) && Number.isFinite(anchor.monotonic_at) && Number.isFinite(anchor.wall_at) && Number.isFinite(anchor.round_trip_ms) && anchor.round_trip_ms >= 0 && anchor.round_trip_ms <= 10000 && mono >= anchor.monotonic_at && Math.abs((now - anchor.wall_at) - (mono - anchor.monotonic_at)) <= 2000;
  const completed = valid ? new Date(anchor.server_epoch + mono - anchor.monotonic_at).toISOString() : new Date(now).toISOString();
  return { completed_at: completed, time_quality: valid ? 'anchored' : 'client_unverified' };
}
function familyFinalize(capture, firstCorrect, answeredCount, total, finalCorrect) {
  if (!capture || capture.frozen || !familyCurrent(capture)) return;
  if (![firstCorrect, answeredCount, total].every(Number.isInteger) || total !== capture.assessment.total || firstCorrect < 0 || firstCorrect > answeredCount || answeredCount > total || (capture.assessment.kind === 'pop' && (answeredCount !== total || !Number.isInteger(finalCorrect) || finalCorrect < firstCorrect || finalCorrect > total))) {
    familyStatus('Not saved — this result is incomplete or invalid.'); return;
  }
  const completion = familyCompletion(capture);
  capture.frozen = Object.freeze({ client_version: 1, attempt: Object.freeze({
    id: capture.id, authorization_session_id: capture.session.child_session_id,
    assessment_id: capture.assessment.id, first_correct: firstCorrect, answered_count: answeredCount,
    total, finalized: true, ...completion,
  }), ...(capture.assessment.kind === 'pop' ? { correction: Object.freeze({ final_correct: finalCorrect, captured_at: completion.completed_at }) } : {}) });
  familyPersist(capture);
}
async function familyPersist(capture) {
  if (!familyCurrent(capture) || !capture.frozen || capture.saved || capture.saving) return;
  capture.saving = true;
  try {
    await capture.ready;
    if (!familyCurrent(capture)) throw new Error('Access changed.');
    const envelope = { ...capture.frozen, attempt: { ...capture.frozen.attempt, administered_fingerprint: capture.fingerprint } };
    const childId = capture.session.child.id;
    const keyBytes = new Uint8Array(capture.session.cache_key.match(/../g).map(pair => parseInt(pair, 16)));
    const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
    keyBytes.fill(0);
    const recordKey = [childId, capture.assessment.module_key, capture.id];
    const encrypt = async (store, value) => {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const additionalData = new TextEncoder().encode(familyCanonical([store, ...recordKey, 1]));
      const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData }, key, new TextEncoder().encode(familyCanonical(value)));
      return { schema_version: 1, iv, ciphertext };
    };
    const grade = gradeFromScores(envelope.attempt.first_correct, envelope.attempt.total);
    const encryptedRecord = await encrypt('records', { envelope, assessment: capture.assessment, percentage: Number((100 * envelope.attempt.first_correct / envelope.attempt.total).toFixed(2)), grade: { rounded_pct: grade.pct, letter: grade.letter, name: grade.name }, provenance: 'encrypted_cache', pending: true });
    const encryptedPending = await encrypt('outbox', envelope);
    if (!familyCurrent(capture)) throw new Error('Access changed.');
    const db = await familyDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(['records', 'outbox', 'metadata'], 'readwrite');
      const metadata = tx.objectStore('metadata');
      const epoch = metadata.get('access_epoch');
      epoch.onsuccess = () => {
        if (!familyCurrent(capture)) { tx.abort(); return; }
        if ((epoch.result || 0) !== capture.epoch) { familyInvalidate(); tx.abort(); return; }
        tx.objectStore('records').put(encryptedRecord, recordKey);
        tx.objectStore('outbox').put(encryptedPending, recordKey);
        metadata.put(1, 'schema_version');
      };
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onabort = tx.onerror = () => { db.close(); reject(new Error('The browser did not commit this result.')); };
    });
    if (!familyCurrent(capture)) return;
    capture.saved = true;
    familyStatus('Saved on this device — not synced. Local demonstration.');
  } catch {
    if (familyCurrent(capture)) { familyStatus('Not saved — local storage or access check failed.', capture); }
  } finally { capture.saving = false; }
}
let familyReportQuarter = null;
function familyRenderPrivateReport(wrap) {
  if (!FAMILY_HISTORY_ENABLED || !FAMILY_REPORT_ENABLED || !FAMILY_LOCAL_ADAPTER) return false;
  const session = familySession();
  if (!session) {
    wrap.replaceChildren(document.createTextNode('Unlock online to view your private report.'));
    const link = document.createElement('a'); link.href = 'family.html#q'+(FAMILY_CATALOG[0]?.quarter || 2); link.textContent = 'Open family unlock'; wrap.appendChild(link);
    return true;
  }
  familyReport.show(wrap,{role:'child',session,child:session.child,quarter:familyReportQuarter || FAMILY_CATALOG[0].quarter,origin:FAMILY_CATALOG[0].module_key,catalog:FAMILY_LOCAL_ADAPTER.catalog,catalogDigest:FAMILY_LOCAL_ADAPTER.catalogDigest,adapter:FAMILY_LOCAL_ADAPTER,isCurrent:()=>familySession()?.token === session.token,onQuarter:quarter=>{familyReportQuarter=quarter;},onLock:familyInvalidate,onAuthorized:()=>{
    document.getElementById('welcomeOverlay')?.classList.add('hidden');
    const label = document.getElementById('reportTabBtn'); if(label) label.textContent = '📋 '+session.child.display_name+"'s Report Card";
  }});
  return true;
}
if (FAMILY_LOCAL_ADAPTER) {
  let reportActivityAt = Date.now();
  for (const type of ['pointerdown','keydown','scroll','touchstart']) document.addEventListener(type,event=>{if(event.isTrusted)reportActivityAt=Date.now();},{passive:true});
  if (typeof setInterval === 'function') setInterval(()=>{const stored=familySession();if(stored && Date.now()-reportActivityAt >= 15*60000)familyInvalidate();else if(!stored)familyInvalidate();},10000);
  const reopen = () => {
    if (!FAMILY_HISTORY_ENABLED || !FAMILY_REPORT_ENABLED) return;
    familyReport.clear('Private report hidden. Checking online access…');
    if (!document.hidden && document.querySelector('.tab-btn[data-tab="report"]')?.classList.contains('active')) renderReportCardMain();
  };
  window.addEventListener('focus',reopen);
  document.addEventListener('visibilitychange',reopen);
  window.addEventListener('online',reopen);
  window.addEventListener('offline',()=>familyReport.offline());
  window.addEventListener('load',()=>{if(typeof FAMILY_REPORT_ENABLED !== 'undefined' && FAMILY_HISTORY_ENABLED && FAMILY_REPORT_ENABLED && location.hash === '#report'){document.getElementById('welcomeOverlay')?.classList.add('hidden');document.getElementById('reportTabBtn')?.click();renderReportCardMain();}});
}
// FAMILY_M2_END
