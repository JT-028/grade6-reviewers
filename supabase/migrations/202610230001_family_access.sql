begin;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.families (
  id uuid primary key default extensions.gen_random_uuid(),
  singleton boolean not null default true unique check (singleton),
  owner_auth_id uuid not null unique references auth.users(id) on delete restrict,
  timezone text not null default 'Asia/Manila' check (timezone = 'Asia/Manila'),
  created_at timestamptz not null default now()
);
create table private.children (
  id uuid primary key,
  family_id uuid not null references private.families(id) on delete restrict,
  display_name text not null check (display_name = btrim(display_name) and length(display_name) between 1 and 40),
  pin_salt bytea not null check (octet_length(pin_salt) = 16),
  pin_hash bytea not null check (octet_length(pin_hash) = 32),
  pin_version integer not null default 1 check (pin_version >= 1),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (family_id, id)
);
create table private.devices (
  id uuid primary key,
  family_id uuid not null references private.families(id) on delete restrict,
  label text not null check (length(btrim(label)) between 1 and 60),
  token_hash bytea not null unique check (octet_length(token_hash) = 32),
  approved_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days'),
  revoked_at timestamptz,
  generation integer not null default 1 check (generation >= 1),
  last_seen_at timestamptz,
  unique (family_id, id),
  check (expires_at > approved_at)
);
create table private.device_children (
  device_id uuid not null,
  child_id uuid not null,
  family_id uuid not null,
  cache_key bytea not null default extensions.gen_random_bytes(32) check (octet_length(cache_key) = 32),
  primary key (device_id, child_id),
  foreign key (family_id, device_id) references private.devices(family_id, id) on delete restrict,
  foreign key (family_id, child_id) references private.children(family_id, id) on delete restrict
);
create table private.pair_requests (
  id uuid primary key,
  code_hash bytea not null unique check (octet_length(code_hash) = 32),
  poll_hash bytea not null check (octet_length(poll_hash) = 32),
  device_label text not null check (length(btrim(device_label)) between 1 and 60),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  approved_family uuid,
  device_id uuid,
  encrypted_claim bytea,
  claimed_at timestamptz,
  foreign key (approved_family, device_id) references private.devices(family_id, id) on delete restrict,
  check ((approved_family is null) = (device_id is null))
);
create table private.child_sessions (
  id uuid primary key,
  device_id uuid not null,
  child_id uuid not null,
  token_hash bytea not null unique check (octet_length(token_hash) = 32),
  pin_version integer not null check (pin_version >= 1),
  device_generation integer not null check (device_generation >= 1),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '8 hours'),
  revoked_at timestamptz,
  foreign key (device_id, child_id) references private.device_children(device_id, child_id) on delete restrict,
  check (expires_at > created_at and expires_at <= created_at + interval '8 hours')
);
create table private.rate_windows (
  scope text not null,
  key_hash text not null,
  window_start timestamptz not null,
  failures integer not null default 0 check (failures >= 0),
  blocked_until timestamptz,
  primary key (scope, key_hash, window_start)
);
create table private.api_receipts (
  principal_kind text not null,
  principal_id uuid not null,
  idempotency_key uuid not null,
  operation text not null,
  payload_digest text not null,
  encrypted_response bytea not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  primary key (principal_kind, principal_id, idempotency_key)
);
create index devices_family_status on private.devices(family_id, revoked_at);
create index child_sessions_scope on private.child_sessions(device_id, child_id, revoked_at);
create index pair_expiry on private.pair_requests(expires_at);
create index receipt_expiry on private.api_receipts(expires_at);

alter table private.families enable row level security;
alter table private.children enable row level security;
alter table private.devices enable row level security;
alter table private.device_children enable row level security;
alter table private.pair_requests enable row level security;
alter table private.child_sessions enable row level security;
alter table private.rate_windows enable row level security;
alter table private.api_receipts enable row level security;
revoke all on all tables in schema private from public, anon, authenticated;

create function private.fail(status integer, code text, message text, retry_after integer default null)
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object('_error', true, 'status', status, 'code', code,
    'message', message, 'retry_after', retry_after);
$$;

