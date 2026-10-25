import { academicDigest, compareResults, progressFromResults, reportProjection, resultPercentage, summarizeResults } from "../../supabase/functions/family-api/m2-progress.ts";
import { type Assessment, type Envelope, resultDTO } from "../../supabase/functions/family-api/m2-contract.ts";
const oracle = JSON.parse(await Deno.readTextFile(new URL("fixtures/m2-progress-oracle.json",import.meta.url)));
const child = {id:"20000000-0000-4000-8000-000000000001",display_name:"Synthetic A"};
const assessment: Assessment = {id:"Math6_Q2_Review_Module_v1.0.0:pop:flashcards:r1",module_key:"Math6_Q2_Review_Module_v1.0.0",subject:"math",quarter:2,kind:"pop",set_key:"flashcards",content_revision:1,catalog_digest:"a".repeat(64),total:10,grade_policy:"deped-descriptor-rounded-v1",label:"Synthetic pop",retired:false};
function result(correct:number,total:number,number=1,time="2026-10-24T01:00:00.000Z") {
  const envelope:Envelope={client_version:1,attempt:{id:`60000000-0000-4000-8000-${String(number).padStart(12,"0")}`,authorization_session_id:"50000000-0000-4000-8000-000000000001",assessment_id:assessment.id,first_correct:correct,answered_count:total,total,finalized:true,completed_at:time,time_quality:"anchored",administered_fingerprint:"b".repeat(64)}};
  return resultDTO(envelope,{...assessment,total},child.id,"2026-10-24T03:00:00.000Z");
}
function equal(a:unknown,b:unknown,label:string){if(JSON.stringify(a)!==JSON.stringify(b))throw new Error(label+": "+JSON.stringify(a));}
Deno.test("M2-B fixed independent ratio and school-grade oracle",()=>{
  for(const row of oracle.cases){const latest=result(...row.latest as [number,number],2,"2026-10-24T02:00:00.000Z"),prior=result(...row.prior as [number,number]); const compared=compareResults(latest,prior);equal([resultPercentage(latest.first_correct,latest.total),compared.percentage_points,compared.relative_percent,compared.state,latest.grade.letter],[row.percentage,row.pp,row.relative,row.state,row.grade],"fixed oracle");}
});
Deno.test("M2-B chronology, revision/set matching, correction, unknown and quarter isolation",async()=>{
  const first=result(6,10),late=result(7,10,2,"2026-10-24T02:00:00.000Z"),latest=result(8,10,3,"2026-10-24T03:00:00.000Z");
  first.correction={final_correct:10,total:10,captured_at:"2026-10-24T01:01:00.000Z"};
  equal(summarizeResults([latest,first,late]).prior?.id,late.id,"completion before receipt");
  equal(summarizeResults([first,{...latest,assessment:{...latest.assessment,id:"new-revision",content_revision:2}}]).state,"first_result","revision isolation");
  equal(summarizeResults([first,{...latest,time_quality:"unknown",completed_at:null}]).latest,null,"unknown never latest");
  equal(summarizeResults([first,{...first,id:latest.id}]).latest?.id,latest.id,"UUID tie");
  const progress=progressFromResults({child,quarter:2,rows:[first,latest],revision:"3",catalog_digest:"a".repeat(64),as_of:"2026-10-24T04:00:00.000Z",provenance:"local_fixture"});
  equal(progress.subjects[1].pop.percentage_points,20,"immutable baseline");
  const projection=reportProjection(progress);equal(projection.subjects.length,4,"four subjects");
  equal(await academicDigest(projection),await academicDigest({...projection,as_of:"2026-10-25T04:00:00.000Z",stale:true}),"volatile metadata excluded");
  equal(progressFromResults({...progress,rows:[first],quarter:1}).subjects[1].pop.state,"empty","no fallback quarter");
  let rejected=false;try{reportProjection({...progress,subjects:progress.subjects.map((subject)=>subject.subject==="math"?{...subject,pop:{...subject.pop,percentage_points:99}}:subject)});}catch{rejected=true;}equal(rejected,true,"reject contradictory derived fields");
});
Deno.test("Luna rejects malformed and nonallowlisted report data",()=>{
  const base=progressFromResults({child,quarter:2,rows:[result(6,10),result(8,10,2,"2026-10-24T02:00:00.000Z")],revision:"2",catalog_digest:"a".repeat(64),as_of:"2026-10-24T04:00:00.000Z",provenance:"local_fixture"});
  for(const mutate of [
    (value:any)=>{value.subjects[1].pop.latest.assessment.module_key="History6_Review_Module_v1.0.0";},
    (value:any)=>{value.subjects[1].pop.latest.assessment.content_revision=999;},
    (value:any)=>{value.subjects[1].pop.latest.assessment.grade_policy="fake-policy";},
    (value:any)=>{value.subjects[1].pop.latest.token="private-sentinel";},
    (value:any)=>{value.child.feedback="private-sentinel";},
    (value:any)=>{value.token="private-sentinel";},
    (value:any)=>{value.subjects[1].pop.latest.answered_count=8;},
  ]) {
    const value=structuredClone(base);mutate(value);let rejected=false;
    try{reportProjection(value);}catch{rejected=true;}
    equal(rejected,true,"reject malformed report boundary");
  }
});
