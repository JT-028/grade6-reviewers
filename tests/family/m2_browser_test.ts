import vm from "node:vm";
import { m2BrowserFixture } from "./m2_browser_fixture.ts";
import { IDBFactory } from "npm:fake-indexeddb@6.2.4";
import { inventory } from "./m2_catalog_inventory.ts";
import { validateEnvelope } from "../../supabase/functions/family-api/m2-contract.ts";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
function element() {
  return {
    innerHTML: "",
    textContent: "",
    style: { cssText: "" },
    children: [] as any[],
    events: new Map<string, () => void>(),
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {},
    remove() {},
    addEventListener(name: string, fn: () => void) {
      this.events.set(name, fn);
    },
    appendChild(child: any) {
      this.children.push(child);
    },
    replaceChildren(...children: any[]) {
      this.children = children;
    },
  };
}
async function harness(module_key: string, enabled = true, fixture?: { html: string; fetcher: typeof fetch }) {
  const source = (fixture?.html || await Deno.readTextFile(new URL(`../../${module_key}.html`, import.meta.url)))
    .replace(/\r/g, "");
  new vm.Script(source.match(/<script>([\s\S]*?)<\/script>/)![1]);
  const catalog = (await inventory()).filter((row) => row.module_key === module_key);
  const storage = new Map<string, string>();
  const nodes = new Map<string, ReturnType<typeof element>>();
  const document = {
    hidden: false,
    body: element(),
    addEventListener() {},
    createElement: element,
    createTextNode: (text: string) => ({ textContent: text }),
    querySelectorAll: () => [],
    getElementById(id: string) {
      if (!nodes.has(id)) nodes.set(id, element());
      return nodes.get(id)!;
    },
  };
  const session = {
    token: "b".repeat(64),
    cache_key: "c".repeat(64),
    child: { id: "20000000-0000-4000-8000-000000000001", display_name: "Synthetic A" },
    child_session_id: "50000000-0000-4000-8000-000000000001",
    access_epoch: 0,
    expires_at: new Date(Date.now() + 3600000).toISOString(),
  };
  storage.set("grade6-family-child-v1", JSON.stringify(session));
  const callbacks: (() => void)[] = [], guestWrites: string[] = [];
  const context = vm.createContext({
    crypto,
    fetch: fixture?.fetcher,
    AbortSignal,
    TextEncoder,
    Date,
    Uint8Array,
    performance,
    Promise,
    indexedDB: new IDBFactory(),
    document,
    window: { addEventListener() {} },
    sessionStorage: {
      getItem: (key: string) => storage.get(key),
      removeItem: (key: string) => storage.delete(key),
    },
    localStorage: { setItem: (_key: string, value: string) => guestWrites.push(value) },
    storageKey: () => "synthetic-guest",
    setTimeout: (callback: () => void, delay: number) => {
      if (delay < 10000) callbacks.push(callback);
      return 0;
    },
    clearInterval() {},
    currentUser: "Synthetic guest",
    progress: {},
    loadProgress: () => ({}),
    ENCOURAGEMENTS: ["Keep going"],
    TRY_AGAIN: ["Try again"],
    closePopQuizModal() {},
    subjectQuestionPool: () =>
      Array.from(
        { length: 20 },
        (_, n) => ({ q: `Sample ${n}`, opts: ["right", "wrong"], ans: 0 }),
      ),
    examQuestionPool: () =>
      Array.from({ length: 70 }, (_, n) => ({ q: `Exam ${n}`, opts: ["right", "wrong"], ans: 0 })),
    sampleItems: (items: unknown[], total: number) => items.slice(0, total),
    varyQuestionFormat: (q: any) => ({ ...q }),
    shuffleQuestionOptions: (q: any) => ({ ...q }),
    fingerprintQuestions: () => "fixture",
    startPopQuizTimer() {},
    startExamTimer() {},
    renderPopQuestion() {},
    renderExamQuestion() {},
    awardXP() {},
    unlockAchievement() {},
    saveProgress() {},
    allModulesComplete: () => false,
    refreshAllUI() {},
    burstConfetti() {},
    gradeColorCss: () => "black",
    formatGrade: (grade: any) => grade.name,
    fixtureAdapter: {
      authorize: (_session: unknown, assessment: any) =>
        Promise.resolve({
          catalog_version: 1,
          catalog_digest: assessment.catalog_digest,
          clock: {
            server_epoch: Date.now(),
            monotonic_at: performance.now(),
            wall_at: Date.now(),
            round_trip_ms: 1,
          },
        }),

    },
  });
  const getFunction = (name: string) => {
    const start = source.indexOf(`function ${name}(`),
      next = source.indexOf("\nfunction ", start + 1);
    assert(start >= 0 && next > start, `Actual function exists: ${name}`);
    return source.slice(start, next).split("\nlet progress =")[0];
  };
  let helpers = source.slice(
    source.indexOf("// FAMILY_M2_START"),
    source.indexOf("// FAMILY_M2_END"),
  );
  if (enabled) {
    helpers = helpers.replace("const FAMILY_ENABLED = false;", "const FAMILY_ENABLED = true;")
      .replace(
        "const FAMILY_LOCAL_ADAPTER = null;",
        "const FAMILY_LOCAL_ADAPTER = fixtureAdapter;",
      );
  }
  vm.runInContext(
    helpers + "\nlet pq=null,exam=null;\n" +
      [
        "startPopQuiz",
        "finishPopQuiz",
        "actuallyStartExam",
        "finishExam",
        "answerPop",
        "gradeFromPercent",
        "gradeFromScores",
        "escExam",
        "saveProgress",
      ].map(getFunction).join("\n"),
    context,
  );
  const run = (code: string) => vm.runInContext(code, context);
  async function settled(capture: any) {
    for (let count = 0; capture?.saving && count < 100; count++) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    assert(!capture?.saving, "Save must settle");
  }
  async function records(store = "records") {
    const db = await run("familyDatabase()");
    return await new Promise<any[]>((resolve, reject) => {
      const tx = db.transaction(store, "readonly"), request = tx.objectStore(store).getAll();
      tx.oncomplete = () => {
        db.close();
        resolve(request.result);
      };
      tx.onerror = () => reject(tx.error);
    });
  }
  async function decrypt(capture: any, record: any, store = "records") {
    const key = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(32).fill(204),
      "AES-GCM",
      false,
      ["decrypt"],
    );
    const aad = run(
      `familyCanonical(${JSON.stringify([store, session.child.id, module_key, capture.id, 1])})`,
    );
    return JSON.parse(
      new TextDecoder().decode(
        await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: record.iv, additionalData: new TextEncoder().encode(aad) },
          key,
          record.ciphertext,
        ),
      ),
    );
  }
  return {
    run,
    session,
    storage,
    nodes,
    callbacks,
    guestWrites,
    settled,
    records,
    decrypt,
  };
}

