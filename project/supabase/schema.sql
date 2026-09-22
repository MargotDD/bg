-- Business Girls Supabase setup
-- Run this in Supabase SQL Editor.

-- Migration for existing installations: add profile photo storage column if the profiles table already existed.
alter table if exists public.profiles add column if not exists avatar_url text not null default '';

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'User',
  avatar_url text not null default '',
  company_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.app_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.company_states (
  company_id text primary key,
  state jsonb not null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_members (
  company_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'Member',
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key(company_id,user_id)
);

create table if not exists public.company_invites (
  token text primary key,
  company_id text not null,
  company jsonb not null,
  company_state jsonb,
  invited_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.app_states enable row level security;
alter table public.company_states enable row level security;
alter table public.company_members enable row level security;
alter table public.company_invites enable row level security;

create or replace function public.is_company_member(cid text)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.company_members m where m.company_id=cid and m.user_id=auth.uid());
$$;

create or replace function public.is_company_admin(cid text)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.company_members m where m.company_id=cid and m.user_id=auth.uid() and m.role in ('Owner','Admin'));
$$;

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for all using (id=auth.uid()) with check (id=auth.uid());

drop policy if exists app_states_self on public.app_states;
create policy app_states_self on public.app_states for all using (user_id=auth.uid()) with check (user_id=auth.uid());

drop policy if exists company_states_member on public.company_states;
create policy company_states_member on public.company_states for select using (public.is_company_member(company_id));
drop policy if exists company_states_write on public.company_states;
create policy company_states_write on public.company_states for insert with check (public.is_company_member(company_id));
drop policy if exists company_states_update on public.company_states;
create policy company_states_update on public.company_states for update using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));

drop policy if exists company_members_self_or_admin on public.company_members;
create policy company_members_self_or_admin on public.company_members for select using (user_id=auth.uid() or public.is_company_admin(company_id));
drop policy if exists company_members_insert on public.company_members;
create policy company_members_insert on public.company_members for insert with check (user_id=auth.uid() or public.is_company_admin(company_id));
drop policy if exists company_members_update on public.company_members;
create policy company_members_update on public.company_members for update using (public.is_company_admin(company_id) or user_id=auth.uid()) with check (public.is_company_admin(company_id) or user_id=auth.uid());

drop policy if exists invites_member_read on public.company_invites;
create policy invites_member_read on public.company_invites for select using (true);
drop policy if exists invites_admin_write on public.company_invites;
create policy invites_admin_write on public.company_invites for insert with check (public.is_company_admin(company_id));

