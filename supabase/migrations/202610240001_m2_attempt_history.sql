begin;
alter table private.child_sessions add constraint child_sessions_source_identity unique(id,device_id,child_id);
create table private.assessments (
  id text primary key check(length(id) between 1 and 160),
  module_key text not null,
  subject text not null check(subject in ('history','math','geography','language')),
  quarter smallint not null check(quarter in (1,2)),
  kind text not null check(kind in ('pop','exam')),
  set_key text not null check(length(set_key) between 1 and 40),
  content_revision integer not null check(content_revision>0),
  catalog_digest bytea not null check(octet_length(catalog_digest)=32),
  total smallint not null check(total between 1 and 100),
  grade_policy text not null check(grade_policy='deped-descriptor-rounded-v1'),
  label text not null check(length(label) between 1 and 120),
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  unique(module_key,kind,set_key,content_revision), unique(id,total,kind),
  check(module_key = initcap(subject)||'6_'||case when quarter=2 then 'Q2_' else '' end||'Review_Module_v1.0.0'),
  check(id=module_key||':'||kind||':'||set_key||':r'||content_revision),
  check((kind='exam' and set_key in ('exam-1','exam-2')) or
    (kind='pop' and set_key in ('flashcards','biomes','diagrams','tutor','cheat','practice')))
);
create table private.progress_heads (
  child_id uuid primary key references private.children(id) on delete restrict,
  revision bigint not null default 0 check(revision>=0)
);
insert into private.progress_heads(child_id) select id from private.children;
create table private.attempts (
  id uuid primary key, family_id uuid not null, child_id uuid not null,
  device_id uuid not null, authorization_session_id uuid not null,
  assessment_id text not null, kind text not null, total smallint not null,
  first_correct smallint not null check(first_correct>=0 and first_correct<=answered_count),
  answered_count smallint not null check(answered_count>=0 and answered_count<=total),
  finalized boolean not null check(finalized), completed_at timestamptz,
  time_quality text not null check(time_quality in ('anchored','client_unverified','unknown')),
  administered_fingerprint bytea not null check(octet_length(administered_fingerprint)=32),
  payload_digest bytea not null check(octet_length(payload_digest)=32),
  received_at timestamptz not null default date_trunc('milliseconds',clock_timestamp()),
  accepted_revision bigint not null check(accepted_revision>0),
  foreign key(family_id,child_id) references private.children(family_id,id) on delete restrict,
  foreign key(family_id,device_id) references private.devices(family_id,id) on delete restrict,
  foreign key(device_id,child_id) references private.device_children(device_id,child_id) on delete restrict,
  foreign key(authorization_session_id,device_id,child_id) references private.child_sessions(id,device_id,child_id) on delete restrict,
  foreign key(assessment_id,total,kind) references private.assessments(id,total,kind) on delete restrict,
  check(kind<>'pop' or answered_count=total),
  check(time_quality='unknown' or completed_at is not null),
  unique(id,child_id,total,kind), unique(child_id,accepted_revision)
);
create table private.attempt_corrections (
  attempt_id uuid primary key, child_id uuid not null, total smallint not null,
  kind text not null check(kind='pop'), final_correct smallint not null check(final_correct between 0 and total),
  captured_at timestamptz not null,
  foreign key(attempt_id,child_id,total,kind) references private.attempts(id,child_id,total,kind) on delete restrict
);
create index attempts_revision on private.attempts(child_id,accepted_revision);
create index attempts_assessment_completion on private.attempts(child_id,assessment_id,completed_at desc,id desc) where time_quality='anchored';
create index attempts_completion on private.attempts(child_id,completed_at desc,id desc);
create index attempts_receipt on private.attempts(child_id,received_at desc,id desc);
create index assessments_scope on private.assessments(subject,quarter,module_key,kind,set_key,content_revision);
alter table private.assessments enable row level security;
alter table private.attempts enable row level security;
alter table private.attempt_corrections enable row level security;
alter table private.progress_heads enable row level security;
revoke all on private.assessments,private.attempts,private.attempt_corrections,private.progress_heads from public,anon,authenticated;

create function private.m2_immutable() returns trigger language plpgsql set search_path='' as $$
begin
  raise exception 'Immutable assessment history';
end;
$$;
create trigger attempts_immutable before update or delete on private.attempts for each row execute function private.m2_immutable();
create trigger corrections_immutable before update or delete on private.attempt_corrections for each row execute function private.m2_immutable();
create function private.m2_catalog_immutable() returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op='DELETE' then raise exception 'Retain catalog history'; end if;
  if (to_jsonb(new)-'retired_at') is distinct from (to_jsonb(old)-'retired_at') then raise exception 'Immutable catalog semantics'; end if;
  return new;
end;
$$;
create trigger catalog_immutable before update or delete on private.assessments for each row execute function private.m2_catalog_immutable();
create function private.m2_correction_guard() returns trigger language plpgsql set search_path='' as $$
begin
  if not exists(select 1 from private.attempts a where a.id=new.attempt_id and a.first_correct<=new.final_correct
    -- MVCC exposes an uncommitted row only to its own transaction, including dispatcher subtransactions.
    and pg_catalog.pg_xact_status(a.xmin::text::xid8)='in progress') then raise exception 'Correction must accompany baseline'; end if;
  return new;
end;
$$;
create trigger correction_guard before insert on private.attempt_corrections for each row execute function private.m2_correction_guard();

