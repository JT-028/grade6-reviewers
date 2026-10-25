import ts from "npm:typescript@5.9.3";
import { inventory } from "./m2_catalog_inventory.ts";
const root = new URL("../../",import.meta.url);
const source = await Deno.readTextFile(new URL("supabase/functions/family-api/m2-progress.ts",root));
const core = ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/^import .*;\r?\n/gm,"").replace(/\bexport /g,"");
const template = (await Deno.readTextFile(new URL("m2_report_template.js",import.meta.url))).replace(/\r/g,"").replace("/* M2_PROGRESS_CORE */",core);
const transport = (await Deno.readTextFile(new URL("m2_transport_template.js",import.meta.url))).replace(/\r/g,"").trimEnd();
const modules = [...new Set((await inventory()).map(row=>row.module_key))];
let patch = "*** Begin Patch\n";
function edit(old:string,replacement:string) {patch += "@@\n"+old.split("\n").map(line=>"-"+line).join("\n")+"\n"+replacement.split("\n").map(line=>"+"+line).join("\n")+"\n";}
for (const file of [...modules.map(module=>module+".html"),"family.html"]) {
  if(Deno.args[0] && file!==Deno.args[0])continue;
  const html=(await Deno.readTextFile(new URL(file,root))).replace(/\r/g,"");
  const start=patch.length;
  patch += "*** Update File: "+file+"\n";
  const contentStart=patch.length;
  if(html.includes('// FAMILY_TRANSPORT_START')) {
    const old=html.slice(html.indexOf('// FAMILY_TRANSPORT_START'),html.indexOf('// FAMILY_TRANSPORT_END')+'// FAMILY_TRANSPORT_END'.length);
    if(old!==transport)edit(old,transport);
  }
  if(file!=="family.html") for(const line of html.split('\n').filter(line=>line.includes('href="family.html"'))) edit(line,line.replaceAll('href="family.html"','href="family.html#q'+(file.includes('_Q2_')?2:1)+'"'));
  if(html.includes("// FAMILY_REPORT_START")) {
    const old=html.slice(html.indexOf("// FAMILY_REPORT_START"),html.indexOf("// FAMILY_REPORT_END")+"// FAMILY_REPORT_END".length);
    if(old!==template.trimEnd() || !html.includes('// FAMILY_TRANSPORT_START')) edit(old,(!html.includes('// FAMILY_TRANSPORT_START')?transport+'\n':'')+template.trimEnd());
  } else if(file==="family.html") edit('      const FAMILY_CLIENT_VERSION = 1;',template+'\n      const FAMILY_LOCAL_ADAPTER = null;\n      const FAMILY_CLIENT_VERSION = 1;');
  else edit('// FAMILY_M2_END','// FAMILY_M2_END\n'+template);
  if(file!=="family.html") {
    const boundary="  if (!wrap) return;\n  ensureFeedbackState();";
    const hook="  if (!wrap) return;\n  if (familyRenderPrivateReport(wrap)) return;\n  ensureFeedbackState();";
    if(!html.includes(hook)) {if(!html.includes(boundary))throw new Error("Missing report boundary "+file);edit(boundary,hook);}
  }
  if(patch.length===contentStart)patch=patch.slice(0,start);
}
patch += "*** End Patch\n";
console.log(patch);