create or replace function public.create_company_invite(p_company_id text,p_company jsonb,p_company_state jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare t text := replace(gen_random_uuid()::text,'-',''); result jsonb;
begin
  if not public.is_company_admin(p_company_id) then raise exception 'Not allowed'; end if;
  insert into public.company_invites(token,company_id,company,company_state,invited_by,expires_at)
  values(t,p_company_id,p_company,p_company_state,auth.uid(),now()+interval '7 days');
  select jsonb_build_object('code',t,'expires_at',extract(epoch from now()+interval '7 days')*1000) into result;
  return result;
end; $$;

-- PostgREST/RPC permissions (safe to run repeatedly).
grant execute on function public.create_company_invite(text,jsonb,jsonb) to authenticated;

create or replace function public.accept_company_invite(p_token text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare inv public.company_invites%rowtype; st jsonb; p jsonb;
begin
  select * into inv from public.company_invites where token=p_token and expires_at>now();
  if not found then raise exception 'Invite not found or expired'; end if;
  insert into public.company_members(company_id,user_id,role,permissions)
  values(inv.company_id,auth.uid(),'Member',
    '{"make_sales":true,"create_sales":true,"view_customers":true,"create_expenses":true,"manage_customers":true}'::jsonb)
  on conflict(company_id,user_id) do nothing;
  update public.profiles
  set company_ids = array(select distinct unnest(coalesce(company_ids,'{}'::text[]) || array[inv.company_id]))
  where id=auth.uid();
  insert into public.company_states(company_id,state,updated_by)
  values(inv.company_id,coalesce(inv.company_state,'{}'::jsonb),auth.uid())
  on conflict(company_id) do nothing;
  select state into st from public.app_states where user_id=auth.uid();
  st:=coalesce(st,'{}'::jsonb);
  st:=jsonb_set(st,'{activeCompanyId}',to_jsonb(inv.company_id),true);
  st:=jsonb_set(st,'{companies}',coalesce(st->'companies','[]'::jsonb)||jsonb_build_array(inv.company),true);
  insert into public.app_states(user_id,state) values(auth.uid(),st)
  on conflict(user_id) do update set state=excluded.state,updated_at=now();
  return jsonb_build_object('state',st);
end; $$;

grant execute on function public.accept_company_invite(text) to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,name,avatar_url) values(new.id,coalesce(new.raw_user_meta_data->>'name',split_part(new.email,'@',1)),coalesce(new.raw_user_meta_data->>'avatar_url','')) on conflict do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Account/company onboarding notes:
-- A newly registered account intentionally has no company membership and no role/status.
-- Membership is created only when the user creates a company or accepts an invitation.
-- Existing profiles keep their data; avatar_url is safe to add with IF NOT EXISTS.
alter table if exists public.profiles add column if not exists avatar_url text not null default '';
alter table if exists public.profiles add column if not exists company_ids text[] not null default '{}';

-- Team chat media and call support
create table if not exists public.chat_attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  sender_id uuid,
  message_id text,
  file_name text not null,
  file_type text not null,
  file_size bigint not null default 0,
  storage_path text not null,
  public_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  caller_id uuid,
  callee_id uuid,
  call_type text not null check (call_type in ('audio','video')),
  status text not null default 'ringing' check (status in ('ringing','accepted','rejected','ended','missed')),
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

alter table public.chat_attachments enable row level security;
alter table public.call_sessions enable row level security;

-- These policies keep company media/calls available only to authenticated users.
drop policy if exists chat_attachments_auth on public.chat_attachments;
create policy chat_attachments_auth on public.chat_attachments for all to authenticated using (true) with check (true);
drop policy if exists call_sessions_auth on public.call_sessions;
create policy call_sessions_auth on public.call_sessions for all to authenticated using (true) with check (true);

-- Storage bucket for chat files. If the bucket already exists this is a no-op.
insert into storage.buckets (id, name, public) values ('chat-media', 'chat-media', true)
on conflict (id) do nothing;

-- REAL TEAM CHAT + GROUP AUDIO/VIDEO CALLS
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null,
  sender_avatar text not null default '',
  text text not null default '',
  attachment_url text,
  attachment_type text check (attachment_type is null or attachment_type in ('image','video','audio','file')),
  attachment_name text,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_company_created_idx on public.chat_messages(company_id, created_at);
alter table public.chat_messages enable row level security;
drop policy if exists chat_messages_select on public.chat_messages;
create policy chat_messages_select on public.chat_messages for select to authenticated using (public.is_company_member(company_id));
drop policy if exists chat_messages_insert on public.chat_messages;
create policy chat_messages_insert on public.chat_messages for insert to authenticated with check (sender_id=auth.uid() and public.is_company_member(company_id));

drop policy if exists chat_media_select on storage.objects;
create policy chat_media_select on storage.objects for select to authenticated using (bucket_id='chat-media' and public.is_company_member((storage.foldername(name))[1]));
drop policy if exists chat_media_insert on storage.objects;
create policy chat_media_insert on storage.objects for insert to authenticated with check (bucket_id='chat-media' and public.is_company_member((storage.foldername(name))[1]) and (storage.foldername(name))[2]=auth.uid()::text);
drop policy if exists chat_media_delete on storage.objects;
create policy chat_media_delete on storage.objects for delete to authenticated using (bucket_id='chat-media' and (storage.foldername(name))[2]=auth.uid()::text);

create table if not exists public.call_rooms (
  id uuid primary key,
  company_id text not null,
  type text not null check (type in ('audio','video')),
  host_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','ended')),
  created_at timestamptz not null default now(),
  ended_at timestamptz
);
create index if not exists call_rooms_company_status_idx on public.call_rooms(company_id,status);
alter table public.call_rooms enable row level security;
drop policy if exists call_rooms_select on public.call_rooms;
create policy call_rooms_select on public.call_rooms for select to authenticated using (public.is_company_member(company_id));
drop policy if exists call_rooms_insert on public.call_rooms;
create policy call_rooms_insert on public.call_rooms for insert to authenticated with check (host_id=auth.uid() and public.is_company_member(company_id));
drop policy if exists call_rooms_update on public.call_rooms;
create policy call_rooms_update on public.call_rooms for update to authenticated using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));

-- Realtime is used for instant chat messages and call signalling/invites.
do $$ begin
  alter publication supabase_realtime add table public.chat_messages;