insert into private.assessments(id,module_key,subject,quarter,kind,set_key,content_revision,catalog_digest,total,grade_policy,label)
select id,module_key,subject,quarter,kind,set_key,content_revision,decode(catalog_digest,'hex'),total,grade_policy,label
from jsonb_to_recordset($catalog$[{"id":"Geography6_Q2_Review_Module_v1.0.0:exam:exam-1:r1","module_key":"Geography6_Q2_Review_Module_v1.0.0","subject":"geography","quarter":2,"kind":"exam","set_key":"exam-1","content_revision":1,"catalog_digest":"4f91b8787430346051edfc87da7feb40aef6531a22247fd5f0972cb75e8947ae","total":70,"grade_policy":"deped-descriptor-rounded-v1","label":"geography Q2 exam exam-1","retired":false},{"id":"Geography6_Q2_Review_Module_v1.0.0:exam:exam-2:r1","module_key":"Geography6_Q2_Review_Module_v1.0.0","subject":"geography","quarter":2,"kind":"exam","set_key":"exam-2","content_revision":1,"catalog_digest":"4f91b8787430346051edfc87da7feb40aef6531a22247fd5f0972cb75e8947ae","total":70,"grade_policy":"deped-descriptor-rounded-v1","label":"geography Q2 exam exam-2","retired":false},{"id":"Geography6_Q2_Review_Module_v1.0.0:pop:biomes:r1","module_key":"Geography6_Q2_Review_Module_v1.0.0","subject":"geography","quarter":2,"kind":"pop","set_key":"biomes","content_revision":1,"catalog_digest":"36557026c08f5e9e39e99f695ac7174c7b28aa533f823a850f24ee59cc37464c","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"geography Q2 pop biomes","retired":false},{"id":"Geography6_Q2_Review_Module_v1.0.0:pop:cheat:r1","module_key":"Geography6_Q2_Review_Module_v1.0.0","subject":"geography","quarter":2,"kind":"pop","set_key":"cheat","content_revision":1,"catalog_digest":"36557026c08f5e9e39e99f695ac7174c7b28aa533f823a850f24ee59cc37464c","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"geography Q2 pop cheat","retired":false},{"id":"Geography6_Q2_Review_Module_v1.0.0:pop:diagrams:r1","module_key":"Geography6_Q2_Review_Module_v1.0.0","subject":"geography","quarter":2,"kind":"pop","set_key":"diagrams","content_revision":1,"catalog_digest":"36557026c08f5e9e39e99f695ac7174c7b28aa533f823a850f24ee59cc37464c","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"geography Q2 pop diagrams","retired":false},{"id":"Geography6_Q2_Review_Module_v1.0.0:pop:flashcards:r1","module_key":"Geography6_Q2_Review_Module_v1.0.0","subject":"geography","quarter":2,"kind":"pop","set_key":"flashcards","content_revision":1,"catalog_digest":"36557026c08f5e9e39e99f695ac7174c7b28aa533f823a850f24ee59cc37464c","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"geography Q2 pop flashcards","retired":false},{"id":"Geography6_Q2_Review_Module_v1.0.0:pop:practice:r1","module_key":"Geography6_Q2_Review_Module_v1.0.0","subject":"geography","quarter":2,"kind":"pop","set_key":"practice","content_revision":1,"catalog_digest":"36557026c08f5e9e39e99f695ac7174c7b28aa533f823a850f24ee59cc37464c","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"geography Q2 pop practice","retired":false},{"id":"Geography6_Q2_Review_Module_v1.0.0:pop:tutor:r1","module_key":"Geography6_Q2_Review_Module_v1.0.0","subject":"geography","quarter":2,"kind":"pop","set_key":"tutor","content_revision":1,"catalog_digest":"36557026c08f5e9e39e99f695ac7174c7b28aa533f823a850f24ee59cc37464c","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"geography Q2 pop tutor","retired":false},{"id":"Geography6_Review_Module_v1.0.0:exam:exam-1:r1","module_key":"Geography6_Review_Module_v1.0.0","subject":"geography","quarter":1,"kind":"exam","set_key":"exam-1","content_revision":1,"catalog_digest":"55d417dbcd222fa4af4dda3b46cf32adf3ba0352d298f32084becd87f8daf632","total":70,"grade_policy":"deped-descriptor-rounded-v1","label":"geography Q1 exam exam-1","retired":false},{"id":"Geography6_Review_Module_v1.0.0:exam:exam-2:r1","module_key":"Geography6_Review_Module_v1.0.0","subject":"geography","quarter":1,"kind":"exam","set_key":"exam-2","content_revision":1,"catalog_digest":"55d417dbcd222fa4af4dda3b46cf32adf3ba0352d298f32084becd87f8daf632","total":70,"grade_policy":"deped-descriptor-rounded-v1","label":"geography Q1 exam exam-2","retired":false},{"id":"Geography6_Review_Module_v1.0.0:pop:biomes:r1","module_key":"Geography6_Review_Module_v1.0.0","subject":"geography","quarter":1,"kind":"pop","set_key":"biomes","content_revision":1,"catalog_digest":"6aeae81de08de71734ccac3df19c9da4a585e4dc8ea8dd8a6b5c22fc478f294c","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"geography Q1 pop biomes","retired":false},{"id":"Geography6_Review_Module_v1.0.0:pop:cheat:r1","module_key":"Geography6_Review_Module_v1.0.0","subject":"geography","quarter":1,"kind":"pop","set_key":"cheat","content_revision":1,"catalog_digest":"6aeae81de08de71734ccac3df19c9da4a585e4dc8ea8dd8a6b5c22fc478f294c","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"geography Q1 pop cheat","retired":false},{"id":"Geography6_Review_Module_v1.0.0:pop:diagrams:r1","module_key":"Geography6_Review_Module_v1.0.0","subject":"geography","quarter":1,"kind":"pop","set_key":"diagrams","content_revision":1,"catalog_digest":"6aeae81de08de71734ccac3df19c9da4a585e4dc8ea8dd8a6b5c22fc478f294c","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"geography Q1 pop diagrams","retired":false},{"id":"Geography6_Review_Module_v1.0.0:pop:flashcards:r1","module_key":"Geography6_Review_Module_v1.0.0","subject":"geography","quarter":1,"kind":"pop","set_key":"flashcards","content_revision":1,"catalog_digest":"6aeae81de08de71734ccac3df19c9da4a585e4dc8ea8dd8a6b5c22fc478f294c","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"geography Q1 pop flashcards","retired":false},{"id":"Geography6_Review_Module_v1.0.0:pop:practice:r1","module_key":"Geography6_Review_Module_v1.0.0","subject":"geography","quarter":1,"kind":"pop","set_key":"practice","content_revision":1,"catalog_digest":"6aeae81de08de71734ccac3df19c9da4a585e4dc8ea8dd8a6b5c22fc478f294c","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"geography Q1 pop practice","retired":false},{"id":"Geography6_Review_Module_v1.0.0:pop:tutor:r1","module_key":"Geography6_Review_Module_v1.0.0","subject":"geography","quarter":1,"kind":"pop","set_key":"tutor","content_revision":1,"catalog_digest":"6aeae81de08de71734ccac3df19c9da4a585e4dc8ea8dd8a6b5c22fc478f294c","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"geography Q1 pop tutor","retired":false},{"id":"History6_Q2_Review_Module_v1.0.0:exam:exam-1:r1","module_key":"History6_Q2_Review_Module_v1.0.0","subject":"history","quarter":2,"kind":"exam","set_key":"exam-1","content_revision":1,"catalog_digest":"014ad99399a81ccd5ecea280d74482172b11ba31355b7866aeb2b94f3d2feabc","total":70,"grade_policy":"deped-descriptor-rounded-v1","label":"history Q2 exam exam-1","retired":false},{"id":"History6_Q2_Review_Module_v1.0.0:exam:exam-2:r1","module_key":"History6_Q2_Review_Module_v1.0.0","subject":"history","quarter":2,"kind":"exam","set_key":"exam-2","content_revision":1,"catalog_digest":"014ad99399a81ccd5ecea280d74482172b11ba31355b7866aeb2b94f3d2feabc","total":70,"grade_policy":"deped-descriptor-rounded-v1","label":"history Q2 exam exam-2","retired":false},{"id":"History6_Q2_Review_Module_v1.0.0:pop:biomes:r1","module_key":"History6_Q2_Review_Module_v1.0.0","subject":"history","quarter":2,"kind":"pop","set_key":"biomes","content_revision":1,"catalog_digest":"cfbce3a685780ac7c326ecdaffefa2f15ea66d33de157767b04424589f794275","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"history Q2 pop biomes","retired":false},{"id":"History6_Q2_Review_Module_v1.0.0:pop:cheat:r1","module_key":"History6_Q2_Review_Module_v1.0.0","subject":"history","quarter":2,"kind":"pop","set_key":"cheat","content_revision":1,"catalog_digest":"cfbce3a685780ac7c326ecdaffefa2f15ea66d33de157767b04424589f794275","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"history Q2 pop cheat","retired":false},{"id":"History6_Q2_Review_Module_v1.0.0:pop:diagrams:r1","module_key":"History6_Q2_Review_Module_v1.0.0","subject":"history","quarter":2,"kind":"pop","set_key":"diagrams","content_revision":1,"catalog_digest":"cfbce3a685780ac7c326ecdaffefa2f15ea66d33de157767b04424589f794275","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"history Q2 pop diagrams","retired":false},{"id":"History6_Q2_Review_Module_v1.0.0:pop:flashcards:r1","module_key":"History6_Q2_Review_Module_v1.0.0","subject":"history","quarter":2,"kind":"pop","set_key":"flashcards","content_revision":1,"catalog_digest":"cfbce3a685780ac7c326ecdaffefa2f15ea66d33de157767b04424589f794275","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"history Q2 pop flashcards","retired":false},{"id":"History6_Q2_Review_Module_v1.0.0:pop:practice:r1","module_key":"History6_Q2_Review_Module_v1.0.0","subject":"history","quarter":2,"kind":"pop","set_key":"practice","content_revision":1,"catalog_digest":"cfbce3a685780ac7c326ecdaffefa2f15ea66d33de157767b04424589f794275","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"history Q2 pop practice","retired":false},{"id":"History6_Q2_Review_Module_v1.0.0:pop:tutor:r1","module_key":"History6_Q2_Review_Module_v1.0.0","subject":"history","quarter":2,"kind":"pop","set_key":"tutor","content_revision":1,"catalog_digest":"cfbce3a685780ac7c326ecdaffefa2f15ea66d33de157767b04424589f794275","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"history Q2 pop tutor","retired":false},{"id":"History6_Review_Module_v1.0.0:exam:exam-1:r1","module_key":"History6_Review_Module_v1.0.0","subject":"history","quarter":1,"kind":"exam","set_key":"exam-1","content_revision":1,"catalog_digest":"c8333093f728f26d9ffdbb5ca1bc3a76488cedb2a3b5289b6e56bbb2244a2b60","total":70,"grade_policy":"deped-descriptor-rounded-v1","label":"history Q1 exam exam-1","retired":false},{"id":"History6_Review_Module_v1.0.0:exam:exam-2:r1","module_key":"History6_Review_Module_v1.0.0","subject":"history","quarter":1,"kind":"exam","set_key":"exam-2","content_revision":1,"catalog_digest":"c8333093f728f26d9ffdbb5ca1bc3a76488cedb2a3b5289b6e56bbb2244a2b60","total":70,"grade_policy":"deped-descriptor-rounded-v1","label":"history Q1 exam exam-2","retired":false},{"id":"History6_Review_Module_v1.0.0:pop:biomes:r1","module_key":"History6_Review_Module_v1.0.0","subject":"history","quarter":1,"kind":"pop","set_key":"biomes","content_revision":1,"catalog_digest":"af21cfdbd723f8a561675ace1f310d0a477c50b5129240f38d1dbb8b25b4a05d","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"history Q1 pop biomes","retired":false},{"id":"History6_Review_Module_v1.0.0:pop:cheat:r1","module_key":"History6_Review_Module_v1.0.0","subject":"history","quarter":1,"kind":"pop","set_key":"cheat","content_revision":1,"catalog_digest":"af21cfdbd723f8a561675ace1f310d0a477c50b5129240f38d1dbb8b25b4a05d","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"history Q1 pop cheat","retired":false},{"id":"History6_Review_Module_v1.0.0:pop:diagrams:r1","module_key":"History6_Review_Module_v1.0.0","subject":"history","quarter":1,"kind":"pop","set_key":"diagrams","content_revision":1,"catalog_digest":"af21cfdbd723f8a561675ace1f310d0a477c50b5129240f38d1dbb8b25b4a05d","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"history Q1 pop diagrams","retired":false},{"id":"History6_Review_Module_v1.0.0:pop:flashcards:r1","module_key":"History6_Review_Module_v1.0.0","subject":"history","quarter":1,"kind":"pop","set_key":"flashcards","content_revision":1,"catalog_digest":"af21cfdbd723f8a561675ace1f310d0a477c50b5129240f38d1dbb8b25b4a05d","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"history Q1 pop flashcards","retired":false},{"id":"History6_Review_Module_v1.0.0:pop:practice:r1","module_key":"History6_Review_Module_v1.0.0","subject":"history","quarter":1,"kind":"pop","set_key":"practice","content_revision":1,"catalog_digest":"af21cfdbd723f8a561675ace1f310d0a477c50b5129240f38d1dbb8b25b4a05d","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"history Q1 pop practice","retired":false},{"id":"History6_Review_Module_v1.0.0:pop:tutor:r1","module_key":"History6_Review_Module_v1.0.0","subject":"history","quarter":1,"kind":"pop","set_key":"tutor","content_revision":1,"catalog_digest":"af21cfdbd723f8a561675ace1f310d0a477c50b5129240f38d1dbb8b25b4a05d","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"history Q1 pop tutor","retired":false},{"id":"Language6_Q2_Review_Module_v1.0.0:exam:exam-1:r1","module_key":"Language6_Q2_Review_Module_v1.0.0","subject":"language","quarter":2,"kind":"exam","set_key":"exam-1","content_revision":1,"catalog_digest":"9a7383abc46d991309724702a1773f8fec32e0c0d2405b5440ed2fe9d1603a12","total":70,"grade_policy":"deped-descriptor-rounded-v1","label":"language Q2 exam exam-1","retired":false},{"id":"Language6_Q2_Review_Module_v1.0.0:exam:exam-2:r1","module_key":"Language6_Q2_Review_Module_v1.0.0","subject":"language","quarter":2,"kind":"exam","set_key":"exam-2","content_revision":1,"catalog_digest":"9a7383abc46d991309724702a1773f8fec32e0c0d2405b5440ed2fe9d1603a12","total":70,"grade_policy":"deped-descriptor-rounded-v1","label":"language Q2 exam exam-2","retired":false},{"id":"Language6_Q2_Review_Module_v1.0.0:pop:biomes:r1","module_key":"Language6_Q2_Review_Module_v1.0.0","subject":"language","quarter":2,"kind":"pop","set_key":"biomes","content_revision":1,"catalog_digest":"ea5e8fed4e25408aed3f0a3a730a58da3c3d206e64dd2a288c5c1a480a4f288b","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"language Q2 pop biomes","retired":false},{"id":"Language6_Q2_Review_Module_v1.0.0:pop:cheat:r1","module_key":"Language6_Q2_Review_Module_v1.0.0","subject":"language","quarter":2,"kind":"pop","set_key":"cheat","content_revision":1,"catalog_digest":"ea5e8fed4e25408aed3f0a3a730a58da3c3d206e64dd2a288c5c1a480a4f288b","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"language Q2 pop cheat","retired":false},{"id":"Language6_Q2_Review_Module_v1.0.0:pop:diagrams:r1","module_key":"Language6_Q2_Review_Module_v1.0.0","subject":"language","quarter":2,"kind":"pop","set_key":"diagrams","content_revision":1,"catalog_digest":"ea5e8fed4e25408aed3f0a3a730a58da3c3d206e64dd2a288c5c1a480a4f288b","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"language Q2 pop diagrams","retired":false},{"id":"Language6_Q2_Review_Module_v1.0.0:pop:flashcards:r1","module_key":"Language6_Q2_Review_Module_v1.0.0","subject":"language","quarter":2,"kind":"pop","set_key":"flashcards","content_revision":1,"catalog_digest":"ea5e8fed4e25408aed3f0a3a730a58da3c3d206e64dd2a288c5c1a480a4f288b","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"language Q2 pop flashcards","retired":false},{"id":"Language6_Q2_Review_Module_v1.0.0:pop:practice:r1","module_key":"Language6_Q2_Review_Module_v1.0.0","subject":"language","quarter":2,"kind":"pop","set_key":"practice","content_revision":1,"catalog_digest":"ea5e8fed4e25408aed3f0a3a730a58da3c3d206e64dd2a288c5c1a480a4f288b","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"language Q2 pop practice","retired":false},{"id":"Language6_Q2_Review_Module_v1.0.0:pop:tutor:r1","module_key":"Language6_Q2_Review_Module_v1.0.0","subject":"language","quarter":2,"kind":"pop","set_key":"tutor","content_revision":1,"catalog_digest":"ea5e8fed4e25408aed3f0a3a730a58da3c3d206e64dd2a288c5c1a480a4f288b","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"language Q2 pop tutor","retired":false},{"id":"Language6_Review_Module_v1.0.0:exam:exam-1:r1","module_key":"Language6_Review_Module_v1.0.0","subject":"language","quarter":1,"kind":"exam","set_key":"exam-1","content_revision":1,"catalog_digest":"409b905e2dca2a5d2546f1fc712e05c696b01f613488e94d65cf1ac5ead4d1b7","total":70,"grade_policy":"deped-descriptor-rounded-v1","label":"language Q1 exam exam-1","retired":false},{"id":"Language6_Review_Module_v1.0.0:exam:exam-2:r1","module_key":"Language6_Review_Module_v1.0.0","subject":"language","quarter":1,"kind":"exam","set_key":"exam-2","content_revision":1,"catalog_digest":"409b905e2dca2a5d2546f1fc712e05c696b01f613488e94d65cf1ac5ead4d1b7","total":70,"grade_policy":"deped-descriptor-rounded-v1","label":"language Q1 exam exam-2","retired":false},{"id":"Language6_Review_Module_v1.0.0:pop:biomes:r1","module_key":"Language6_Review_Module_v1.0.0","subject":"language","quarter":1,"kind":"pop","set_key":"biomes","content_revision":1,"catalog_digest":"fe406106bade38860b4aeb4341486bb6fb96999367f57ce34077d86b6bc8b804","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"language Q1 pop biomes","retired":false},{"id":"Language6_Review_Module_v1.0.0:pop:cheat:r1","module_key":"Language6_Review_Module_v1.0.0","subject":"language","quarter":1,"kind":"pop","set_key":"cheat","content_revision":1,"catalog_digest":"fe406106bade38860b4aeb4341486bb6fb96999367f57ce34077d86b6bc8b804","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"language Q1 pop cheat","retired":false},{"id":"Language6_Review_Module_v1.0.0:pop:diagrams:r1","module_key":"Language6_Review_Module_v1.0.0","subject":"language","quarter":1,"kind":"pop","set_key":"diagrams","content_revision":1,"catalog_digest":"fe406106bade38860b4aeb4341486bb6fb96999367f57ce34077d86b6bc8b804","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"language Q1 pop diagrams","retired":false},{"id":"Language6_Review_Module_v1.0.0:pop:flashcards:r1","module_key":"Language6_Review_Module_v1.0.0","subject":"language","quarter":1,"kind":"pop","set_key":"flashcards","content_revision":1,"catalog_digest":"fe406106bade38860b4aeb4341486bb6fb96999367f57ce34077d86b6bc8b804","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"language Q1 pop flashcards","retired":false},{"id":"Language6_Review_Module_v1.0.0:pop:practice:r1","module_key":"Language6_Review_Module_v1.0.0","subject":"language","quarter":1,"kind":"pop","set_key":"practice","content_revision":1,"catalog_digest":"fe406106bade38860b4aeb4341486bb6fb96999367f57ce34077d86b6bc8b804","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"language Q1 pop practice","retired":false},{"id":"Language6_Review_Module_v1.0.0:pop:tutor:r1","module_key":"Language6_Review_Module_v1.0.0","subject":"language","quarter":1,"kind":"pop","set_key":"tutor","content_revision":1,"catalog_digest":"fe406106bade38860b4aeb4341486bb6fb96999367f57ce34077d86b6bc8b804","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"language Q1 pop tutor","retired":false},{"id":"Math6_Q2_Review_Module_v1.0.0:exam:exam-1:r1","module_key":"Math6_Q2_Review_Module_v1.0.0","subject":"math","quarter":2,"kind":"exam","set_key":"exam-1","content_revision":1,"catalog_digest":"b6cbc35d043e8cac65afaffa8808bfc7e7de7fb683541f999cb4ccd1cbb13cf4","total":70,"grade_policy":"deped-descriptor-rounded-v1","label":"math Q2 exam exam-1","retired":false},{"id":"Math6_Q2_Review_Module_v1.0.0:exam:exam-2:r1","module_key":"Math6_Q2_Review_Module_v1.0.0","subject":"math","quarter":2,"kind":"exam","set_key":"exam-2","content_revision":1,"catalog_digest":"b6cbc35d043e8cac65afaffa8808bfc7e7de7fb683541f999cb4ccd1cbb13cf4","total":70,"grade_policy":"deped-descriptor-rounded-v1","label":"math Q2 exam exam-2","retired":false},{"id":"Math6_Q2_Review_Module_v1.0.0:pop:biomes:r1","module_key":"Math6_Q2_Review_Module_v1.0.0","subject":"math","quarter":2,"kind":"pop","set_key":"biomes","content_revision":1,"catalog_digest":"0814400a8a95fbfa31ffd28c2b16396767213c2016c8c2e9f45da96940a987d3","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"math Q2 pop biomes","retired":false},{"id":"Math6_Q2_Review_Module_v1.0.0:pop:cheat:r1","module_key":"Math6_Q2_Review_Module_v1.0.0","subject":"math","quarter":2,"kind":"pop","set_key":"cheat","content_revision":1,"catalog_digest":"0814400a8a95fbfa31ffd28c2b16396767213c2016c8c2e9f45da96940a987d3","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"math Q2 pop cheat","retired":false},{"id":"Math6_Q2_Review_Module_v1.0.0:pop:diagrams:r1","module_key":"Math6_Q2_Review_Module_v1.0.0","subject":"math","quarter":2,"kind":"pop","set_key":"diagrams","content_revision":1,"catalog_digest":"0814400a8a95fbfa31ffd28c2b16396767213c2016c8c2e9f45da96940a987d3","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"math Q2 pop diagrams","retired":false},{"id":"Math6_Q2_Review_Module_v1.0.0:pop:flashcards:r1","module_key":"Math6_Q2_Review_Module_v1.0.0","subject":"math","quarter":2,"kind":"pop","set_key":"flashcards","content_revision":1,"catalog_digest":"0814400a8a95fbfa31ffd28c2b16396767213c2016c8c2e9f45da96940a987d3","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"math Q2 pop flashcards","retired":false},{"id":"Math6_Q2_Review_Module_v1.0.0:pop:practice:r1","module_key":"Math6_Q2_Review_Module_v1.0.0","subject":"math","quarter":2,"kind":"pop","set_key":"practice","content_revision":1,"catalog_digest":"0814400a8a95fbfa31ffd28c2b16396767213c2016c8c2e9f45da96940a987d3","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"math Q2 pop practice","retired":false},{"id":"Math6_Q2_Review_Module_v1.0.0:pop:tutor:r1","module_key":"Math6_Q2_Review_Module_v1.0.0","subject":"math","quarter":2,"kind":"pop","set_key":"tutor","content_revision":1,"catalog_digest":"0814400a8a95fbfa31ffd28c2b16396767213c2016c8c2e9f45da96940a987d3","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"math Q2 pop tutor","retired":false},{"id":"Math6_Review_Module_v1.0.0:exam:exam-1:r1","module_key":"Math6_Review_Module_v1.0.0","subject":"math","quarter":1,"kind":"exam","set_key":"exam-1","content_revision":1,"catalog_digest":"fd83fe906f693e455a2f3056abfaf078688a62f21fcd70b5237c3e91788321fe","total":70,"grade_policy":"deped-descriptor-rounded-v1","label":"math Q1 exam exam-1","retired":false},{"id":"Math6_Review_Module_v1.0.0:exam:exam-2:r1","module_key":"Math6_Review_Module_v1.0.0","subject":"math","quarter":1,"kind":"exam","set_key":"exam-2","content_revision":1,"catalog_digest":"fd83fe906f693e455a2f3056abfaf078688a62f21fcd70b5237c3e91788321fe","total":70,"grade_policy":"deped-descriptor-rounded-v1","label":"math Q1 exam exam-2","retired":false},{"id":"Math6_Review_Module_v1.0.0:pop:biomes:r1","module_key":"Math6_Review_Module_v1.0.0","subject":"math","quarter":1,"kind":"pop","set_key":"biomes","content_revision":1,"catalog_digest":"99c512ed33868402ab051703f372008e8a9d915ee967ee29ba1b5e4b10b6c3de","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"math Q1 pop biomes","retired":false},{"id":"Math6_Review_Module_v1.0.0:pop:cheat:r1","module_key":"Math6_Review_Module_v1.0.0","subject":"math","quarter":1,"kind":"pop","set_key":"cheat","content_revision":1,"catalog_digest":"99c512ed33868402ab051703f372008e8a9d915ee967ee29ba1b5e4b10b6c3de","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"math Q1 pop cheat","retired":false},{"id":"Math6_Review_Module_v1.0.0:pop:diagrams:r1","module_key":"Math6_Review_Module_v1.0.0","subject":"math","quarter":1,"kind":"pop","set_key":"diagrams","content_revision":1,"catalog_digest":"99c512ed33868402ab051703f372008e8a9d915ee967ee29ba1b5e4b10b6c3de","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"math Q1 pop diagrams","retired":false},{"id":"Math6_Review_Module_v1.0.0:pop:flashcards:r1","module_key":"Math6_Review_Module_v1.0.0","subject":"math","quarter":1,"kind":"pop","set_key":"flashcards","content_revision":1,"catalog_digest":"99c512ed33868402ab051703f372008e8a9d915ee967ee29ba1b5e4b10b6c3de","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"math Q1 pop flashcards","retired":false},{"id":"Math6_Review_Module_v1.0.0:pop:practice:r1","module_key":"Math6_Review_Module_v1.0.0","subject":"math","quarter":1,"kind":"pop","set_key":"practice","content_revision":1,"catalog_digest":"99c512ed33868402ab051703f372008e8a9d915ee967ee29ba1b5e4b10b6c3de","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"math Q1 pop practice","retired":false},{"id":"Math6_Review_Module_v1.0.0:pop:tutor:r1","module_key":"Math6_Review_Module_v1.0.0","subject":"math","quarter":1,"kind":"pop","set_key":"tutor","content_revision":1,"catalog_digest":"99c512ed33868402ab051703f372008e8a9d915ee967ee29ba1b5e4b10b6c3de","total":20,"grade_policy":"deped-descriptor-rounded-v1","label":"math Q1 pop tutor","retired":false}]$catalog$::jsonb)
as rows(id text,module_key text,subject text,quarter smallint,kind text,set_key text,content_revision integer,catalog_digest text,total smallint,grade_policy text,label text);

alter function public.family_dispatch(text,jsonb,jsonb) rename to family_dispatch_m1;
alter function public.family_dispatch_m1(text,jsonb,jsonb) set schema private;
revoke all on function private.family_dispatch_m1(text,jsonb,jsonb) from public,anon,authenticated;

create function private.m2_envelope(attempt_uuid uuid) returns jsonb language sql stable set search_path='' as $$
  select jsonb_build_object('client_version',1,'attempt',jsonb_build_object(
    'id',a.id,'authorization_session_id',a.authorization_session_id,'assessment_id',a.assessment_id,
    'first_correct',a.first_correct,'answered_count',a.answered_count,'total',a.total,'finalized',true,
    'completed_at',case when a.completed_at is null then null else to_char(a.completed_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') end,
    'time_quality',a.time_quality,'administered_fingerprint',encode(a.administered_fingerprint,'hex')))
    || case when c.attempt_id is null then '{}'::jsonb else jsonb_build_object('correction',jsonb_build_object(
      'final_correct',c.final_correct,'captured_at',to_char(c.captured_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))) end
  from private.attempts a left join private.attempt_corrections c on c.attempt_id=a.id where a.id=attempt_uuid;
$$;

create function private.m2_save_receipt(child_uuid uuid, context jsonb, response jsonb)
returns void language sql set search_path='' as $$
  insert into private.api_receipts(principal_kind,principal_id,idempotency_key,operation,payload_digest,encrypted_response)
    values('m2_child',child_uuid,(context->>'idempotency_key')::uuid,'child_attempt_record',context->>'payload_digest',
      extensions.pgp_sym_encrypt(response::text,context->>'receipt_key','cipher-algo=aes256'))
  on conflict(principal_kind,principal_id,idempotency_key) do update set payload_digest=excluded.payload_digest,
    encrypted_response=excluded.encrypted_response,created_at=now(),expires_at=now()+interval '24 hours';
$$;

create function public.family_dispatch(operation text, credential_context jsonb, payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  viewer private.child_sessions; source private.child_sessions; learner private.children;
  household private.families; tablet private.devices; assessment private.assessments; prior private.attempts;
  envelope jsonb; attempt jsonb; correction jsonb; attempt_uuid uuid; head bigint; snapshot bigint;
  result jsonb; rows jsonb; counts jsonb; now_utc text; q integer; delivery private.api_receipts;
begin
  if operation not in ('m2_capabilities','child_catalog','parent_catalog','child_attempt_record',
    'child_progress','parent_progress','child_attempts','parent_attempts','child_m2_scope','parent_m2_scope') then
    result := private.family_dispatch_m1(operation,credential_context,payload);
    if operation='child_bootstrap' and not coalesce((result->>'_error')::boolean,false) then
      select revision into head from private.progress_heads where child_id=(result->'child'->>'id')::uuid;
      return result || jsonb_build_object('capabilities',jsonb_build_array('family_access','assessment_history_v1','progress_summary_v1'),
        'contract_version',1,'catalog_version',1,'catalog_digest','7135e117adf31f172c1cbc0f4710374d4fd0891645e42a77eacdc69d6ce612c6','progress_revision',coalesce(head,0)::text);
    end if;
    return result;
  end if;
  if operation='m2_capabilities' then return jsonb_build_object('contract_version',1,'catalog_digest','7135e117adf31f172c1cbc0f4710374d4fd0891645e42a77eacdc69d6ce612c6',
    'catalog_count',(select count(*) from private.assessments)); end if;
  if operation like 'parent_%' then
    select * into household from private.families where owner_auth_id=(credential_context->>'owner_id')::uuid for share;
    if not found then return private.fail(403,'PARENT_NOT_PROVISIONED','This account has no family access.'); end if;
    if operation<>'parent_catalog' then
      select * into learner from private.children where id=(payload->>'child_id')::uuid and family_id=household.id and archived_at is null for share;
      if not found then return private.fail(404,'PROFILE_NOT_FOUND','This profile is unavailable.'); end if;
    end if;
  else
    select * into viewer from private.child_sessions where token_hash=decode(credential_context->>'token_hash','hex') for share;
    if not found or viewer.revoked_at is not null or viewer.expires_at<=now() then
      return private.fail(401,'UNLOCK_REQUIRED','Unlock online to continue.'); end if;
    select * into tablet from private.devices where id=viewer.device_id for share;
    select * into learner from private.children where id=viewer.child_id for share;
    if tablet.revoked_at is not null or tablet.expires_at<=now() or tablet.generation<>viewer.device_generation
      or learner.archived_at is not null or learner.pin_version<>viewer.pin_version or not learner.id=any(tablet.allowed_child_ids)
      or not exists(select 1 from private.device_children where device_id=tablet.id and child_id=learner.id) then
      return private.fail(403,'ACCESS_CHANGED','Ask your parent to approve this profile again.'); end if;
    select * into household from private.families where id=learner.family_id;
  end if;
  if operation in ('child_catalog','parent_catalog') then return jsonb_build_object('authorized',true); end if;
  select coalesce(revision,0) into head from private.progress_heads where child_id=learner.id;
  head:=coalesce(head,0);
  now_utc:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  if operation in ('child_m2_scope','parent_m2_scope') then return jsonb_build_object(
    'child',jsonb_build_object('id',learner.id,'display_name',learner.display_name),'family_id',household.id,'revision',head::text); end if;
  if operation='child_attempt_record' then
    envelope:=payload->'envelope'; attempt:=envelope->'attempt'; correction:=envelope->'correction';
    attempt_uuid:=(attempt->>'id')::uuid;
    select * into source from private.child_sessions where id=(attempt->>'authorization_session_id')::uuid for share;
    if not found or source.child_id<>learner.id or source.device_id<>tablet.id or source.revoked_at is not null
      or source.pin_version<>learner.pin_version or source.device_generation<>tablet.generation then
      return private.fail(403,'ACCESS_CHANGED','The originating authorization is unavailable.'); end if;
    if (attempt->>'completed_at')::timestamptz>now()+interval '2 minutes' or
      (attempt->>'time_quality'='anchored' and ((attempt->>'completed_at')::timestamptz<source.created_at or
        (attempt->>'completed_at')::timestamptz>source.expires_at)) then
      return private.fail(422,'INVALID_TIME','Completion chronology is invalid.'); end if;
    insert into private.progress_heads(child_id) values(learner.id) on conflict do nothing;
    select revision into head from private.progress_heads where child_id=learner.id for update;
    if credential_context->>'idempotency_key' is null or credential_context->>'payload_digest' is null then
      return private.fail(400,'IDEMPOTENCY_REQUIRED','A mutation identifier is required.'); end if;
    select * into delivery from private.api_receipts where principal_kind='m2_child' and principal_id=learner.id
      and idempotency_key=(credential_context->>'idempotency_key')::uuid and expires_at>now();
    if found and (delivery.operation<>'child_attempt_record' or delivery.payload_digest<>credential_context->>'payload_digest') then
      return private.fail(409,'IDEMPOTENCY_CONFLICT','This mutation identifier already represents different work.'); end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('m2-attempt:'||attempt_uuid::text,0));
    select * into prior from private.attempts where id=attempt_uuid;
    if found then
      if prior.child_id<>learner.id or prior.device_id<>tablet.id then return private.fail(404,'PROFILE_NOT_FOUND','This result is unavailable.'); end if;
      if prior.payload_digest<>decode(payload->>'permanent_digest','hex') then return private.fail(409,'ATTEMPT_CONFLICT','This attempt identifier already represents different work.'); end if;
      result:=jsonb_build_object('attempt_id',prior.id,'status','duplicate','received_at',to_char(prior.received_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'provenance','server','revision',prior.accepted_revision::text);
      perform private.m2_save_receipt(learner.id,credential_context,result);
      return result;
    end if;
    select * into assessment from private.assessments where id=attempt->>'assessment_id';
    if not found then return private.fail(404,'ASSESSMENT_NOT_FOUND','Assessment version unavailable.'); end if;
    if (attempt->>'total')::integer<>assessment.total or (attempt->>'finalized')::boolean is distinct from true
      or (attempt->>'first_correct')::integer<0 or (attempt->>'first_correct')::integer>(attempt->>'answered_count')::integer
      or (attempt->>'answered_count')::integer>assessment.total or (assessment.kind='pop' and (attempt->>'answered_count')::integer<>assessment.total) then
      return private.fail(422,'INVALID_RESULT','This finalized result is invalid.'); end if;
    insert into private.attempts(id,family_id,child_id,device_id,authorization_session_id,assessment_id,kind,total,
      first_correct,answered_count,finalized,completed_at,time_quality,administered_fingerprint,payload_digest,accepted_revision)
      values(attempt_uuid,household.id,learner.id,tablet.id,source.id,assessment.id,assessment.kind,assessment.total,
        (attempt->>'first_correct')::smallint,(attempt->>'answered_count')::smallint,true,(attempt->>'completed_at')::timestamptz,
        attempt->>'time_quality',decode(attempt->>'administered_fingerprint','hex'),decode(payload->>'permanent_digest','hex'),head+1) returning * into prior;
    if correction is not null then
      insert into private.attempt_corrections(attempt_id,child_id,total,kind,final_correct,captured_at)
        values(attempt_uuid,learner.id,assessment.total,assessment.kind,(correction->>'final_correct')::smallint,(correction->>'captured_at')::timestamptz);
    end if;
    update private.progress_heads set revision=head+1 where child_id=learner.id;
    result:=jsonb_build_object('attempt_id',prior.id,'status','accepted','received_at',to_char(prior.received_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'provenance','server','revision',prior.accepted_revision::text);
    perform private.m2_save_receipt(learner.id,credential_context,result);
    return result;
  end if;
  snapshot:=(payload->>'revision')::bigint; q:=(payload->>'quarter')::integer;
  if snapshot is null or snapshot<0 or snapshot>head then return private.fail(400,'INVALID_CURSOR','History position is invalid.'); end if;
  if q not in (1,2) or q is null then return private.fail(400,'INVALID_FILTER','Choose a quarter.'); end if;
  if payload ? 'last' and not exists(select 1 from private.attempts a join private.assessments s on s.id=a.assessment_id
    where a.id=(payload->'last'->>'id')::uuid and a.child_id=learner.id and a.accepted_revision<=snapshot and s.quarter=q
      and (payload->>'subject' is null or s.subject=payload->>'subject')
      and (payload->>'kind' is null or s.kind=payload->>'kind')
      and (payload->>'assessment_id' is null or s.id=payload->>'assessment_id')
      and a.time_quality=payload->'last'->>'time_quality'
      and a.completed_at is not distinct from (payload->'last'->>'completed_at')::timestamptz
      and date_trunc('milliseconds',a.received_at)=(payload->'last'->>'received_at')::timestamptz) then
    return private.fail(400,'INVALID_CURSOR','History position is invalid.'); end if;
  if operation in ('child_progress','parent_progress') then
    with scoped as (
      select a.*,s.subject,s.kind catalog_kind from private.attempts a join private.assessments s on s.id=a.assessment_id
      where a.child_id=learner.id and a.accepted_revision<=snapshot and s.quarter=q
    ), ranked as (
      select *,row_number() over(partition by assessment_id,time_quality='anchored' order by
        case when time_quality='anchored' then completed_at else received_at end desc,id desc) rn from scoped
    ) select coalesce(jsonb_agg(jsonb_build_object('envelope',private.m2_envelope(id),'received_at',to_char(received_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))),'[]') into rows from ranked
      where (time_quality='anchored' and rn<=2) or (time_quality<>'anchored' and rn=1);
    select coalesce(jsonb_agg(jsonb_build_object('subject',s.subject,'kind',s.kind,'count',n)),'[]') into counts from (
      select c.subject,c.kind,count(*) n from private.attempts a join private.assessments c on c.id=a.assessment_id
      where a.child_id=learner.id and a.accepted_revision<=snapshot and c.quarter=q and a.time_quality<>'anchored' group by c.subject,c.kind) s;
  else
    select coalesce(jsonb_agg(jsonb_build_object('envelope',private.m2_envelope(id),'received_at',to_char(received_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) order by anchored desc,ordered_at desc,id desc),'[]') into rows from (
      select a.*,a.time_quality='anchored' anchored,case when a.time_quality='anchored' then a.completed_at else a.received_at end ordered_at
      from private.attempts a join private.assessments s on s.id=a.assessment_id
      where a.child_id=learner.id and a.accepted_revision<=snapshot and s.quarter=q
        and (payload->>'subject' is null or s.subject=payload->>'subject')
        and (payload->>'kind' is null or s.kind=payload->>'kind')
        and (payload->>'assessment_id' is null or s.id=payload->>'assessment_id')
        and (payload->'last' is null or (
          ((a.time_quality='anchored')::integer,case when a.time_quality='anchored' then a.completed_at else a.received_at end,a.id)
          < (((payload->'last'->>'time_quality')='anchored')::integer,
          case when payload->'last'->>'time_quality'='anchored' then (payload->'last'->>'completed_at')::timestamptz else (payload->'last'->>'received_at')::timestamptz end,
          (payload->'last'->>'id')::uuid)))
      order by anchored desc,ordered_at desc,a.id desc limit least(101,(payload->>'limit')::integer+1)
    ) page;
  end if;
  return jsonb_build_object('child',jsonb_build_object('id',learner.id,'display_name',learner.display_name),
    'rows',rows,'chronology_counts',counts,'revision',snapshot::text,'as_of',now_utc);
exception when invalid_text_representation or numeric_value_out_of_range or check_violation or not_null_violation then
  return private.fail(422,'INVALID_RESULT','This finalized result is invalid.');
end;
$$;
revoke all on function public.family_dispatch(text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.family_dispatch(text,jsonb,jsonb) to service_role;
revoke all on function private.m2_immutable(),private.m2_catalog_immutable(),private.m2_correction_guard(),private.m2_envelope(uuid),private.m2_save_receipt(uuid,jsonb,jsonb) from public,anon,authenticated;
commit;
