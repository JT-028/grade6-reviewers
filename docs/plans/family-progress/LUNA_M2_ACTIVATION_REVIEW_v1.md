# Luna M2 activation review v1

2026-10-25, Asia/Manila. Gate PASS. Ready for Quinn.
Reviewed source commit `08f0d64c164be99d52d0648ae5c586d7e099d16f`.
Base `6f810dc0bff45172d13de00d440e2496c3114c4a`.
Branch `codex/m2-production-bridge`. The separate audit commit contains this report and the plugin audit.

## What this change does

All nine clients enable private history and reports. The eight reviewers enable family capture. Online authentication, capability, contract, exact 64-row catalog and digest checks still control private access. JPEG stays disabled and local adapters stay null. The foreground transport now creates the five existing IndexedDB stores during an additive version-3 upgrade and closes a connection that arrives after a blocked-open rejection.

The review found one HIGH activation regression and fixed it. No CRITICAL, HIGH, MED or LOW findings remain open. The expected load is household study use with multiple tabs and bounded foreground queue batches.

## Finding resolved

HIGH. Activating the report gates made `familyRenderPrivateReport` consume every sessionless guest Report Card. The normal renderer returned before showing guest results or Save as Image. The direct encoder checks in Mason's report did not prove that the button remained reachable.

The canonical reviewer template and all eight copies now call `familyClear()` before returning false for a missing or expired family session. This clears the private report owner and active capture state, reloads persisted guest progress when private activity changed the in-memory object, and then lets the existing guest renderer run. A valid family session keeps the private report route. No private access check was relaxed.

The new all-eight regression runs the actual generated report renderer and clearing path. It verifies guest 7/10, a wired PNG action, removal of synthetic private 99/100 after session loss, and the valid-session private route. It failed before the repair and passed afterward. The harness's redundant false-to-true string replacement was also removed after the explicit enabled-state assignment.

## Verification

The final relevant suite passed 65 tests and 10 real local backend steps, with zero failures or ignored tests. The command uses `FAMILY_REAL_STACK=1`, Deno `--no-lock`, the existing family-api Deno config and all twelve test files listed in Mason's activation report. This includes actual PostgreSQL, Auth, PostgREST and Edge checks, AES-GCM queue handling, report cache and epoch races, anonymous boundaries, permanent errors, catalog mismatch and all three new all-nine storage regressions.

Evidence remains ignored under `test-results/luna-activation-final.log`. Before/after regression evidence is `luna-guest-before.log` and `luna-guest-after.log`. The earlier baseline run passed 64 tests before the added guest regression and therefore did not catch the missing button.

Both maintenance builders produce no change hunks. The report builder requires `--allow-env` for TypeScript; an initial run without that permission failed before producing output, and the corrected command passed. All 18 source-scope paths use CRLF without BOM. `git diff --check` passed. No backend, catalog, assessment content, dependency lock or published filename changed.

Native BrowserOS page 82 reproduced the Math Q2 guest defect before the fix. After reload, the actual guest name form and actual Report Card buttons in all eight reviewers showed guest scores and Save as Image with no family session. Geography and Language Q1/Q2 additionally recorded zero family-api resource requests. The Language Q2 actual Save as Image click produced a native image/png blob with signature 137,80,78,71,13,10,26,10 and decoded dimensions 680 by 520. Only the Canvas callback was intercepted to inspect bytes and prevent a download, and its prototype was restored. A synthetic in-memory private-score/session-loss case then restored guest results, cleared active private state and retained the PNG button with zero family-api requests.

Mason's earlier genuine local family-first pairing/unlock, encrypted capture, confirmed retake arithmetic and all-nine authorized parity evidence remains builder evidence, not a repeated Luna claim. Luna independently reran the full local backend suite. No hosted project call or production account action occurred.

## Blueprint and plugin gate

The change matches Aria M2 v2 and M1 access boundaries. Q1/Q2 data and source content stay isolated. The five-store schema, ciphertext shape, AAD, epochs, queue limits and immutable history are unchanged. The additive upgrade handles a pristine database and preserves existing opaque credentials, records and outbox entries. A blocked attempt rejects and its late successful connection closes; a subsequent version-4 open succeeds.

Ponytail verdict Ship. Both Thermos reviews completed. Security found the guest regression above; quality found only the removed no-op harness replacement. A fresh independent review confirmed the guest repair and regression. Comment review found zero new comments or suppressions and zero deletion flags. The plugin audit records the pstack principles, decisions and available-tool limits. No additional abstractions or features were added.

The source commit is local and has the required Grok attribution. The audit commit hash is supplied in Luna's final packet. No push or deployment occurred. Dep remains gated on this PASS and Quinn PASS.

## Quinn packet

Review and test exact source SHA `08f0d64c164be99d52d0648ae5c586d7e099d16f` plus the following documentation-only audit commit. Repeat the 65-test suite at the committed checkout. Pay particular attention to no-session guest report/export reachability, private activity followed by session loss, valid private routing, fresh/additive/blocked storage, capability failure, epoch races and regular report-cache failure distinctions.

The builder's owned 8771 service was no longer listening when Luna tried it. Do not assume the old exec session is alive. Luna started a plain static server on 8772, exec session 88591, and left it for QA. It serves the candidate without Auth injection. BrowserOS page 82 is Luna's guest tab at Language Q2 on 8772. The older builder tabs and databases were preserved. Recreate only an explicitly owned local proxy if authorized family browser checks need it. Do not reset encrypted databases or existing local history. No hosted mutations are needed.

Limits. This gate does not certify JPEG, mobile sharing, filesystem-save behavior, responsive/accessibility recertification, performance benchmarks or the actual owner password form. No production activation is claimed until Dep publishes and verifies Pages after Quinn.

[LUNA] M2 activation v1, 2026-10-25.
Status COMPLETE.
Key outputs. One HIGH guest regression fixed; all-eight native guest UI checks and 65-test suite pass; source committed locally.
Blockers. None for QA. JPEG remains outside this slice.
Next recommended. Quinn under the existing user authorization.