exception when duplicate_object then null;
end $$;

-- Company management / moderation system
alter table public.company_members add column if not exists custom_role text not null default '';
alter table public.company_members add column if not exists rank integer not null default 0;
alter table public.company_members add column if not exists fake_admin boolean not null default false;

create table if not exists public.company_action_requests (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  type text not null,
  reason text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id)
);

create table if not exists public.company_user_alerts (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.company_action_requests enable row level security;
alter table public.company_user_alerts enable row level security;

create or replace function public.get_company_members(p_company_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
  if not public.is_company_member(p_company_id) then raise exception 'Not a company member'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',m.user_id::text,
    'name',coalesce(p.name,split_part(coalesce(a.email,''),'@',1),'User'),
    'email',coalesce(a.email,''),
    'avatarUrl',coalesce(p.avatar_url,''),
    'role',m.role,
    'customRole',coalesce(m.custom_role,''),
    'rank',m.rank,
    'fakeAdmin',m.fake_admin,
    'permissions',m.permissions
  ) order by m.rank desc, coalesce(p.name,'')), '[]'::jsonb)
  into result
  from public.company_members m
  left join public.profiles p on p.id=m.user_id
  left join auth.users a on a.id=m.user_id
  where m.company_id=p_company_id;
  return result;
end; $$;
grant execute on function public.get_company_members(text) to authenticated;

create or replace function public.update_company_member(
  p_company_id text,
  p_user_id uuid,
  p_role text,
  p_custom_role text,
  p_rank integer,
  p_fake_admin boolean,
  p_permissions jsonb
)
returns jsonb language plpgsql security definer set search_path=public as $$
declare actor_role text; target_role text; target_fake boolean;
begin
  select role into actor_role from public.company_members where company_id=p_company_id and user_id=auth.uid();
  if actor_role not in ('Owner','Admin') then raise exception 'Only real admins can change members'; end if;
  select role,fake_admin into target_role,target_fake from public.company_members where company_id=p_company_id and user_id=p_user_id;
  if not found then raise exception 'Member not found'; end if;
  if target_role='Owner' then raise exception 'Owner cannot be changed'; end if;
  if p_role not in ('Admin','Manager','Member') then raise exception 'Invalid role'; end if;
  if p_role='Owner' then raise exception 'Owner cannot be assigned'; end if;
  if actor_role='Admin' and target_role='Admin' and p_role<>'Admin' then
    -- Admins can manage ordinary members/managers, but only the owner can demote another real admin.
    raise exception 'Only the owner can change a real admin';
  end if;
  if p_fake_admin then
    target_role := 'Member';
  else
    target_role := p_role;
  end if;
  update public.company_members
  set role=target_role,
      custom_role=left(coalesce(p_custom_role,''),80),
      rank=greatest(coalesce(p_rank,0),0),
      fake_admin=coalesce(p_fake_admin,false),
      permissions=coalesce(p_permissions,'{}'::jsonb)
  where company_id=p_company_id and user_id=p_user_id;
  return jsonb_build_object('ok',true);
end; $$;
grant execute on function public.update_company_member(text,uuid,text,text,integer,boolean,jsonb) to authenticated;

create or replace function public.request_company_member_removal(p_company_id text,p_user_id uuid,p_reason text default '')
returns jsonb language plpgsql security definer set search_path=public as $$
declare actor_role text; target_role text; req_id uuid;
begin
  select role into actor_role from public.company_members where company_id=p_company_id and user_id=auth.uid();
  if actor_role not in ('Owner','Admin') then raise exception 'Only real admins can request removal'; end if;
  select role into target_role from public.company_members where company_id=p_company_id and user_id=p_user_id;
  if not found then raise exception 'Member not found'; end if;
  if target_role='Owner' then raise exception 'Owner cannot be removed'; end if;
  if actor_role='Owner' then
    delete from public.company_members where company_id=p_company_id and user_id=p_user_id;
    update public.profiles set company_ids=array_remove(coalesce(company_ids,'{}'::text[]),p_company_id) where id=p_user_id;
    return jsonb_build_object('ok',true,'removed',true);
  end if;
  insert into public.company_action_requests(company_id,target_user_id,requested_by,type,reason)
  values(p_company_id,p_user_id,auth.uid(),'remove_member',coalesce(p_reason,'')) returning id into req_id;
  return jsonb_build_object('ok',true,'removed',false,'requestId',req_id::text);
