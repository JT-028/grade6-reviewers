import { canonicalJson, sha256 } from "./crypto.ts";
import { resultGrade, type resultDTO, type Assessment, utc } from "./m2-contract.ts";

export type Result = ReturnType<typeof resultDTO>;
export const SUBJECTS = ["history", "math", "geography", "language"] as const;
export function ratioRound(numerator: number, denominator: number, places: number): number {
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || denominator <= 0) throw new Error("Invalid ratio");
  const scale = 10 ** places;
  const rounded = Math.floor((Math.abs(numerator) * scale * 2 + denominator) / (2 * denominator)) / scale;
  return rounded === 0 ? 0 : Math.sign(numerator) * rounded;
}
export function resultPercentage(correct: number, total: number): number {
  return ratioRound(100 * correct, total, 2);
}
export function compareResults(latest: Result, prior: Result | null) {
  if (!prior) return { state: "first_result", percentage_points: null, relative_percent: null, relative_unavailable_reason: "no_prior" };
  const delta = latest.first_correct * prior.total - prior.first_correct * latest.total;
  const equal = resultPercentage(latest.first_correct, latest.total) === resultPercentage(prior.first_correct, prior.total);
  return {
    state: equal ? "unchanged" : delta > 0 ? "improved" : "declined",
    percentage_points: equal ? 0 : ratioRound(100 * delta, latest.total * prior.total, 2),
    relative_percent: prior.first_correct === 0 ? null : equal ? 0 : ratioRound(100 * delta, latest.total * prior.first_correct, 1),
    relative_unavailable_reason: prior.first_correct === 0 ? "zero_prior" : null,
  };
}
export function resultOrder(a: Result, b: Result): number {
  const anchoredA = a.time_quality === "anchored", anchoredB = b.time_quality === "anchored";
  if (anchoredA !== anchoredB) return anchoredA ? -1 : 1;
  const dateA = anchoredA ? a.completed_at! : a.received_at;
  const dateB = anchoredB ? b.completed_at! : b.received_at;
  return dateA === dateB ? (a.id === b.id ? 0 : a.id > b.id ? -1 : 1) : dateA > dateB ? -1 : 1;
}
export function summarizeResults(rows: Result[]) {
  const uncertain = rows.filter(row => row.time_quality !== "anchored").sort(resultOrder);
  if (uncertain.length) return {
    state: null, availability: "chronology_unavailable", latest: null, prior: null,
    percentage_points: null, relative_percent: null, relative_unavailable_reason: "chronology_unavailable",
    message: "Reported result; completion order unavailable", chronology_count: uncertain.length, chronology_example: uncertain[0],
  };
  const sorted = [...rows].sort(resultOrder), latest = sorted[0] || null;
  const prior = latest ? sorted.slice(1).find(row => row.assessment.id === latest.assessment.id) || null : null;
  return {
    availability: "ready", latest, prior,
    ...(latest ? compareResults(latest, prior) : { state: "empty", percentage_points: null, relative_percent: null, relative_unavailable_reason: "no_prior" }),
    message: latest ? "Same assessment version; questions may vary." : "No results recorded.",
    chronology_count: 0, chronology_example: null,
  };
}
export function progressFromResults(input: {
  child: { id: string; display_name: string }; quarter: number; rows: Result[];
  revision: string; catalog_digest: string; as_of: string;
  provenance: "server" | "local_fixture" | "encrypted_cache";
  last_confirmed_at?: string | null; pending_count?: number; completeness?: "complete" | "partial";
}) {
  if (![1, 2].includes(input.quarter) || !/^\d+$/.test(input.revision)) throw new Error("Invalid progress scope");
  const rows = input.rows.filter(row => row.child_id === input.child.id && row.assessment.quarter === input.quarter);
  return {
    contract_version: 1, child: structuredClone(input.child), quarter: input.quarter,
    subjects: SUBJECTS.map(subject => ({ subject,
      pop: summarizeResults(rows.filter(row => row.assessment.subject === subject && row.assessment.kind === "pop")),
      exam: summarizeResults(rows.filter(row => row.assessment.subject === subject && row.assessment.kind === "exam")),
    })), revision: input.revision, catalog_digest: input.catalog_digest, as_of: input.as_of,
    last_confirmed_at: input.last_confirmed_at === undefined ? input.as_of : input.last_confirmed_at,
    provenance: input.provenance, pending_count: input.pending_count || 0, completeness: input.completeness || "complete",
  };
}
export type Progress = ReturnType<typeof progressFromResults>;
function fields(value: unknown, names: string[]): void {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== names.length || names.some(name => !Object.hasOwn(value, name))) throw new Error("Invalid report fields");
}
export function reportResult(value: unknown, catalog?: readonly Assessment[]): Result {
  fields(value, ["id","child_id","assessment","first_correct","total","answered_count","completed_at","time_quality","administered_fingerprint","received_at","percentage","grade","correction"]);
  const row = value as Result, assessment = row.assessment;
  fields(assessment, ["id","module_key","subject","quarter","kind","set_key","content_revision","label","retired","grade_policy"]);
  fields(row.grade, ["rounded_pct","letter","name"]);
  const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
  const module = /^(History|Math|Geography|Language)6_(Q2_)?Review_Module_v1\.0\.0$/.exec(assessment.module_key);
  if (!module || module[1].toLowerCase() !== assessment.subject || (module[2] ? 2 : 1) !== assessment.quarter || !["pop","exam"].includes(assessment.kind) || !Number.isSafeInteger(assessment.content_revision) || assessment.content_revision < 1 || assessment.id !== `${assessment.module_key}:${assessment.kind}:${assessment.set_key}:r${assessment.content_revision}` || !(assessment.kind === "exam" ? /^exam-[12]$/ : /^(flashcards|biomes|diagrams|tutor|cheat|practice)$/).test(assessment.set_key) || assessment.grade_policy !== "deped-descriptor-rounded-v1" || typeof assessment.retired !== "boolean" || typeof assessment.label !== "string" || !assessment.label.length || assessment.label.length > 120) throw new Error("Invalid report assessment");
  if (!uuid.test(row.id) || !uuid.test(row.child_id) || !Number.isInteger(row.first_correct) || !Number.isInteger(row.total) || row.total < 1 || row.total > 100 || row.first_correct < 0 || row.first_correct > row.total || !Number.isInteger(row.answered_count) || row.answered_count < row.first_correct || row.answered_count > row.total || (assessment.kind === "pop" && row.answered_count !== row.total) || row.percentage !== resultPercentage(row.first_correct,row.total) || canonicalJson(row.grade) !== canonicalJson(resultGrade(row.first_correct,row.total)) || !utc(row.received_at) || !["anchored","client_unverified","unknown"].includes(row.time_quality) || (row.completed_at === null ? row.time_quality !== "unknown" : !utc(row.completed_at)) || !/^[a-f0-9]{64}$/.test(row.administered_fingerprint)) throw new Error("Invalid report result");
  if (row.correction !== null) {
    fields(row.correction,["final_correct","captured_at","total"]);
    if (assessment.kind !== "pop" || !Number.isInteger(row.correction.final_correct) || row.correction.final_correct < row.first_correct || row.correction.final_correct > row.total || row.correction.total !== row.total || !utc(row.correction.captured_at)) throw new Error("Invalid report correction");
  }
  if (catalog) {
    const reviewed = catalog.find(entry => entry.id === assessment.id);
    if (!reviewed || reviewed.total !== row.total || Object.keys(assessment).some(key => (assessment as Record<string,unknown>)[key] !== (reviewed as unknown as Record<string,unknown>)[key])) throw new Error("Unreviewed report assessment");
  }
  return row;
}
export function reportProjection(value: unknown, stale = false, catalog?: readonly Assessment[]) {
  fields(value,["contract_version","child","quarter","subjects","revision","catalog_digest","as_of","last_confirmed_at","provenance","pending_count","completeness"]);
  const progress = value as Progress;
  fields(progress.child,["id","display_name"]);
  if (typeof progress.revision !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(progress.child.id) || !Array.isArray(progress.subjects)) throw new Error("Invalid report scope");
  if (progress.contract_version !== 1 || ![1, 2].includes(progress.quarter) || !/^(0|[1-9]\d*)$/.test(progress.revision) || !/^[a-f0-9]{64}$/.test(progress.catalog_digest) || !progress.child?.id || typeof progress.child.display_name !== "string" || !progress.child.display_name.length || progress.child.display_name.length > 40 || progress.subjects.length !== 4 || !["server", "local_fixture", "encrypted_cache"].includes(progress.provenance) || !["complete", "partial"].includes(progress.completeness) || !Number.isInteger(progress.pending_count) || progress.pending_count < 0 || !utc(progress.as_of) || (progress.last_confirmed_at !== null && !utc(progress.last_confirmed_at))) throw new Error("Invalid progress response");
  progress.subjects.forEach((subject, index) => {
    fields(subject,["subject","pop","exam"]);
    if (subject.subject !== SUBJECTS[index]) throw new Error("Invalid subject scope");
    for (const kind of ["pop", "exam"] as const) {
      const summary = subject[kind];
      fields(summary,["state","availability","latest","prior","percentage_points","relative_percent","relative_unavailable_reason","message","chronology_count","chronology_example"]);
      if (typeof summary.message !== "string" || summary.message.length > 200 || !Number.isInteger(summary.chronology_count)) throw new Error("Invalid report summary");
      for (const row of [summary.latest, summary.prior, summary.chronology_example]) if (row !== null) {
        reportResult(row,catalog);
        if (row.child_id !== progress.child.id || row.assessment.quarter !== progress.quarter || row.assessment.subject !== subject.subject || row.assessment.kind !== kind) throw new Error("Inconsistent result response");
      }
      if (summary.availability === "chronology_unavailable") {
        if (summary.state !== null || summary.latest !== null || summary.prior !== null || summary.percentage_points !== null || summary.relative_percent !== null || summary.relative_unavailable_reason !== "chronology_unavailable" || summary.chronology_count < 1 || !summary.chronology_example || summary.chronology_example.time_quality === "anchored") throw new Error("Inconsistent chronology response");
      } else {
        if ((summary.latest && summary.latest.time_quality !== "anchored") || (summary.prior && (!summary.latest || summary.prior.time_quality !== "anchored" || summary.latest.assessment.id !== summary.prior.assessment.id || summary.latest.id === summary.prior.id || resultOrder(summary.latest,summary.prior) >= 0))) throw new Error("Invalid comparable pair");
        const expected = summarizeResults([summary.latest, summary.prior].filter(Boolean) as Result[]);
        if (summary.availability !== "ready" || summary.chronology_count !== 0 || summary.chronology_example !== null || ["state", "percentage_points", "relative_percent", "relative_unavailable_reason"].some(key => (summary as Record<string, unknown>)[key] !== (expected as Record<string, unknown>)[key])) throw new Error("Inconsistent comparison response");
      }
    }
  });
  const { contract_version: _contract, ...projectionFields } = structuredClone(progress);
  return { version: 1, ...projectionFields, stale: !!stale, timezone: "Asia/Manila" };
}
export type ReportProjection = ReturnType<typeof reportProjection>;
export async function academicDigest(projection: ReportProjection): Promise<string> {
  const { as_of: _asof, last_confirmed_at: _confirmed, stale: _stale, ...academic } = projection;
  return await sha256(canonicalJson(academic));
}
