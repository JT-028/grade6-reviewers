import manifest from "./m2-catalog.json" with { type: "json" };
import type { FamilyRepository } from "./auth.ts";
import { canonicalJson, constantTimeEqual, hmacSha256, mutationDigest, sha256 } from "./crypto.ts";
import { catalogEntries, resultDTO, utc, validateCatalog, validateEnvelope, type Assessment, type Envelope } from "./m2-contract.ts";
import { progressFromResults, reportProjection, reportResult } from "./m2-progress.ts";
import { ApiError, HEX_256, UUID } from "./validation.ts";

export const CATALOG = manifest as {contract_version:number;catalog_version:number;catalog_digest:string;assessments:Assessment[]};
validateCatalog(CATALOG.assessments);
export const M2_CAPABILITIES = ["family_access","assessment_history_v1","progress_summary_v1"];
export async function m2Compatible(repository: FamilyRepository): Promise<boolean> {
  try {
    const status = await repository.dispatch("m2_capabilities",{},{});
    return status.contract_version===1 && status.catalog_count===CATALOG.assessments.length &&
      status.catalog_digest===CATALOG.catalog_digest && CATALOG.catalog_digest===await sha256(canonicalJson(catalogEntries(CATALOG.assessments)));
  } catch { return false; }
}
export function m2Filters(search: string, history: boolean): Record<string,unknown> {
  const fail = () => { throw new ApiError(400,"INVALID_FILTER","History filters are invalid."); };
  if (new TextEncoder().encode(search).length>2048) fail();
  const params = new URLSearchParams(search), output: Record<string,unknown> = {};
  const allowed = history ? ["quarter","subject","kind","assessment_id","cursor","limit"] : ["quarter"];
  for (const [key,value] of params) {
    if (!allowed.includes(key) || Object.hasOwn(output,key)) fail();
    output[key]=value;
  }
  if (output.quarter!=="1" && output.quarter!=="2") fail();
  output.quarter=Number(output.quarter);
  if (output.subject!==undefined && !["history","math","geography","language"].includes(String(output.subject))) fail();
  if (output.kind!==undefined && !["pop","exam"].includes(String(output.kind))) fail();
  if (output.assessment_id!==undefined) {
    const row=CATALOG.assessments.find(row=>row.id===output.assessment_id);
    if (!row || row.quarter!==output.quarter || (output.subject!==undefined && row.subject!==output.subject) || (output.kind!==undefined && row.kind!==output.kind)) fail();
  }
  if (history) {
    if (output.limit!==undefined && !/^(?:[1-9]|[1-9]\d|100)$/.test(String(output.limit))) fail();
    output.limit=output.limit===undefined?25:Number(output.limit);
    if (output.cursor!==undefined && (typeof output.cursor!=="string" || output.cursor.length>1024 || !/^[A-Za-z0-9_-]+$/.test(output.cursor))) invalidCursor();
  }
  return output;
}
type Last = {completed_at:string|null;time_quality:string;received_at:string;id:string};
type Cursor = {v:1;scope_digest:string;revision:string;last:Last};
function invalidCursor(): never { throw new ApiError(400,"INVALID_CURSOR","History position is invalid."); }
function decodeCursor(encoded: string, scope: string, head: string): Cursor {
  try {
    const cursor=JSON.parse(atob(encoded.replaceAll("-","+").replaceAll("_","/"))) as Cursor;
    if (canonicalJson(Object.keys(cursor).sort())!==canonicalJson(["last","revision","scope_digest","v"]) || cursor.v!==1 ||
      typeof cursor.scope_digest!=="string" || !HEX_256.test(cursor.scope_digest) || !constantTimeEqual(cursor.scope_digest,scope) ||
      typeof cursor.revision!=="string" || !/^(0|[1-9]\d{0,18})$/.test(cursor.revision) || BigInt(cursor.revision)>BigInt(head) ||
      !cursor.last || canonicalJson(Object.keys(cursor.last).sort())!==canonicalJson(["completed_at","id","received_at","time_quality"]) ||
      !UUID.test(cursor.last.id) || cursor.last.id!==cursor.last.id.toLowerCase() || !utc(cursor.last.received_at) ||
      !["anchored","unknown","client_unverified"].includes(cursor.last.time_quality) ||
      (cursor.last.completed_at===null ? cursor.last.time_quality!=="unknown" : !utc(cursor.last.completed_at))) invalidCursor();
    return cursor;
  } catch { return invalidCursor(); }
}
function encodeCursor(cursor: Cursor): string { return btoa(canonicalJson(cursor)).replaceAll("+","-").replaceAll("/","_").replaceAll("=",""); }
function unavailable(): never {throw new ApiError(503,"M2_UNAVAILABLE","Family history is not available.",true);}
function checkedAck(value: Record<string,unknown>, id: string) {
  if (value.attempt_id!==id || !["accepted","duplicate"].includes(String(value.status)) || !utc(value.received_at) ||
    value.provenance!=="server" || typeof value.revision!=="string" || !/^[1-9]\d*$/.test(value.revision) ||
    Object.keys(value).length!==5) unavailable();
  return value;
}
export async function m2Dispatch(repository: FamilyRepository, operation: string, context: Record<string,unknown>,
  input: Record<string,unknown>, pepper: string): Promise<Record<string,unknown>> {
  if (!await m2Compatible(repository)) unavailable();
  if (operation.endsWith("_catalog")) {
    await repository.dispatch(operation,context,{});
    return structuredClone(CATALOG);
  }
  if (operation==="child_attempt_record") {
    const candidate=input.attempt as Record<string,unknown> | undefined;
    const sourceId=typeof candidate?.authorization_session_id==="string" ? candidate.authorization_session_id.toLowerCase() : "";
    const envelope=validateEnvelope(input,CATALOG.assessments,{id:sourceId,child_id:"",device_id:"",
      issued_at:"1970-01-01T00:00:00.000Z",expires_at:"9999-12-31T23:59:59.999Z",revoked:false},new Date().toISOString());
    context.payload_digest=await mutationDigest("child_attempt_record:"+canonicalJson(envelope),pepper);
    return checkedAck(await repository.dispatch(operation,context,{envelope,permanent_digest:await sha256(canonicalJson(envelope))}),envelope.attempt.id);
  }
  const role=operation.startsWith("parent_")?"parent":"child";
  const scope=await repository.dispatch(role+"_m2_scope",context,{child_id:input.child_id});
  const child=scope.child as {id:string;display_name:string};
  if (!child || typeof child.id!=="string" || typeof scope.family_id!=="string" || typeof scope.revision!=="string" || !/^\d+$/.test(scope.revision)) unavailable();
  const scopeDigest=await hmacSha256(canonicalJson([role,scope.family_id,child.id,input.quarter,input.subject??null,input.kind??null,input.assessment_id??null]),pepper);
  const cursor=input.cursor===undefined?null:decodeCursor(String(input.cursor),scopeDigest,scope.revision);
  const payload={...input,revision:cursor?.revision||scope.revision,...(cursor?{last:cursor.last}:{})};
  delete (payload as Record<string,unknown>).cursor;
  const response=await repository.dispatch(operation,context,payload);
  if (!response.child || canonicalJson(response.child)!==canonicalJson(child) || response.revision!==payload.revision || !utc(response.as_of) || !Array.isArray(response.rows)) unavailable();
  const rows=response.rows.map(value=>{
    const record=value as {envelope:Envelope;received_at:string};
    const assessment=CATALOG.assessments.find(row=>row.id===record.envelope?.attempt?.assessment_id);
    if (!assessment || !utc(record.received_at)) unavailable();
    const dto=reportResult(resultDTO(record.envelope,assessment,child.id,record.received_at),CATALOG.assessments);
    if (dto.assessment.quarter!==input.quarter) unavailable();
    return dto;
  });
  if (operation.endsWith("_progress")) {
    if (rows.length>192 || !Array.isArray(response.chronology_counts)) unavailable();
    const progress=progressFromResults({child,quarter:Number(input.quarter),rows,revision:String(response.revision),catalog_digest:CATALOG.catalog_digest,as_of:response.as_of as string,provenance:"server"});
    for (const value of response.chronology_counts) {
      const count=value as {subject:string;kind:"pop"|"exam";count:number};
      const subject=progress.subjects.find(row=>row.subject===count.subject);
      if (!subject || !["pop","exam"].includes(count.kind) || !Number.isSafeInteger(count.count) || count.count<1 || !subject[count.kind].chronology_example) unavailable();
      subject[count.kind].chronology_count=count.count;
    }
    reportProjection(progress,false,CATALOG.assessments);
    return progress;
  }
  const limit=Number(input.limit);
  if (rows.length>limit+1 || rows.some(row=>(input.subject!==undefined && row.assessment.subject!==input.subject) || (input.kind!==undefined && row.assessment.kind!==input.kind) || (input.assessment_id!==undefined && row.assessment.id!==input.assessment_id))) unavailable();
  const items=rows.slice(0,limit), last=items.at(-1);
  return {items,next_cursor:rows.length>limit && last ? encodeCursor({v:1,scope_digest:scopeDigest,revision:String(response.revision),last:{id:last.id,completed_at:last.completed_at,time_quality:last.time_quality,received_at:last.received_at}}):null,
    revision:response.revision,as_of:response.as_of,provenance:"server"};
}
