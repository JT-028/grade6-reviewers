import vm from "node:vm";
import { canonicalJson, sha256 } from "../../supabase/functions/family-api/crypto.ts";

export const MODULES = ["History", "Math", "Geography", "Language"].flatMap((name) =>
  [1, 2].map((quarter) => ({
    module_key: `${name}6_${quarter === 2 ? "Q2_" : ""}Review_Module_v1.0.0`,
    subject: name.toLowerCase(),
    quarter,
  }))
);

export function canonicalItem(item: Record<string, any>) {
  return {
    q: String(item.q),
    type: item.type === "fill" ? "fill" : "choice",
    options: Array.isArray(item.opts) ? item.opts.map(String).sort() : [],
    answers: item.type === "fill"
      ? [
        ...new Set(
          (item.accept || [item.ans]).map((answer: unknown) => String(answer).toLowerCase()),
        ),
      ].sort()
      : [String(item.opts[item.ans])],
  };
}

export async function inventory() {
  const rows = [];
  for (const module of MODULES) {
    const source = await Deno.readTextFile(
      new URL(`../../${module.module_key}.html`, import.meta.url),
    );
    const context = vm.createContext({});
    for (const name of ["POP_QUIZZES", "EXAM_SET_1", "EXAM_SET_2"]) {
      const declaration = source.match(new RegExp(`const ${name} = ([\\s\\S]*?\\n[}\\]]);`));
      if (!declaration) throw new Error(`Missing source inventory: ${module.module_key}/${name}`);
      vm.runInContext(`globalThis.${name} = ${declaration[1]}`, context, { timeout: 1000 });
    }
    const unique = (
      items: any[],
    ) => [...new Map(items.map((item) => [String(item.q), item])).values()];
    const exam = unique(context.EXAM_SET_1.concat(context.EXAM_SET_2));
    const pop = unique(Object.values(context.POP_QUIZZES).flat().concat(exam));
    const policyNames = [
      "uniqueByQuestion",
      "sampleItems",
      "varyQuestionFormat",
      "shuffleQuestionOptions",
      "fillToMultipleChoice",
      "cleanFillStem",
      "answerTextOf",
      "gradeFromPercent",
      "gradeFromScores",
    ];
    const policies = policyNames.map((name) => {
      const start = source.indexOf(`function ${name}(`);
      if (start < 0) throw new Error(`Missing policy ${name}`);
      const end = source.indexOf("\nfunction ", start + 1);
      return source.slice(start, end < 0 ? source.length : end).replace(/\r/g, "").trim();
    });
    for (const kind of ["pop", "exam"]) {
      const pool = kind === "pop" ? pop : exam;
      const requested = kind === "pop" ? 20 : 70;
      const sets = kind === "pop" ? Object.keys(context.POP_QUIZZES) : ["exam-1", "exam-2"];
      for (const set_key of sets) {
        const total = Math.min(requested, pool.length);
        const content_revision = 1;
        const catalog_digest = await sha256(canonicalJson({
          items: pool.map(canonicalItem).map(canonicalJson).sort(),
          policies,
          requested,
          total,
          grade_policy: "deped-descriptor-rounded-v1",
        }));
        rows.push({
          id: `${module.module_key}:${kind}:${set_key}:r${content_revision}`,
          ...module,
          kind,
          set_key,
          content_revision,
          catalog_digest,
          total,
          grade_policy: "deped-descriptor-rounded-v1",
          label: `${module.subject} Q${module.quarter} ${kind} ${set_key}`,
          retired: false,
          source_pool_count: pool.length,
        });
      }
    }
  }
  return rows;
}

if (import.meta.main) console.log(JSON.stringify(await inventory(), null, 2));