create function private.reserve_window(scope_name text, key_name text, seconds integer, maximum integer, cooldown integer)
returns boolean language plpgsql set search_path = '' as $$
declare bucket timestamptz; entry private.rate_windows;
begin
  bucket := to_timestamp(floor(extract(epoch from now()) / seconds) * seconds);
  if exists (select 1 from private.rate_windows where scope = scope_name and key_hash = key_name
      and blocked_until > now()) then return false; end if;
  insert into private.rate_windows(scope, key_hash, window_start, failures)
    values(scope_name, key_name, bucket, 1)
    on conflict (scope,key_hash,window_start) do update
      set failures = private.rate_windows.failures + 1
    returning * into entry;
  if entry.failures >= maximum then
    update private.rate_windows set blocked_until = now() + make_interval(secs => cooldown)
      where scope = scope_name and key_hash = key_name and window_start = bucket;
  end if;
  return entry.failures <= maximum;
end;
$$;

create function private.bootstrap(child_uuid uuid)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('child',jsonb_build_object('id',c.id,'display_name',c.display_name),
    'goal',null,'today',jsonb_build_object('study_ms',0,'assessment_ms',0,'qualifying_task',false,'reward',null),
    'module_states','[]'::jsonb,'xp',jsonb_build_object('module_totals','[]'::jsonb,'effort_bonus',0,'total',0),
    'latest_attempts','[]'::jsonb,'sync_revision',0,'capabilities',jsonb_build_array('family_access'))
  from private.children c where c.id = child_uuid and c.archived_at is null;
$$;

