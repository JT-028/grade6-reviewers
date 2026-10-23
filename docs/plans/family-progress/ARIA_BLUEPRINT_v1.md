# ARIA BLUEPRINT v1.0 — Family progress and effort tracking

Date: 2026-10-22 (Asia/Manila). Inputs: confirmed REX_REPORT_v1 and ALEX_PLAN_v1.
Status: COMPLETE architecture; implementation, review, testing and deployment remain pending.

## 1. Decisions and verified service feasibility

Keep static GitHub Pages and all eight published reviewer filenames. Add one self-contained `family.html`, one Supabase Free project in Singapore, Supabase Auth for the single parent, Postgres private records, and one TypeScript Edge Function `family-api`. No Next.js, shared browser JavaScript file, Realtime subscription, storage bucket, email delivery service or background worker. Use native fetch, IndexedDB, Web Crypto and BroadcastChannel in the browser. Pin backend dependency versions during M1.

Public lessons and existing guest/local progress remain available. Explicit Family profile mode uses UUID identities and private server-authorized records. Existing client-side parent/admin passcodes never authorize family data. Keep Q1 and Q2 isolated.

Official limits checked on 2026-10-22: Free supports two active projects, 500MB database per project, 5GB egress and 50,000 Auth monthly active users; Edge Functions includes 500,000 invocations. One small-family project with batched updates fits these capabilities; this is a feasibility assessment, not an unlimited-capacity promise. No payment method, upgrade, paid addon or paid fallback is part of this design. Sources: [billing](https://supabase.com/docs/guides/platform/billing-on-supabase), [function pricing](https://supabase.com/docs/guides/functions/pricing).

Free projects can pause after low database activity over seven days. Parent resumes a paused project in Studio; the current documented restore window is one year. No synthetic keepalive jobs. Backend outage/quota failure leaves already-open work locally pending and prevents new private unlocks; public reading continues. Source: [pausing and restore](https://supabase.com/docs/guides/platform/free-project-pausing).

Free projects require owner-managed off-site exports; do not promise paid daily backup/restore features. Inspect usage before release and monthly thereafter. Source: [backup guidance](https://supabase.com/docs/guides/platform/backups).

## 2. Authentication and privacy

### Parent and device flow

- During authorized setup, provision exactly one strong-password, confirmed email/password Auth user through Studio or server-only admin createUser with `email_confirm:true`. Disable public signups and anonymous signups. Create a singleton family row tied to that immutable Auth UUID. No invites, magic links or email-reset UI; password recovery uses owner-controlled Studio/admin tooling. Password login itself requires no outgoing email. Sources: [createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser), [signup settings](https://supabase.com/docs/guides/auth/general-configuration).
- Default email delivery is limited to project-team addresses and currently two messages/hour; this architecture does not depend on it. A future emailed recovery flow needs a separately verified SMTP design. Source: [SMTP restrictions](https://supabase.com/docs/guides/auth/auth-smtp).
- Parent tokens use normal Supabase Auth password/refresh endpoints and tab sessionStorage. Logout clears tokens; parent UI locks after 30 minutes inactive. Every parent API request verifies the JWT using `auth.getUser(token)` then matches the verified UID to the provisioned owner. User metadata and browser-supplied roles/family IDs are never authority. A signed-in unprovisioned Auth user gets no family access.
- Device requests pairing online with a random UUID and SHA-256 digest of a locally generated random 256-bit polling secret. Server returns a random 80-bit base32 approval code, expiring in ten minutes. Parent enters the code, verifies the device label, selects allowed children and approves. Device polls every five seconds only while its pairing screen is visible.
- Claiming requires the polling secret. Server issues a random 256-bit device token; store only its SHA-256 hash server-side. Device stores the credential in IndexedDB. Approval expires after 90 days or immediate parent revocation. A claim is retryable until expiry: temporarily retain the issued token encrypted under backend PAIR_CLAIM_KEY, then purge claim material after expiry.
- Device credential allows only approved child IDs/display names and PIN unlock, never scores/history/goals/rewards. Parent sets a six-digit PIN per child, with no default. PIN change invalidates child sessions everywhere. Successful online unlock issues a random opaque child token scoped to device+child, expiring in eight hours. Every private request checks expiry, PIN version, device generation and revocation.
- Child token and unlocked cache key live only in memory/tab sessionStorage for same-tab page navigation. Profile switch/logout clears decrypted records/token/keys and broadcasts lock. Child UI locks after 15 minutes without interaction. Re-visible tabs recheck scope before displaying private records.
- Server PIN hashing: PBKDF2-HMAC-SHA256, 600,000 iterations, 16 random salt bytes, 32-byte result and backend-only pepper; constant-time comparison. Rate-limit before expensive derivation. Benchmark against Edge CPU limits during M1; do not lower hashing cost to pass. This selects native Web Crypto portability, not a claim of superiority over memory-hard hashing. Source: [OWASP storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
- Throttle transactionally: five failed PINs/device+child/15 minutes then 15-minute cooldown; ten failures/child/hour across devices. Pair creation five/hour/hashed source IP and 200/day globally; parent approvals ten/minute/owner UID. Return generic identity/PIN errors. Expired throttle/pair records are pruned on auth calls, no cron required. Quota attack may interrupt availability but must never bypass authorization.

### Offline boundary and encryption

Confirmed offline scope is continuing after connection loss in an already-open reviewer. Offline cold start, unlock after restart and offline PIN verification are not required. Require online unlock after restart/lock/expiry; public reading remains available. An unlocked tab continues locally until its eight-hour expiry. Expiry never deletes queued work.

Create one random 256-bit cache key per child/device, stored privately on the backend and returned only after that child's successful online unlock or explicit parent recovery. Encrypt per-child IndexedDB cache/outbox values with AES-GCM and a fresh random 96-bit nonce per value. Keep keys only in unlocked memory/sessionStorage; never persist child PINs or PIN verifiers. Next authorized unlock returns the same key to recover ciphertext. Logout/revocation/reset do not purge encrypted unsynced records.

PINs and encrypted caches protect ordinary UI switching; they cannot protect against an already-unlocked sibling, devtools/browser control, malicious same-origin scripts or compromised devices. Offline screens cannot be instantly remotely revoked. These are trusted household browsers. Grades/minutes are client-reported learning records, not tamper-proof exam evidence.

### Server boundary

Set family-api `verify_jwt=false` because routes accept parent JWTs, opaque device/child tokens or pairing credentials. This disables the platform precheck only: explicit per-route authentication is mandatory, deny by default. Parent JWTs are verified independently; device/child hashes resolved server-side. Never decode a JWT without verification. Source: [Edge auth](https://supabase.com/docs/guides/functions/auth).

Family tables live in non-exposed `private` schema, RLS enabled, no anon/authenticated policies or table/schema grants. Revoke PUBLIC/anon/authenticated execution on exposed functions. Provide one service-role-only transactional RPC `public.family_dispatch(operation,credential_context,payload)`; fixed empty search_path and fully qualified SQL names. RPC independently resolves token hashes or verified owner UID into ownership before any operation. Service credentials bypass RLS, so every operation requires explicit ownership predicates and composite foreign keys. Browser direct REST/RPC requests must fail, including with parent JWT. Sources: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [secret boundaries](https://supabase.com/docs/guides/functions/secrets).

CORS allows production https://jt-028.github.io and development http://127.0.0.1:8766 only. Origin is defense in depth, never identity. Authorization headers, no cookies, Cache-Control:no-store. Tokens never appear in URLs/logs/markup/exports. Render names as text; no user HTML. No third-party analytics or child identity in public URLs.

## 3. Storage contract

UUIDs are v4, timestamps UTC timestamptz/ISO8601, required unless `?`. All ownership FKs use RESTRICT; archive instead of deleting in v1. family is provisioned once. Composite family/child/device constraints prevent cross-family assignment. Server receipt timestamps default now().

| Table | Fields and database constraints |
|---|---|
| families | id UUID PK; owner_auth_id UNIQUE FK auth.users; timezone CHECK='Asia/Manila'; created_at |
| children | id PK; family_id FK; display_name trimmed1..40; pin_salt/hash bytea; pin_version>=1; archived_at?; created_at; UNIQUE(family_id,id) |
| devices | id PK; family_id FK; label1..60; token_hash UNIQUE; approved_at; expires_at; revoked_at?; generation>=1; last_seen_at?; UNIQUE(family_id,id) |
| device_children | PK(device_id,child_id); family_id; cache_key32bytes; composite FKs require same family |
| pair_requests | id PK; code_hash UNIQUE; poll_hash; expires_at; approved_family/device_id?; encrypted_claim?; claimed_at? |
| child_sessions | id PK; device_id+child_id FK device_children; token_hash UNIQUE; pin_version; device_generation; created_at; expires_at; revoked_at? |
| rate_windows | PK(scope,key_hash,window_start); failures>=0; blocked_until?; maximum24h retention |
| assessments | id text PK e.g. math:q2:pop:flashcards:v1; subject history/math/geography/language; quarter1/2; kind pop/exam; key; content_revision>=1; total>0; UNIQUE(subject,quarter,kind,key,content_revision) |
| attempts | id PK generated at start; child_id/device_id/assessment_id FKs; origin live/legacy; session_id?; started_at?; completed_at?; received_at; time_quality synced/client/legacy_unknown; first_correct; final_correct; answered_count; total; elapsed_ms?; timed_out; source_fingerprint?; CHECK 0<=first<=final<=total and 0<=answered<=total; live timestamps required; exam first=final; UNIQUE(child_id,source_fingerprint) when supplied |
| study_sessions | id PK; child_id/device_id FKs; subject; quarter; started_at; last_observed_at; ended_at?; end_kind? observed/inferred; close_reason? navigation/logout/idle/reload/expiry; last_seq>=0; received_at; end/last_observed>=start |
| study_intervals | PK(session_id,seq>=1); section_key; category learning/practice/pop/exam; start_at; end_at; active_ms1..60000; time_quality synced/client; end>start; duration<=60sec; active_ms=duration; session provides ownership/subject/quarter |
| task_completions | id PK; child_id/device_id FKs; subject; quarter; kind practice/pop; task_key; completed_at; attempt_id? FK; answered_count; total; practice=full set, pop=non-timeout attempt answered_count=total |
| goal_versions | id PK; child_id FK; effective_date; target_minutes1..240; created_at; UNIQUE(child_id,effective_date); no row means unset |
| daily_rewards | PK(child_id,local_date); goal_id FK; eligible_ms>=0; qualifying_completion_id FK; xp CHECK=25; badge_key CHECK='daily-effort'; awarded_at |
| xp_events | id PK; child_id FK; subject/quarter?; kind legacy_balance/module_award/daily_effort; amount>=0; source_key; occurred_at; UNIQUE(child_id,source_key); daily effort has null subject/quarter, others require both |
| module_state | PK(child_id,subject,quarter); completed_sections text[]; achievements text[]; best_streak>=0; updated_at; merge set unions/max, never overwrite durable attempts |
| legacy_imports | PK(child_id,module_key,legacy_profile_fingerprint); snapshot_digest; imported_at; no plaintext source blob |
| sync_events | PK(child_id,event_id); device_id FK; authorization_session_id FK child_sessions; type; payload_digest; accepted_at; immutable event receipt, no duplicate XP/action application |
| api_receipts | PK(principal_kind,principal_id,idempotency_key); operation; payload_digest; encrypted_response; created_at; expires_at; mutation replay record,24h retention; credential-bearing responses encrypted using PAIR_CLAIM_KEY |

Indexes: attempts(child_id,assessment_id,completed_at,id), sessions(child_id,started_at,id), intervals(start_at,end_at) plus sequence PK, completions(child_id,completed_at), goals(child_id,effective_date DESC), xp(child_id,subject,quarter), devices(family_id,revoked_at), child_sessions(token_hash). No full-text/geo index or per-row network fetch. Aggregate each child's bounded dashboard range in one request. Accept only known catalog/section/task keys. Client does not submit authoritative family IDs, grades, daily totals, rewards or XP balances.

## 4. API and offline synchronization

Base `${FAMILY_SUPABASE_URL}/functions/v1/family-api/v1`. Every response has api_version:1, server_time, request_id. Errors `{error:{code,message,retryable,details?},api_version,server_time,request_id}`. Statuses:400 shape,401 missing/expired,403 forbidden/revoked,404 inaccessible,409 conflicting ID/state,410 expired pairing,413 size,422 domain/time,429 throttle with Retry-After,503 unavailable. No traces or credential details.

Every mutation carries Idempotency-Key UUID. Same immutable ID+same canonical digest acknowledges; same ID+different payload rejects409 without overwrite. Event IDs deduplicate across batches. Limits100events/256KiB per sync; strings/schema bounded, unknown fields rejected. Route auth kind determines Bearer credential; never treat a parent token on a child route as a child selector.

| Route | Auth | Input → successful body, inside standard envelope |
|---|---|---|
| GET /health | none | → status:ok,min_client_version:1; no family IDs |
| POST /pair-requests | none+throttle | request_id,poll_hash,device_label →201 request_id,approval_code,expires_at |
| POST /pair-requests/:id/claim | polling secret | {} → status:pending OR approved,device_id,device_token,expires_at |
| POST /parent/pair-approvals | parent | approval_code,child_ids[],replace_device_id? →device_id,status:approved; replacement requires explicit owner selection |
| GET /device/children | device | →device_id,children[{id,display_name}],expires_at |
| POST /child/unlock | device | child_id,pin →child_session_token,expires_at,child,cache_key,bootstrap |
| POST /child/lock | child | {} →locked:true; local lock works offline |
| GET /child/bootstrap | child | →child,goal,today{study_ms,assessment_ms,qualifying_task,reward},module_states[],xp{module_totals[],effort_bonus,total},latest_attempts[],sync_revision |
| POST /child/sync | child | batch_id,client_version:1,events[] →accepted_ids[],duplicate_ids[],rejected[{id,code,retryable}],reward_updates[],module_states[],sync_revision |
| GET /child/progress | child | quarter,from,to →subjects[],sessions[],rewards[],synced_at; default30days,max90 |
| GET /child/attempts | child | assessment_id,cursor?,limit? →items[],next_cursor?; limit25,max100 |
| GET /parent/family | parent | →children[],devices[{id,label,approved_at,expires_at,revoked_at,child_ids[]}],timezone |
| POST /parent/children | parent | display_name,pin →201 child |
| PATCH /parent/children/:id | parent | display_name?,pin?,archived? →child; PIN change invalidates child sessions |
| PATCH /parent/devices/:id | parent | revoked:true OR child_ids[] →device; revocation increments generation and invalidates sessions |
| PUT /parent/children/:id/goal | parent | target_minutes,effective_date →goal; next Manila day except first configuration may apply today |
| GET /parent/children/:id/progress | parent | same query/result as child progress |
| GET /parent/children/:id/attempts | parent | same pagination as child attempts |
| POST /parent/legacy-imports | parent | child_id,module_key,legacy_profile_fingerprint,snapshot_digest,records[],legacy_xp,module_state →imported_ids[],duplicates[],warnings[] |
| POST /parent/devices/:id/local-recovery | parent | child_ids[] →keys[{child_id,cache_key}]; only explicit recovery on affected browser, never ordinary settings |
| GET /parent/export | parent | cursor? →domain data pages,next_cursor?; exclude tokens/PIN hashes/cache keys |

All event bodies contain immutable UUID id and type. Payloads:

Every event also carries authorization_session_id. Unlock returns child_session_id alongside its token; queue records retain that source session ID. A fresh same-child unlock may upload an old event after its originating session expires, but the server verifies the original session belonged to that child/device and event time lies in its issued eight-hour window. A revoked device cannot upload until parent recovery/reapproval; source authorization and parent reapproval are checked independently of client claims.

- attempt.completed: attempt{id,assessment_id,session_id?,started_at,completed_at,first_correct,final_correct,answered_count,total,elapsed_ms,timed_out}.
- session.opened: session{id,subject,quarter,started_at}.
- session.intervals: session_id,intervals[{seq,section_key,category,start_at,end_at,active_ms}],observed_at. No overlapping intervals within one session.
- session.closed: session_id,ended_at,end_kind,close_reason. End cannot precede latest interval. An inferred end may extend with a newer valid same-session checkpoint; observed close is terminal.
- task.completed: completion{id,subject,quarter,kind,task_key,completed_at,attempt_id?,answered_count,total}.
- module.award: subject,quarter,source_key,reason_code,amount,occurred_at. Source key is original action/attempt/question UUID, not new retry UUID. Known non-speed reasons only.
- module.state: subject,quarter,completed_sections[],achievements[],best_streak.

SQL sync obtains a child advisory lock, verifies ownership, orders opens→intervals→attempts/completions→closes→XP/state, and acknowledges only after commit. Invalid independent events may reject individually; dependent events also reject, never leave half-created records. Database failure rolls back and acknowledges nothing. Daily reward/XP insertion is in the same transaction, PK(child,date) the final race guard. Do not split atomic writes into independent REST requests.

IndexedDB grade6-family-v1 holds device credential, encrypted per-child caches/outbox and measuring-tab lease. Keys include child UUID,module,event UUID,version; names are not identity. Local completion/result projection/XP IDs/outbox save together before displaying saved. Storage failure persists a warning and offers recovery export; never claim saved/synced. Guest localStorage keys remain untouched.

Flush every60sec while unlocked, after quiz/practice completion, reconnect and ordinary navigation when possible. Ten-second fetch timeout; jittered2/5/15/30/60sec backoff then max5min. No unload/sendBeacon dependence. Remove only exact acknowledged IDs;401 re-unlock,403 preserve queue for owner recovery/reapproval,409 preserve conflicting item for review rather than minting another ID. Another child's session cannot upload/read this queue.

Parent visible dashboard polls30sec, no hidden polling. Show last synced/stale/pending labels and Refresh. Normal propagation is within30sec after successful upload, not instant push. Revocation rejects further server activity but preserves local ciphertext. Parent can reapprove the same device after explicitly reviewing its pending work; old credentials remain revoked and a new generation is issued.

## 5. Timing, dates, comparisons and rewards

### Active-time rules

- One session = one child+subject+quarter reviewer tab. Start on entering tracked learning/practice/assessment content; home/report/settings time is not study. End on reviewer navigation/logout/profile switch or15min continuously paused. Category changes split intervals, not sessions.
- Only visible, focused tab counts. Hide/blur pauses immediately. Trusted pointer/touch/key/scroll/answer/reveal/navigation/Still studying resets idle; animations/programmatic events do not.
- At5min without interaction pause and show accessible check-in. The preceding5min remains counted as reading allowance; no retroactive deletion. Resume only from check-in/new interaction, never backfill paused gaps. Label this an activity estimate.
- TTS and long reading use the same5min check-in. Background audio does not bypass visibility/focus rules.
- Sample performance.now() every5sec; gap>10sec means sleep/suspension, close at last observed sample and credit none of the gap. Persist local checkpoint every15sec and transitions. Abrupt process kill can lose up to15sec unpersisted time; label inferred ends.
- Combine adjacent same-category/section samples into intervals<=60sec for upload. Raw session active=sum intervals; paused=elapsed-active. Open end is In progress. Stale end is unconfirmed with last observed time, never invented exact finish.
- Next boot closes recovered unclosed session at its last durable observed timestamp, end_kind=inferred/reload. No gap credit. New content opens a new session.
- One measuring tab per child/browser: transactional IndexedDB lease, renew5sec, TTL15sec, BroadcastChannel notice. Losing lease stops measurement. No localStorage read-then-write lock.
- Across devices retain raw sessions; aggregate active time is interval union, never overlapping sum. Split overlap boundaries; attribute learning/practice before assessment, then earlier interval start/UUID as deterministic ties. Eligible learning/practice union is monotonic when late assessment data arrives. Label overlapping raw sessions and distinguish raw session time from deduplicated totals.

At unlock record server epoch+performance.now() anchor; refresh after sync. Same-tab page loads reuse last anchor+wall-clock delta until online reanchor and mark client time quality. Reject negative/oversized/out-of-session intervals and event times>2min future. Keep questionable events for review instead of silently moving dates. Intervals must fit the originating eight-hour authorization window; upload after expiry is allowed following fresh same-child unlock. Receipt time never replaces event time.

Family day is Asia/Manila on all devices. Split midnight intervals. Goal changes take effect next day; first configuration may apply today, carries forward until replaced. No default15min goal: show Parent has not set a study goal. Legacy time never qualifies. Late offline data uses its event day/goal, not upload day.

Reward requires daily union learning/practice>=target AND a full practice set or non-timeout fully answered pop quiz completed that same day. Exams, timed-out quizzes and legacy completions do not qualify. Exactly one badge daily-effort+25XP/child/day, atomic insert with child/day lock and unique key. Offline eligibility says Ready to sync; confirmed award waits for server. Already recorded awards are not retracted by late records; store the evidence used.

### Comparisons and preceding study

Match subject+quarter+kind+assessment key+content_revision. Shuffling does not change revision; scoring/content changes do. Sort known times by completed_at then UUID, never received order. Unknown legacy timestamps stay in separate legacy group and cannot be baseline. Recompute sequence when late offline attempts arrive.

Use raw fractions for percentage/deltas; display one decimal when needed. Percentage-point change=currentPct-previousPct; relative=100*(currentPct-previousPct)/previousPct. Existing DepEd grade functions keep their existing integer rounding/mapping. Pop trend uses first_correct, corrections final_correct separate; exams first=final. No baseline→No comparable previous attempt. Previous0→relative N/A.60→75 is+15pp/+25%;75→60 is-15pp/-20%.

Each attempt's Learning/practice before this attempt is same-subject/quarter eligible interval union after previous matching completion and before current attempt START. First tracked attempt uses earliest retained study to start, labeled with date range. Pop view may additionally show its section subset. Exclude assessment time, future study/other quarter. Unknown legacy start→Study window unavailable. Show effort/grade together without causation claims; high effort with flat/falling results suggests strategy/help, not laziness.

### XP and legacy migration

Keep each subject/quarter's existing RANKS/XP/achievements. New25XP is a separate family effort ledger; do not add it to eight subject balances/ranks. Family total=sum canonical eight module balances+effort bonus. Each module shows subject XP/rank and separate family effort bonus. Preserve old speed XP/badges as historical, remove future speed awards and result-screen claims. No hints/extra credit/grade change.

Existing non-speed awards remain: practice10, solver15, pop first-answer5/correction2, pop completion20, perfect completion50, exam10*correct. Capture source action ID once with local save; server allowlists reason/amount. Pop source key includes attempt+question+award class and cannot earn both first-answer and correction. Abandoned quiz question XP remains existing behavior. Daily source=daily-effort:date.

Parent maps old browser names to child explicitly; identical names never auto-map. Preview records, import idempotently, never delete old localStorage. Fingerprint original module/profile and each record's stable timestamp+assessment or canonical payload. Preserve available scores/dates after existing cap validation; unknown fields remain null, import timestamp separate. Original full overwritten history cannot be recovered.

Multi-device legacy snapshots merge completions/achievements union, streak max and old XP MAX per child/module, never sum. One legacy-balance XP event may increase only with parent-confirmed higher retained balance; live migration-era XP is a separate stream. Identical retained scores deduplicate; conflicting snapshots remain labeled legacy without invented chronology.

## 6. UI, files, setup and delivery

family.html contains parent login, pairing/unlock, child overview, parent child-selector, assessment/session details and settings. Add Family progress link to index without changing quarter tabs/default#q2. Reviewer adds family profile state, active/paused timer, sync indicator and trend link; guest local behavior remains. Wide dashboard four subject cards side-by-side, phones stacked; quarter filter defaultQ2. Separate quiz/exam matching rows; no combined average of unlike assessments or sibling ranking. Use accessible labels, keyboard check-ins, non-color trend text and reduced-motion rewards.

Planned Mason files: family.html; index and eight reviewers with duplicated inline helpers/version flag; supabase/config.toml; supabase/functions/family-api/{index,auth,validation,crypto}.ts; supabase/migrations; supabase/tests; tests/family; docs/plans/family-progress. Server TS may be modular; no shared browser .js. Preserve CRLF/published filenames/content constants. MathQ2 hooks: setUser/load/save around1958–2034, awardXP2359, activateTab2494, pop finish4856, exam finish5206, reminder studyMinutes5607. Other modules equivalent. Replace reminder-granted study minutes in private mode; keep break reminders. Update both report renderers, text/image exports and XP-earned display claims. Old latest-result structures are derived compatibility projections, not durable history.

Public inline config: FAMILY_ENABLED,FAMILY_SUPABASE_URL,FAMILY_SUPABASE_PUBLISHABLE_KEY,FAMILY_CLIENT_VERSION=1. Backend-only: Supabase secret/service credential,FAMILY_PIN_PEPPER,PAIR_CLAIM_KEY; private owner provisioning. Ignored local env, no real values in this document. Current Edge limits256MB memory,2sec CPU/request; benchmark PIN/batch. Source: [limits](https://supabase.com/docs/guides/functions/limits).

Mason next implements M1 ONLY when authorized: local schema/auth foundation, safe disabled config, family entry, parent setup instructions, pairing/PIN, private boundary tests. No remote account/setup/deployment is implicit. Integration requires owner-selected free project+provisioned parent; these are setup inputs, not open architecture decisions. Then M2 history/import/outbox, M3 timing, M4 dashboard, M5 goals/rewards. Keep production FAMILY_ENABLED false until all required capabilities pass. Backendv1 additive migration/function deploy precedes enabling static client; reject unsupported API versions explicitly.

Required acceptance evidence:

- Auth: public key/direct REST/RPC/unsigned JWT/non-owner/sibling/unapproved device cannot read/write private data; device token cannot fetch scores; expired/revoked/PIN-reset sessions rejected.
- Pair/PIN: wrong/expired codes/secrets, lost claim response, brute-force cooldown, profile switch and restart behave per contract; no offline cold unlock.
- Sync: two retakes retained, retry/concurrent replay deduped, conflicting ID preserved, wrong-child queue denied, storage failure never claims success.
- Timing: reading/TTS check-in, hide/blur, idle close, sleep/crash/reload, sections, two tabs/devices, raw versus union totals and inferred end labels.
- Dates/trends: Manila midnight/goal versions/late upload/clock anomalies; first/zero/legacy baseline, decrease/unchanged, first-answer versus corrections, no future study association.
- Rewards/import: one25XP/day across eight modules/devices; target-only/completion-only/exam minutes no award; oldXP preserved and max-deduped; names explicitly mapped; missing time stays unknown.
- Regression: eight URLs, quarter isolation/constants/grade mapping/unlocks/report exports/true-false/CRLF/self-contained public operation.
- Failure: paused/quota backend preserves pending work, no paid upgrade or auth bypass; recover after owner resumes.

Luna ponytail→thermos→pstack PASS and local conventional commit on feature branch with required Grok coauthor, then Quinn PASS on that commit. Any later code changes require relevant rechecks. Dep only pushes after both gates and user handoff; never auto-chain.

Verified Pages source: legacy build, main branch at root, HTTPS enforced. Push main triggers Pages; local commit/successful push does not prove live. Dep records reviewed commit/backend version/Pages status and live version, uses BrowserOS neo with dedicated test family data to verify public lessons, child attempt/time/reward upload and parent view. Root docs become public after push: never put secrets/real student records here.

Before release and weekly while used, owner exports private domain data and takes CLI database dump encrypted/off-site/outside repo; repeat after material imports. Manual runbook, no new automation. Logs only requestID/route/outcome/latency/event counts, no names/PIN/tokens/answers/payloads. Parent sees latest sync/errors; owner checks quota/failures.

Rollback: disable family flag if privacy failing, keep public reviewers, normal revert commit/redeploy last compatible client; retain backendv1/additive tables and all queues/localStorage. No destructive downgrade/delete to restore UI. Parent recovery retrieves keys through authenticated explicit action. Credential leak requires revoke/rotate/reapprove without deleting records. Reverify deployed commit/private boundaries.

## 7. Handoff

[ARIA] v1.0 — 2026-10-22
Status: COMPLETE
Key outputs: Pages+Supabase Free architecture, private auth/device/PIN/data contracts, attempts/offline/timing/reward/import invariants, acceptance/release/rollback gates.
Blockers: No open product/architecture decision. M1 integration needs owner-controlled free project and parent provisioning; none created here.
Next recommended: Await user review, then Mason M1 only when authorized. No application code, service, commit, push or deployment in this handoff.