Deno.test("M2-A actual pop/exam finalizer wiring, immutable encrypted retention in all eight reviewers", async () => {
  for (const module_key of new Set((await inventory()).map((row) => row.module_key))) {
    const h = await harness(module_key);
    h.run("startPopQuiz('flashcards')");
    const first = h.run("pq.familyCapture");
    await first.ready;
    h.run(
      "pq.firstAttemptScore=12; pq.finalScore=20; pq.attempts.fill(1); finishPopQuiz(false); finishPopQuiz(false);",
    );
    await h.settled(first);
    assert(
      first.saved && (await h.records()).length === 1,
      "One completed pop result, repeat finalizer latched",
    );
    const encrypted = (await h.records())[0];
    assert(
      Object.keys(encrypted).sort().join() === "ciphertext,iv,schema_version" &&
        encrypted.iv.length === 12,
      "Only encrypted values stored",
    );
    const plain = await h.decrypt(first, encrypted);
    validateEnvelope(plain.envelope, (await inventory()).filter(row => row.module_key === module_key), {
      id: h.session.child_session_id, child_id: h.session.child.id,
      device_id: "40000000-0000-4000-8000-000000000001",
      issued_at: new Date(Date.now() - 3600000).toISOString(),
      expires_at: h.session.expires_at, revoked: false,
    }, new Date().toISOString());
    assert(
      plain.envelope.attempt.first_correct === 12 &&
        plain.envelope.correction.final_correct === 20 && plain.percentage === 60 &&
        plain.grade.letter === "DNME",
      "Actual baseline remains12/20 after corrections",
    );
    assert((await h.records("outbox")).length === 1, "Record and outbox committed together");
    h.run("startPopQuiz('flashcards')");
    const retake = h.run("pq.familyCapture");
    await retake.ready;
    h.run("pq.firstAttemptScore=16; pq.finalScore=20; pq.attempts.fill(1); finishPopQuiz(false)");
    await h.settled(retake);
    assert(
      first.id !== retake.id && (await h.records()).length === 2,
      "Retake retained independently",
    );
    h.run("actuallyStartExam(1)");
    const exam = h.run("exam.familyCapture");
    await exam.ready;
    h.run("finishExam(false)");
    await h.settled(exam);
    assert(
      exam.saved && exam.frozen.attempt.first_correct === 0 &&
        exam.frozen.attempt.answered_count === 0 && exam.frozen.attempt.total === 70,
      "Existing zero-answer Save & Exit baseline preserved",
    );
    assert((await h.records()).length === 3, "Pop retakes and exam distinct");
    assert(
      [first, retake, exam].every(capture => /^[a-f0-9]{64}$/.test(capture.fingerprint)),
      "Semantic sample fingerprint emitted for each result",
    );
    assert(h.guestWrites.length === 0, "Private results never enter guest localStorage");
    const status = h.nodes.get("familyCaptureStatus")!.children[0].textContent;
    assert(
      status.includes("not synced") && !status.includes("Synced to"),
      "Device-only success label",
    );
  }
});
Deno.test("M2-A aborted IndexedDB transaction retries same frozen attempt/time and retains earlier rows", async () => {
  const h = await harness("Math6_Q2_Review_Module_v1.0.0");
  h.run("startPopQuiz('practice')");
  const capture = h.run("pq.familyCapture");
  await capture.ready;
  h.run(
    `globalThis.originalDatabase=familyDatabase; familyDatabase=async()=>{const db=await originalDatabase();const transaction=db.transaction.bind(db);db.transaction=(names,mode)=>{const tx=transaction(names,mode);if(Array.isArray(names)&&names.includes('records'))queueMicrotask(()=>tx.abort());return tx;};return db;}`
      .replace("queueMicrotask(()=>tx.abort())", "Promise.resolve().then(()=>tx.abort())"),
  );
  h.run("pq.firstAttemptScore=10;pq.finalScore=20;pq.attempts.fill(1);finishPopQuiz(false)");
  await h.settled(capture);
  assert(
    !capture.saved && (await h.records()).length === 0 && (await h.records("outbox")).length === 0,
    "Abort acknowledges neither store",
  );
  const frozenTime = capture.frozen.attempt.completed_at;
  h.run("familyDatabase=originalDatabase");
  await h.run("familyPersist(pq.familyCapture)");
  assert(
    capture.saved && capture.frozen.attempt.completed_at === frozenTime &&
      (await h.records()).length === 1,
    "Retry same immutable result",
  );
});
Deno.test("M2-A disabled/abandoned capture, stale callback and access epoch rejection", async () => {
  const disabled = await harness("History6_Review_Module_v1.0.0", false);
  disabled.run(
    "startPopQuiz('flashcards');pq.firstAttemptScore=12;pq.finalScore=20;pq.attempts.fill(1);finishPopQuiz(false)",
  );
  assert(
    (await disabled.records()).length === 0 && disabled.run("pq.familyCapture") === null,
    "Public guest never queues private records",
  );
  const h = await harness("History6_Review_Module_v1.0.0");
  h.run("startPopQuiz('flashcards')");
  const abandoned = h.run("pq.familyCapture");
  await abandoned.ready;
  assert((await h.records()).length === 0 && !abandoned.frozen, "Unfinalized quiz has no record");
  h.run("answerPop(0, {classList:{add(){}}})");
  const delayed = h.callbacks.shift()!;
  h.run("startPopQuiz('practice')");
  const newer = h.run("pq.familyCapture");
  await newer.ready;
  delayed();
  assert(h.run("pq.idx") === 0, "Old answer callback cannot advance new attempt");
  await h.run(
    "(async()=>{const db=await familyDatabase();await new Promise(resolve=>{const tx=db.transaction('metadata','readwrite');tx.objectStore('metadata').put(1,'access_epoch');tx.oncomplete=()=>{db.close();resolve();};});})()",
  );
  h.run("pq.firstAttemptScore=12;pq.finalScore=20;pq.attempts.fill(1);finishPopQuiz(false)");
  await h.settled(newer);
  assert(
    !newer.saved && (await h.records()).length === 0 && !h.storage.has("grade6-family-child-v1") && h.run("pq") === null,
    "Epoch change blocks stale scope transaction",
  );
  h.run("familyClear()");
  assert(newer.session === null && newer.frozen === null, "Lock clears plaintext capture");
});
Deno.test("M2-A semantic fingerprints ignore order, include actual statement and correct answer", async () => {
  const h = await harness("Language6_Q2_Review_Module_v1.0.0");
  const a = h.run(
    `familyCanonical(familySampleItems([{q:'Meaning?',opts:['yes','no'],ans:0},{q:'Other?',opts:['a','b'],ans:1}]))`,
  );
  const b = h.run(
    `familyCanonical(familySampleItems([{q:'Other?',opts:['b','a'],ans:0},{q:'Meaning?',opts:['no','yes'],ans:1,_answered:true}]))`,
  );
  const c = h.run(
    `familyCanonical(familySampleItems([{q:'Meaning? "no"',opts:['True','False'],ans:1},{q:'Other?',opts:['a','b'],ans:1}]))`,
  );
  assert(a === b && a !== c, "Shuffles preserve sample provenance; generated statements differ");
});

