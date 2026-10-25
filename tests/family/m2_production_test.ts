import { inventory } from './m2_catalog_inventory.ts';
import { catalogEntries } from '../../supabase/functions/family-api/m2-contract.ts';
import { canonicalJson, sha256 } from '../../supabase/functions/family-api/crypto.ts';
import manifest from '../../supabase/functions/family-api/m2-catalog.json' with {type:'json'};
function assert(value:unknown,message:string):asserts value {if(!value)throw new Error(message);}
Deno.test('M2 frozen production manifest exactly matches all 64 actual assessment inventories without answer text',async()=>{
  const actual=catalogEntries(await inventory());
  assert(actual.length===64 && canonicalJson(actual)===canonicalJson(manifest.assessments),'Frozen catalog equals actual source semantics');
  assert(await sha256(canonicalJson(actual))===manifest.catalog_digest,'Canonical manifest digest');
  assert(new TextEncoder().encode(JSON.stringify(manifest)).length<=65536,'Bounded catalog');
  assert(!/"(?:answers|options|pin|token|child_id|family_id|source_pool_count)"/.test(JSON.stringify(manifest)),'Catalog metadata allowlist');
});
Deno.test('M2 all-nine production inline transports agree, gates remain closed, no browser shared script or fixture import',async()=>{
  const template=(await Deno.readTextFile('tests/family/m2_transport_template.js')).replaceAll('\r','').trim();
  const files=['family.html',...new Set(manifest.assessments.map(row=>row.module_key+'.html'))];
  for(const file of files){
    const source=(await Deno.readTextFile(file)).replaceAll('\r','');
    const block=source.slice(source.indexOf('// FAMILY_TRANSPORT_START'),source.indexOf('// FAMILY_TRANSPORT_END')+'// FAMILY_TRANSPORT_END'.length);
    assert(block===template,file+' production transport parity');
    for(const flag of ['FAMILY_HISTORY_ENABLED','FAMILY_REPORT_ENABLED','FAMILY_JPEG_ENABLED'])assert(source.includes('const '+flag+' = false;'),file+' closed '+flag);
    assert(source.includes('const FAMILY_LOCAL_ADAPTER = null;'),file+' no fixture adapter');
    assert(source.includes('const FAMILY_ENABLED = '+(file==='family.html'?'true':'false')+';'),file+' M1 access boundary');
    assert(!/<script[^>]+src=/.test(source),file+' remains self-contained');
  }
  for(const file of ['index.ts','m2-bridge.ts','m2-progress.ts','m2-contract.ts','auth.ts']){
    const source=await Deno.readTextFile('supabase/functions/family-api/'+file);
    assert(!/from\s+["'][^"']*(?:tests|fixtures)/.test(source),'No production fixture import: '+file);
  }
});