create function public.family_dispatch(operation text, credential_context jsonb, payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
<<dispatch>>
declare
  family private.families; device private.devices; child private.children;
  child_session private.child_sessions; pairing private.pair_requests; receipt private.api_receipts;
  principal_kind text; principal_id uuid; result jsonb; child_ids uuid[];
  idempotency uuid; request_digest text; receipt_key text; is_mutation boolean;
  generated_device uuid; generated_child uuid; target_device uuid;
begin
  receipt_key := credential_context->>'receipt_key';
  if length(coalesce(receipt_key,'')) <> 64 then
    return private.fail(503,'SERVER_CONFIGURATION','Family access is unavailable.');
  end if;
  delete from private.rate_windows where window_start < now() - interval '24 hours';
  delete from private.api_receipts where expires_at < now();
  delete from private.pair_requests where expires_at < now() - interval '24 hours';
  update private.pair_requests set encrypted_claim = null where expires_at < now() and encrypted_claim is not null;

  if operation like 'parent_%' then
    select * into family from private.families where owner_auth_id = (credential_context->>'owner_id')::uuid;
    if not found then return private.fail(403,'PARENT_NOT_PROVISIONED','This account has no family access.'); end if;
    principal_kind := 'parent'; principal_id := family.owner_auth_id;
  elsif operation in ('device_children','unlock_prepare','unlock_finish') then
    select * into device from private.devices where token_hash = decode(credential_context->>'token_hash','hex') for update;
    if not found then return private.fail(401,'DEVICE_REQUIRED','Approve this device before continuing.'); end if;
    if device.revoked_at is not null or device.expires_at <= now() then return private.fail(403,'DEVICE_REVOKED','This device needs parent approval.'); end if;
    principal_kind := 'device'; principal_id := device.id;
  elsif operation in ('child_bootstrap','child_lock') then
    select * into child_session from private.child_sessions where token_hash = decode(credential_context->>'token_hash','hex') for update;
    if not found or child_session.revoked_at is not null or child_session.expires_at <= now() then
      return private.fail(401,'UNLOCK_REQUIRED','Unlock your profile online to continue.');
    end if;
    select * into device from private.devices where id = child_session.device_id;
    select * into child from private.children where id = child_session.child_id;
    if device.revoked_at is not null or device.expires_at <= now() or device.generation <> child_session.device_generation
      or child.archived_at is not null or child.pin_version <> child_session.pin_version
      or not child.id=any(device.allowed_child_ids)
      or not exists(select 1 from private.device_children where device_id=device.id and child_id=child.id) then
      return private.fail(403,'ACCESS_CHANGED','Ask your parent to approve this profile again.');
    end if;
    principal_kind := 'child'; principal_id := child_session.id;
  elsif operation = 'pair_create' then
    principal_kind := 'pair'; principal_id := (payload->>'request_id')::uuid;
  elsif operation = 'pair_claim' then
    select * into pairing from private.pair_requests where id = (payload->>'request_id')::uuid for update;
    if not found or pairing.poll_hash <> decode(credential_context->>'poll_hash','hex') then
      return private.fail(401,'INVALID_PAIRING','The pairing request is not available.');
    end if;
    if pairing.expires_at <= now() then return private.fail(410,'PAIR_EXPIRED','Start a new pairing request.'); end if;
    principal_kind := 'pair'; principal_id := pairing.id;
  else return private.fail(404,'NOT_FOUND','This endpoint is not available.');
  end if;

  is_mutation := operation not in ('parent_family','device_children','child_bootstrap','unlock_prepare');
  if is_mutation or operation = 'unlock_prepare' then
    idempotency := (credential_context->>'idempotency_key')::uuid;
    request_digest := credential_context->>'payload_digest';
    if idempotency is null or request_digest is null then return private.fail(400,'IDEMPOTENCY_REQUIRED','A mutation identifier is required.'); end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(principal_kind || principal_id::text || idempotency::text,0));
    select * into receipt from private.api_receipts where api_receipts.principal_kind=dispatch.principal_kind
      and api_receipts.principal_id=dispatch.principal_id and idempotency_key=idempotency;
    if found then
      if receipt.operation <> (case when operation='unlock_prepare' then 'unlock_finish' else operation end) or receipt.payload_digest <> request_digest then
        return private.fail(409,'IDEMPOTENCY_CONFLICT','This mutation identifier was already used for different work.');
      end if;
      result := extensions.pgp_sym_decrypt(receipt.encrypted_response, receipt_key)::jsonb;
      if operation='unlock_prepare' then
        if not exists(select 1 from private.child_sessions s join private.children c on c.id=s.child_id
          where s.id=(result->>'child_session_id')::uuid and s.device_id=device.id
          and s.revoked_at is null and s.expires_at>now() and s.pin_version=c.pin_version
          and s.device_generation=device.generation and c.id=any(device.allowed_child_ids) and c.archived_at is null) then
          return private.fail(401,'UNLOCK_REQUIRED','Unlock your profile online to continue.');
        end if;
        return jsonb_build_object('replayed',result);
      end if;
      if operation='pair_claim' and not exists(select 1 from private.devices d
        where d.id=pairing.device_id and d.token_hash=extensions.digest(result->>'device_token','sha256')) then
        return private.fail(403,'DEVICE_REVOKED','Start a new pairing request.');
      end if;
      return result;
    end if;
  end if;

  if operation = 'pair_create' then
    if not private.reserve_window('pair_ip',credential_context->>'ip_hash',3600,5,3600)
      or not private.reserve_window('pair_global','all',86400,200,86400) then
      return private.fail(429,'PAIR_RATE_LIMIT','Too many pairing requests. Try later.',3600);
    end if;
    if exists(select 1 from private.pair_requests where id=principal_id) then return private.fail(409,'PAIR_EXISTS','Start a new pairing request.'); end if;
    insert into private.pair_requests(id,code_hash,poll_hash,device_label)
      values(principal_id,decode(payload->>'code_hash','hex'),decode(payload->>'poll_hash','hex'),payload->>'device_label') returning * into pairing;
    result := jsonb_build_object('request_id',pairing.id,'approval_code',payload->>'approval_code','expires_at',pairing.expires_at);
  elsif operation = 'pair_claim' then
    if pairing.device_id is null then return jsonb_build_object('status','pending'); end if;
    select * into device from private.devices where id=pairing.device_id;
    if device.revoked_at is not null or device.expires_at <= now() then return private.fail(403,'DEVICE_REVOKED','This device needs parent approval.'); end if;
    update private.pair_requests set claimed_at=coalesce(claimed_at,now()) where id=pairing.id;
    result := extensions.pgp_sym_decrypt(pairing.encrypted_claim,receipt_key)::jsonb;
  elsif operation = 'parent_family' then
    return jsonb_build_object('timezone',family.timezone,
      'children',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'display_name',c.display_name,'archived',c.archived_at is not null) order by c.created_at,c.id) from private.children c where c.family_id=family.id),'[]'::jsonb),
      'devices',coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'label',d.label,'approved_at',d.approved_at,'expires_at',d.expires_at,'revoked_at',d.revoked_at,
        'child_ids',to_jsonb(d.allowed_child_ids)) order by d.approved_at desc) from private.devices d where d.family_id=family.id),'[]'::jsonb));
  elsif operation = 'parent_child_create' then
    generated_child := (payload->>'child_id')::uuid;
    insert into private.children(id,family_id,display_name,pin_salt,pin_hash)
      values(generated_child,family.id,payload->>'display_name',decode(payload->>'pin_salt','hex'),decode(payload->>'pin_hash','hex')) returning * into child;
    result := jsonb_build_object('child',jsonb_build_object('id',child.id,'display_name',child.display_name,'archived',false));
  elsif operation = 'parent_child_update' then
    select * into child from private.children where id=(payload->>'child_id')::uuid and family_id=family.id for update;
    if not found then return private.fail(404,'PROFILE_NOT_FOUND','This profile is unavailable.'); end if;
    update private.children set display_name=coalesce(payload->>'display_name',display_name),
      pin_salt=case when payload ? 'pin_hash' then decode(payload->>'pin_salt','hex') else pin_salt end,
      pin_hash=case when payload ? 'pin_hash' then decode(payload->>'pin_hash','hex') else pin_hash end,
      pin_version=pin_version+case when payload ? 'pin_hash' then 1 else 0 end,
      archived_at=case when payload ? 'archived' then case when (payload->>'archived')::boolean then now() else null end else archived_at end
      where id=child.id returning * into child;
    if payload ? 'pin_hash' or child.archived_at is not null then
      update private.child_sessions set revoked_at=coalesce(revoked_at,now()) where child_id=child.id;
    end if;
    result := jsonb_build_object('child',jsonb_build_object('id',child.id,'display_name',child.display_name,'archived',child.archived_at is not null));
  elsif operation = 'parent_pair_approve' then
    if not private.reserve_window('approval',principal_id::text,60,10,60) then return private.fail(429,'APPROVAL_RATE_LIMIT','Try again in a minute.',60); end if;
    select * into pairing from private.pair_requests where code_hash=decode(payload->>'code_hash','hex') for update;
    if not found then return private.fail(404,'PAIR_NOT_FOUND','Check the pairing code.'); end if;
    if pairing.expires_at<=now() then return private.fail(410,'PAIR_EXPIRED','Start a new pairing request.'); end if;
    if pairing.device_id is not null then return private.fail(409,'PAIR_ALREADY_APPROVED','This request is already approved.'); end if;
    select array_agg(value::uuid) into child_ids from jsonb_array_elements_text(payload->'child_ids');
    if cardinality(child_ids)<1 or exists(select 1 from unnest(child_ids) cid where not exists(select 1 from private.children c where c.id=cid and c.family_id=family.id and c.archived_at is null)) then
      return private.fail(404,'PROFILE_NOT_FOUND','One or more profiles are unavailable.');
    end if;
    if payload ? 'replace_device_id' then
      target_device := (payload->>'replace_device_id')::uuid;
      select * into device from private.devices where id=target_device and family_id=family.id for update;
      if not found then return private.fail(404,'DEVICE_NOT_FOUND','This device is unavailable.'); end if;
      update private.devices set revoked_at=null,token_hash=decode(payload->>'token_hash','hex'),generation=generation+1,
        approved_at=now(),expires_at=now()+interval '90 days',label=pairing.device_label where id=device.id returning * into device;
      update private.child_sessions set revoked_at=coalesce(revoked_at,now()) where device_id=device.id;
    else
      generated_device := (payload->>'device_id')::uuid;
      insert into private.devices(id,family_id,label,token_hash) values(generated_device,family.id,pairing.device_label,decode(payload->>'token_hash','hex')) returning * into device;
    end if;
    insert into private.device_children(device_id,child_id,family_id) select device.id,cid,family.id from unnest(child_ids) cid on conflict do nothing;
    update private.devices set allowed_child_ids=child_ids where id=device.id;
    result := jsonb_build_object('status','approved','device_id',device.id,'device_token',payload->>'device_token','expires_at',device.expires_at);
    update private.pair_requests set approved_family=family.id,device_id=device.id,
      encrypted_claim=extensions.pgp_sym_encrypt(result::text,receipt_key,'cipher-algo=aes256') where id=pairing.id;
    result := jsonb_build_object('device_id',device.id,'status','approved');
  elsif operation = 'parent_device_update' then
    select * into device from private.devices where id=(payload->>'device_id')::uuid and family_id=family.id for update;
    if not found then return private.fail(404,'DEVICE_NOT_FOUND','This device is unavailable.'); end if;
    if payload ? 'revoked' then
      update private.devices set revoked_at=coalesce(revoked_at,now()),generation=generation+1 where id=device.id;
    else
      select array_agg(value::uuid) into child_ids from jsonb_array_elements_text(payload->'child_ids');
      if exists(select 1 from unnest(child_ids) cid where not exists(select 1 from private.children c where c.id=cid and c.family_id=family.id and c.archived_at is null)) then return private.fail(404,'PROFILE_NOT_FOUND','One or more profiles are unavailable.'); end if;
      insert into private.device_children(device_id,child_id,family_id) select device.id,cid,family.id from unnest(child_ids) cid on conflict do nothing;
      update private.devices set allowed_child_ids=child_ids,generation=generation+1 where id=device.id;
    end if;
    update private.child_sessions set revoked_at=coalesce(revoked_at,now()) where device_id=device.id;
    result := jsonb_build_object('device',jsonb_build_object('id',device.id,'updated',true));
  elsif operation = 'device_children' then
    update private.devices set last_seen_at=now() where id=device.id;
    return jsonb_build_object('device_id',device.id,'expires_at',device.expires_at,'children',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'display_name',c.display_name) order by c.created_at) from private.children c where c.id=any(device.allowed_child_ids) and c.archived_at is null),'[]'::jsonb));
  elsif operation in ('unlock_prepare','unlock_finish') then
    select c.* into child from private.children c where c.id=(payload->>'child_id')::uuid and c.family_id=device.family_id and c.id=any(device.allowed_child_ids) and c.archived_at is null for update;
    if not found then return private.fail(401,'INVALID_PROFILE_PIN','The profile or PIN is incorrect.'); end if;
    if operation='unlock_prepare' then
      if not private.reserve_window('pin_device',device.id::text||':'||child.id::text,900,5,900)
        or not private.reserve_window('pin_child',child.id::text,3600,10,900) then
        return private.fail(429,'PIN_RATE_LIMIT','Too many attempts. Ask your parent or try again later.',900);
      end if;
      return jsonb_build_object('pin_salt',encode(child.pin_salt,'hex'),'pin_hash',encode(child.pin_hash,'hex'),'pin_version',child.pin_version,'device_generation',device.generation);
    end if;
    if not coalesce((payload->>'pin_matches')::boolean,false) or (payload->>'pin_version')::integer<>child.pin_version or (payload->>'device_generation')::integer<>device.generation then
      return private.fail(401,'INVALID_PROFILE_PIN','The profile or PIN is incorrect.');
    end if;
    update private.rate_windows set failures=greatest(0,failures-1),blocked_until=null
      where (scope='pin_device' and key_hash=device.id::text||':'||child.id::text and window_start=to_timestamp(floor(extract(epoch from now())/900)*900))
        or (scope='pin_child' and key_hash=child.id::text and window_start=to_timestamp(floor(extract(epoch from now())/3600)*3600));
    insert into private.child_sessions(id,device_id,child_id,token_hash,pin_version,device_generation)
      values((payload->>'child_session_id')::uuid,device.id,child.id,decode(payload->>'token_hash','hex'),child.pin_version,device.generation) returning * into child_session;
    result := jsonb_build_object('child_session_id',child_session.id,'child_session_token',payload->>'child_session_token','expires_at',child_session.expires_at,
      'child',jsonb_build_object('id',child.id,'display_name',child.display_name),'cache_key',
      (select encode(cache_key,'hex') from private.device_children where device_id=device.id and child_id=child.id),'bootstrap',private.bootstrap(child.id));
  elsif operation='child_bootstrap' then return private.bootstrap(child.id);
  elsif operation='child_lock' then
    update private.child_sessions set revoked_at=now() where id=child_session.id;
    result := jsonb_build_object('locked',true);
  else return private.fail(404,'NOT_FOUND','This endpoint is not available.');
  end if;

  if is_mutation then
    insert into private.api_receipts(principal_kind,principal_id,idempotency_key,operation,payload_digest,encrypted_response)
      values(principal_kind,principal_id,idempotency,operation,request_digest,extensions.pgp_sym_encrypt(result::text,receipt_key,'cipher-algo=aes256'));
  end if;
  return result;
end;
$$;

alter table private.devices add column allowed_child_ids uuid[] not null default '{}';

revoke all on function private.fail(integer,text,text,integer) from public,anon,authenticated;
revoke all on function private.reserve_window(text,text,integer,integer,integer) from public,anon,authenticated;
revoke all on function private.bootstrap(uuid) from public,anon,authenticated;
revoke all on function public.family_dispatch(text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.family_dispatch(text,jsonb,jsonb) to service_role;
comment on function public.family_dispatch(text,jsonb,jsonb) is 'Service-only M1 family access boundary. Never grant to browser roles.';
commit;