Deno.test("M2-A missed lock message invalidates credentials even without an active capture", async () => {
  const h = await harness("Math6_Q2_Review_Module_v1.0.0");
  await h.run("(async()=>{const db=await familyDatabase();await new Promise(resolve=>{const tx=db.transaction('metadata','readwrite');tx.objectStore('metadata').put(1,'access_epoch');tx.oncomplete=()=>{db.close();resolve();};});})()");
  await h.run("familyCheckEpoch()");
  assert(!h.storage.has("grade6-family-child-v1"), "Missed broadcast removes private token and cache key");
  h.run("startPopQuiz('practice')");
  assert(h.run("pq.familyCapture") === null, "Stale session cannot start another private capture");
});
Deno.test("M2-A actual fixture permits offline completion after authorization but not offline unlock", async () => {
  const module_key = "Math6_Q2_Review_Module_v1.0.0";
  const handler = await m2BrowserFixture();
  const response = await handler(new Request(`http://127.0.0.1:8766/__family_m2_fixture__/${module_key}.html`));
  assert(response?.ok, "Dedicated fixture page is available");
  const html = await response.text();
  let offline = false, requests = 0;
  const fetcher = (async (input: string | URL | Request, init?: RequestInit) => {
    requests++;
    if (offline) throw new TypeError("Network unavailable");
    const result = await handler(new Request(new URL(String(input), "http://127.0.0.1:8766"), init));
    if (!result) throw new Error("Unexpected fixture request");
    return result;
  }) as typeof fetch;
  const h = await harness(module_key, true, { html, fetcher });
  h.run("startPopQuiz('practice')");
  const capture = h.run("pq.familyCapture");
  await capture.ready;
  assert(requests === 1, "Private capture requires online authorization");
  offline = true;
  h.run("pq.firstAttemptScore=12;pq.finalScore=20;pq.attempts.fill(1);finishPopQuiz(false)");
  await h.settled(capture);
  assert(capture.saved && (await h.records()).length === 1 && (await h.records("outbox")).length === 1, "Authorized offline completion commits ciphertext and pending envelope");
  assert(requests === 1, "Local save sends no completion request");
  const locked = await harness(module_key, true, { html, fetcher });
  locked.run("startPopQuiz('practice')");
  const unauthorized = locked.run("pq.familyCapture");
  await unauthorized.ready.catch(() => undefined);
  locked.run("pq.firstAttemptScore=12;pq.finalScore=20;pq.attempts.fill(1);finishPopQuiz(false)");
  await locked.settled(unauthorized);
  assert(!unauthorized.saved && (await locked.records()).length === 0, "Offline cold authorization cannot save a private record");
});

