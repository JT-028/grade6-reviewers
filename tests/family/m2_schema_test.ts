const enabled=Deno.env.get('FAMILY_REAL_STACK')==='1';
async function command(database:string,query:string){
  const process=new Deno.Command('docker',{args:['exec','-i','supabase_db_grade6-reviewers-family','psql','-U','postgres','-d',database,'-X','-qAt','-v','ON_ERROR_STOP=1'],stdin:'piped',stdout:'piped',stderr:'piped'}).spawn();
  const writer=process.stdin.getWriter();await writer.write(new TextEncoder().encode(query));await writer.close();const result=await process.output();
  if(!result.success){await Deno.writeTextFile('test-results/m2-schema-error.log',new TextDecoder().decode(result.stderr));throw new Error('Exact local migration proof failed; inspect ignored diagnostics.');}return new TextDecoder().decode(result.stdout).trim();
}
Deno.test({name:'M2 exact final M1+M2 SQL applies transactionally in independent real pgcrypto database',ignore:!enabled,fn:async()=>{
  const name='m2_bridge_proof_'+crypto.randomUUID().replaceAll('-','');
  await command('postgres','create database '+name+';');
  await command(name,'create schema auth; create table auth.users(id uuid primary key);');
  await command(name,await Deno.readTextFile('supabase/migrations/202610230001_family_access.sql'));
  await command(name,await Deno.readTextFile('supabase/migrations/202610240001_m2_attempt_history.sql'));
  const actual=await command(name,`select (select count(*) from private.assessments)=64
    and exists(select 1 from pg_extension where extname='pgcrypto')
    and not has_table_privilege('anon','private.attempts','SELECT')
    and not has_function_privilege('authenticated','public.family_dispatch(text,jsonb,jsonb)','EXECUTE')
    and has_function_privilege('service_role','public.family_dispatch(text,jsonb,jsonb)','EXECUTE');`);
  if(actual!=='t')throw new Error('Exact migration grant/catalog verification failed');
  // PostgreSQL preserves source CRLF inside function bodies; normalize CR only for cross-tool semantic comparison.
  const functions=`select p.proname||':'||md5(replace(pg_get_functiondef(p.oid),chr(13),'')) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='private' and (p.proname like 'm2_%' or p.proname='family_dispatch_m1')) or (n.nspname='public' and p.proname='family_dispatch') order by p.proname;`;
  const fresh=await command(name,functions),integration=await command('postgres',functions);
  if(fresh!==integration)throw new Error('Integration function bodies differ from exact final migration');
  await Deno.writeTextFile('test-results/m2-schema-proof.json',JSON.stringify({database:name,exact_migrations:true,real_pgcrypto:true,functions_match_integration:true,retained_for_review:true}));
}});