end; $$;
grant execute on function public.request_company_member_removal(text,uuid,text) to authenticated;

create or replace function public.get_company_action_requests(p_company_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;
begin
  if not public.is_company_member(p_company_id) then raise exception 'Not a company member'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',r.id::text,'companyId',r.company_id,'targetUserId',r.target_user_id::text,
    'requestedBy',r.requested_by::text,'requestedByName',coalesce(p1.name,'User'),
    'targetName',coalesce(p2.name,'User'),'type',r.type,'reason',r.reason,
    'status',r.status,'createdAt',r.created_at
  ) order by r.created_at desc),'[]'::jsonb) into result
  from public.company_action_requests r
  left join public.profiles p1 on p1.id=r.requested_by
  left join public.profiles p2 on p2.id=r.target_user_id
  where r.company_id=p_company_id and (r.status='pending' or public.is_company_admin(p_company_id));
  return result;
end; $$;
grant execute on function public.get_company_action_requests(text) to authenticated;

create or replace function public.resolve_company_member_removal(p_request_id uuid,p_approve boolean)
returns jsonb language plpgsql security definer set search_path=public as $$
declare req public.company_action_requests%rowtype; actor_role text;
begin
  select * into req from public.company_action_requests where id=p_request_id and status='pending';
  if not found then raise exception 'Request not found'; end if;
  select role into actor_role from public.company_members where company_id=req.company_id and user_id=auth.uid();
  if actor_role <> 'Owner' then raise exception 'Only the owner can approve removal'; end if;
  if p_approve then
    delete from public.company_members where company_id=req.company_id and user_id=req.target_user_id;
    update public.profiles set company_ids=array_remove(coalesce(company_ids,'{}'::text[]),req.company_id) where id=req.target_user_id;
  end if;
  update public.company_action_requests set status=case when p_approve then 'approved' else 'rejected' end,resolved_at=now(),resolved_by=auth.uid() where id=req.id;
  return jsonb_build_object('ok',true,'approved',p_approve);
end; $$;
grant execute on function public.resolve_company_member_removal(uuid,boolean) to authenticated;