Deno.test("M2-A stale epoch reads cannot clear a newer session", async () => {
  for (const operation of ["focus", "begin"]) {
    const h = await harness("Math6_Q2_Review_Module_v1.0.0");
    h.run("globalThis.resolveEpoch=null; familyEpoch=()=>new Promise(resolve=>{resolveEpoch=resolve;})");
    const pending = operation === "focus" ? h.run("familyCheckEpoch()") : (h.run("startPopQuiz('practice')"), h.run("pq.familyCapture.ready"));
    const newer = { ...h.session, token: "d".repeat(64), child_session_id: "50000000-0000-4000-8000-000000000002", access_epoch: 1 };
    h.run("familyClear()");
    h.storage.set("grade6-family-child-v1", JSON.stringify(newer));
    h.run("resolveEpoch(1)");
    await pending.catch(() => undefined);
    assert(JSON.parse(h.storage.get("grade6-family-child-v1") || "null")?.token === newer.token, "Old epoch read cannot remove the newer session");
  }
});

Deno.test("M2-A start-time epoch mismatch and expiry erase private credentials", async () => {
  const stale = await harness("History6_Q2_Review_Module_v1.0.0");
  stale.run("familyEpoch=async()=>1;startPopQuiz('practice')");
  const rejected = stale.run("pq?.familyCapture");
  await rejected.ready.catch(() => undefined);
  assert(!stale.storage.has("grade6-family-child-v1") && rejected.session === null && stale.run("pq") === null, "Start-time access mismatch clears credentials and private quiz");
  const expired = await harness("History6_Q2_Review_Module_v1.0.0");
  expired.storage.set("grade6-family-child-v1", JSON.stringify({ ...expired.session, expires_at: new Date(Date.now() + 5000).toISOString() }));
  expired.run("startPopQuiz('practice')");
  const capture = expired.run("pq.familyCapture");
  await capture.ready;
  expired.storage.set("grade6-family-child-v1", JSON.stringify({ ...expired.session, expires_at: new Date(Date.now() - 1).toISOString() }));
  expired.callbacks.shift()!();
  assert(!expired.storage.has("grade6-family-child-v1") && capture.session === null && expired.run("pq") === null, "Expiry clears credentials and private quiz");
});
