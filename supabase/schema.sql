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