create or replace function public.update_company_profile(p_company_id text,p_name text,p_description text,p_logo_url text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare actor_role text; st jsonb; comp jsonb;
begin
  select role into actor_role from public.company_members where company_id=p_company_id and user_id=auth.uid();
  if actor_role not in ('Owner','Admin') then raise exception 'Only real admins can edit the company'; end if;
  select state into st from public.company_states where company_id=p_company_id;
  st:=coalesce(st,'{}'::jsonb);
  comp:=coalesce(st->'company','{}'::jsonb);
  comp:=jsonb_set(comp,'{name}',to_jsonb(left(trim(coalesce(p_name,'')),80)),true);
  comp:=jsonb_set(comp,'{description}',to_jsonb(left(coalesce(p_description,''),500)),true);
  comp:=jsonb_set(comp,'{logoUrl}',to_jsonb(coalesce(p_logo_url,'')),true);
  st:=jsonb_set(st,'{company}',comp,true);
  insert into public.company_states(company_id,state,updated_by) values(p_company_id,st,auth.uid())
  on conflict(company_id) do update set state=excluded.state,updated_by=excluded.updated_by,updated_at=now();
  return comp;
end; $$;
grant execute on function public.update_company_profile(text,text,text,text) to authenticated;

create or replace function public.create_company_user_alert(p_company_id text,p_target_user_id uuid,p_title text,p_message text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare actor_role text; new_id uuid;
begin
  select role into actor_role from public.company_members where company_id=p_company_id and user_id=auth.uid();
  if actor_role not in ('Owner','Admin') then raise exception 'Only real admins can send warnings'; end if;
  if not exists(select 1 from public.company_members where company_id=p_company_id and user_id=p_target_user_id) then raise exception 'Target is not a company member'; end if;
  insert into public.company_user_alerts(company_id,target_user_id,created_by,title,message) values(p_company_id,p_target_user_id,left(trim(p_title),100),left(trim(p_message),1000)) returning id into new_id;
  return jsonb_build_object('id',new_id::text,'ok',true);
end; $$;
grant execute on function public.create_company_user_alert(text,uuid,text,text) to authenticated;

create or replace function public.get_my_company_alerts(p_company_id text)
returns jsonb language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',a.id::text,'companyId',a.company_id,'title',a.title,'message',a.message,'isRead',a.is_read,'createdAt',a.created_at) order by a.created_at desc),'[]'::jsonb)
  from public.company_user_alerts a
  where a.company_id=p_company_id and a.target_user_id=auth.uid();
$$;
grant execute on function public.get_my_company_alerts(text) to authenticated;

create or replace function public.mark_company_alert_read(p_alert_id uuid)
returns jsonb language sql security definer set search_path=public as $$
  update public.company_user_alerts set is_read=true where id=p_alert_id and target_user_id=auth.uid()
  returning jsonb_build_object('ok',true);
$$;
grant execute on function public.mark_company_alert_read(uuid) to authenticated;

-- Only real Owner/Admin members may mutate other members. A member may no longer
-- change their own role/permissions through direct REST writes.
drop policy if exists company_members_update on public.company_members;
create policy company_members_update on public.company_members for update using (public.is_company_admin(company_id) and user_id <> auth.uid()) with check (public.is_company_admin(company_id));
drop policy if exists company_members_insert on public.company_members;
create policy company_members_insert on public.company_members for insert with check (user_id=auth.uid() or public.is_company_admin(company_id));

-- Simple company invite codes (no expiry, unlimited codes per company).
-- This replaces the fragile link/token invitation flow for new invitations.
create table if not exists public.company_invite_codes (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  code text not null unique,
  company jsonb not null,
  company_state jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  active boolean not null default true
);

create index if not exists company_invite_codes_company_idx on public.company_invite_codes(company_id);
create index if not exists company_invite_codes_code_idx on public.company_invite_codes(code);
alter table public.company_invite_codes enable row level security;

drop policy if exists company_invite_codes_admin_read on public.company_invite_codes;
create policy company_invite_codes_admin_read on public.company_invite_codes
  for select using (public.is_company_admin(company_id));

drop policy if exists company_invite_codes_admin_write on public.company_invite_codes;
create policy company_invite_codes_admin_write on public.company_invite_codes
  for all using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

create or replace function public.create_simple_company_code(
  p_company_id text,
  p_company jsonb,
  p_company_state jsonb
)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  new_code text;
  actor uuid := auth.uid();
begin
  if actor is null or not public.is_company_admin(p_company_id) then
    raise exception 'Not allowed';
  end if;

  loop
    new_code := upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
    exit when not exists(select 1 from public.company_invite_codes where code=new_code);
  end loop;

  insert into public.company_invite_codes(company_id,code,company,company_state,created_by)
  values(p_company_id,new_code,p_company,coalesce(p_company_state,'{}'::jsonb),actor);

  return jsonb_build_object('code',new_code,'company_id',p_company_id);
end; $$;

grant execute on function public.create_simple_company_code(text,jsonb,jsonb) to authenticated;

create or replace function public.join_company_by_code(p_code text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  inv public.company_invite_codes%rowtype;
  st jsonb;
  actor uuid := auth.uid();
begin
  if actor is null then raise exception 'You must be logged in'; end if;

  select * into inv
  from public.company_invite_codes
  where upper(code)=upper(trim(p_code)) and active=true
  order by created_at desc
  limit 1;

  if not found then raise exception 'Invalid company code'; end if;

  insert into public.company_members(company_id,user_id,role,permissions)
  values(inv.company_id,actor,'Member',
    '{"make_sales":true,"create_sales":true,"view_customers":true,"create_expenses":true,"manage_customers":true}'::jsonb)
  on conflict(company_id,user_id) do nothing;

  update public.profiles
  set company_ids = array(select distinct unnest(coalesce(company_ids,'{}'::text[]) || array[inv.company_id]))
  where id=actor;

  insert into public.company_states(company_id,state,updated_by)
  values(inv.company_id,coalesce(inv.company_state,'{}'::jsonb),actor)
  on conflict(company_id) do nothing;

  select state into st from public.app_states where user_id=actor;
  st:=coalesce(st,'{}'::jsonb);
  st:=jsonb_set(st,'{activeCompanyId}',to_jsonb(inv.company_id),true);
  st:=jsonb_set(st,'{companies}',
    coalesce(st->'companies','[]'::jsonb) || jsonb_build_array(inv.company),true);

  insert into public.app_states(user_id,state) values(actor,st)
  on conflict(user_id) do update set state=excluded.state,updated_at=now();

  return jsonb_build_object('state',st,'company',inv.company,'code',inv.code);
end; $$;

grant execute on function public.join_company_by_code(text) to authenticated;
