import { inventory } from "./m2_catalog_inventory.ts";
const rows = await inventory();
const template = (await Deno.readTextFile(new URL("m2_reviewer_template.js", import.meta.url))).replace(/\r/g, "");
const inline = template.slice(template.indexOf("// FAMILY_M2_START"));
let patch = "*** Begin Patch\n";
function change(old: string, replacement: string) {
  patch += "@@\n" + old.split("\n").map((line) => "-" + line).join("\n") + "\n" +
    replacement.split("\n").map((line) => "+" + line).join("\n") + "\n";
}
for (const module_key of new Set(rows.map((row) => row.module_key))) {
  if(Deno.args[0] && Deno.args[0]!==module_key+'.html')continue;
  const source = (await Deno.readTextFile(new URL(`../../${module_key}.html`, import.meta.url)))
    .replace(/\r/g, "");
  patch += `*** Update File: ${module_key}.html\n`;
  const saveGuard =
    "function saveProgress(name, data) {\n  if (window.familyPrivateCaptureActive) return; // Private results stay in encrypted family stores.";
  if (!source.includes(saveGuard)) change("function saveProgress(name, data) {", saveGuard);
  const body = inline.replace(
    "/* GENERATED */ []",
    JSON.stringify(rows.filter((row) => row.module_key === module_key)),
  );
  if (source.includes("// FAMILY_M2_START")) {
    const oldBlock = source.slice(
      source.indexOf("// FAMILY_M2_START"),
      source.indexOf("// FAMILY_M2_END") + "// FAMILY_M2_END".length,
    );
    const before = oldBlock.split("\n"), after = body.trimEnd().split("\n");
    let prefix = 0, suffix = 0;
    while (prefix < before.length && before[prefix] === after[prefix]) prefix++;
    while (
      suffix < before.length - prefix &&
      before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
    ) suffix++;
    if (prefix < before.length) {
      change(
        before.slice(prefix, before.length - suffix).join("\n"),
        after.slice(prefix, after.length - suffix).join("\n"),
      );
    }
  } else change("let pq = null; // pop quiz state", body + "\nlet pq = null; // pop quiz state");
  const edits = [
    [
      "  document.getElementById('popquizOverlay').classList.add('show');\n  startPopQuizTimer();",
      "  pq.familyCapture = familyBegin('pop', module, tfShuffled);\n  document.getElementById('popquizOverlay').classList.add('show');\n  startPopQuizTimer();",
    ],
    [
      "function answerPop(idx, btn) {\n  const q",
      "function answerPop(idx, btn) {\n  if (!pq || (pq.familyCapture && !familyCurrent(pq.familyCapture))) return;\n  const q",
    ],
    [
      "    setTimeout(() => {\n      pq.idx++;",
      "    const answeredAttempt = pq;\n    setTimeout(() => {\n      if (pq !== answeredAttempt || (answeredAttempt.familyCapture && !familyCurrent(answeredAttempt.familyCapture))) return;\n      pq.idx++;",
    ],
    [
      "function finishPopQuiz(timedOut) {",
      "function finishPopQuiz(timedOut) {\n  if (!pq || pq.finalized || (pq.familyCapture && !familyCurrent(pq.familyCapture))) return;\n  pq.finalized = true;\n  familyFinalize(pq.familyCapture, pq.firstAttemptScore, pq.attempts.filter(count => count > 0).length, pq.questions.length, pq.finalScore);",
    ],
    [
      "  const pool = examQuestionPool();\n  const take",
      "  const pool = examQuestionPool();\n  if (!pool.length) return;\n  const take",
    ],
    [
      "  exam.endTime = 0; // unused — counting up",
      "  exam.familyCapture = familyBegin('exam', 'exam-' + examNum, questionsShuffledOpts);\n  exam.endTime = 0; // unused — counting up",
    ],
    [
      "function renderExamQuestion() {",
      "function renderExamQuestion() {\n  const renderedAttempt = exam;",
    ],
    [
      "  document.getElementById('examNext').addEventListener('click', () => {\n    exam.idx++;",
      "  document.getElementById('examNext').addEventListener('click', () => {\n    if (exam !== renderedAttempt || (renderedAttempt.familyCapture && !familyCurrent(renderedAttempt.familyCapture))) return;\n    exam.idx++;",
    ],
    [
      "      onOk: () => finishExam(false)",
      "      onOk: () => { if (exam === renderedAttempt) finishExam(false); }",
    ],
    [
      "function answerExam(picked, btn) {\n  const q",
      "function answerExam(picked, btn) {\n  if (!exam || exam.finalized || (exam.familyCapture && !familyCurrent(exam.familyCapture))) return;\n  const q",
    ],
    [
      "function finishExam(timedOut) {",
      "function finishExam(timedOut) {\n  if (!exam || exam.finalized || (exam.familyCapture && !familyCurrent(exam.familyCapture))) return;\n  exam.finalized = true;",
    ],
    [
      "  exam.score = Math.min(scored, total);",
      "  familyFinalize(exam.familyCapture, scored, Object.keys(seenIdx).length, total);\n  exam.score = Math.min(scored, total);",
    ],
    ["function renderPopQuestion() {", "function renderPopQuestion() {\n  const renderedPop = pq;"],
    [
      "    const go = () => {\n      const val = (document.getElementById('pqFill')",
      "    const go = () => {\n      if (pq !== renderedPop || (renderedPop.familyCapture && !familyCurrent(renderedPop.familyCapture))) return;\n      const val = (document.getElementById('pqFill')",
    ],
    [
      "b.addEventListener('click', () => answerPop(i, b));",
      "b.addEventListener('click', () => { if (pq === renderedPop) answerPop(i, b); });",
    ],
    [
      "function closePopQuizModal() {",
      "function closePopQuizModal() {\n  if (pq && !pq.finalized && pq.familyCapture) {\n    pq.familyCapture.session = null;\n    familyCaptures.delete(pq.familyCapture);\n  }",
    ],
    [
      "    const go = () => {\n      const val = (document.getElementById('examFill')",
      "    const go = () => {\n      if (exam !== renderedAttempt || (renderedAttempt.familyCapture && !familyCurrent(renderedAttempt.familyCapture))) return;\n      const val = (document.getElementById('examFill')",
    ],
    [
      "b.addEventListener('click', () => answerExam(i, b));",
      "b.addEventListener('click', () => { if (exam === renderedAttempt) answerExam(i, b); });",
    ],
  ];
  for (const [old, replacement] of edits) {
    if (source.includes(replacement)) continue;
    if (source.split(old).length !== 2) throw new Error(`Ambiguous hook ${module_key}: ${old}`);
    const end = source.indexOf(old) + old.length;
    const newline = source.indexOf("\n", end);
    const suffix = source.slice(end, newline < 0 ? source.length : newline);
    change(old + suffix, replacement + suffix);
  }
}
patch += "*** End Patch\n";
console.log(patch);
