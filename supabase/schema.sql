create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default timezone('utc', now()),
  unique (group_id, user_id)
);

create table if not exists public.group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  email text not null,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz,
  unique (group_id, email)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  description text not null,
  amount_cents integer not null check (amount_cents > 0),
  paid_by uuid not null references public.profiles(id) on delete cascade,
  split_type text not null check (split_type in ('equal', 'exact')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0)
);

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  payer_id uuid not null references public.profiles(id) on delete cascade,
  payee_id uuid not null references public.profiles(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  created_at timestamptz not null default timezone('utc', now()),
  check (payer_id <> payee_id)
);

create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = excluded.display_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.claim_email_invitations()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id)
  select gi.group_id, auth.uid()
  from public.group_invitations gi
  join public.profiles p on p.id = auth.uid()
  where lower(gi.email) = lower(p.email)
    and gi.accepted_at is null
  on conflict (group_id, user_id) do nothing;

  update public.group_invitations gi
  set accepted_at = timezone('utc', now())
  from public.profiles p
  where p.id = auth.uid()
    and lower(gi.email) = lower(p.email)
    and gi.accepted_at is null;
end;
$$;

create or replace function public.is_group_member(target_group_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = target_user_id
  );
$$;

create or replace function public.share_group_with_user(other_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_members gm_self
    join public.group_members gm_other on gm_other.group_id = gm_self.group_id
    where gm_self.user_id = auth.uid()
      and gm_other.user_id = other_user_id
  );
$$;

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invitations enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;
alter table public.group_messages enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Members can view groups" on public.groups;
drop policy if exists "Authenticated users can create groups they own" on public.groups;
drop policy if exists "Owners can delete groups" on public.groups;
drop policy if exists "Members can view memberships" on public.group_members;
drop policy if exists "Users can add themselves to groups" on public.group_members;
drop policy if exists "Members can view invitations" on public.group_invitations;
drop policy if exists "Members can create invitations" on public.group_invitations;
drop policy if exists "Inviters or owners can delete invitations" on public.group_invitations;
drop policy if exists "Members can view expenses" on public.expenses;
drop policy if exists "Members can create expenses" on public.expenses;
drop policy if exists "Payers or owners can delete expenses" on public.expenses;
drop policy if exists "Members can view splits" on public.expense_splits;
drop policy if exists "Members can create splits" on public.expense_splits;
drop policy if exists "Members can view settlements" on public.settlements;
drop policy if exists "Users can record their own settlements" on public.settlements;
drop policy if exists "Members can view messages" on public.group_messages;
drop policy if exists "Members can create messages" on public.group_messages;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.share_group_with_user(id)
);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Members can view groups"
on public.groups
for select
to authenticated
using (
  owner_id = auth.uid()
  or public.is_group_member(id, auth.uid())
);

create policy "Authenticated users can create groups they own"
on public.groups
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Owners can delete groups"
on public.groups
for delete
to authenticated
using (owner_id = auth.uid());

create policy "Members can view memberships"
on public.group_members
for select
to authenticated
using (
  public.is_group_member(group_id, auth.uid())
);

create policy "Users can add themselves to groups"
on public.group_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    exists (
      select 1 from public.groups g
      where g.id = group_members.group_id and g.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.group_invitations gi
      join public.profiles p on p.id = auth.uid()
      where gi.group_id = group_members.group_id
        and lower(gi.email) = lower(p.email)
    )
  )
);

create policy "Members can view invitations"
on public.group_invitations
for select
to authenticated
using (
  public.is_group_member(group_id, auth.uid())
);

create policy "Members can create invitations"
on public.group_invitations
for insert
to authenticated
with check (
  invited_by = auth.uid()
  and public.is_group_member(group_id, auth.uid())
);

create policy "Inviters or owners can delete invitations"
on public.group_invitations
for delete
to authenticated
using (
  invited_by = auth.uid()
  or exists (
    select 1
    from public.groups g
    where g.id = group_invitations.group_id
      and g.owner_id = auth.uid()
  )
);

create policy "Members can view expenses"
on public.expenses
for select
to authenticated
using (
  public.is_group_member(group_id, auth.uid())
);

create policy "Members can create expenses"
on public.expenses
for insert
to authenticated
with check (
  public.is_group_member(group_id, auth.uid())
  and public.is_group_member(group_id, paid_by)
);

create policy "Payers or owners can delete expenses"
on public.expenses
for delete
to authenticated
using (
  paid_by = auth.uid()
  or exists (
    select 1
    from public.groups g
    where g.id = expenses.group_id
      and g.owner_id = auth.uid()
  )
);

create policy "Members can view splits"
on public.expense_splits
for select
to authenticated
using (
  public.is_group_member(group_id, auth.uid())
);

create policy "Members can create splits"
on public.expense_splits
for insert
to authenticated
with check (
  public.is_group_member(group_id, auth.uid())
  and public.is_group_member(group_id, user_id)
);

create policy "Members can view settlements"
on public.settlements
for select
to authenticated
using (
  public.is_group_member(group_id, auth.uid())
);

create policy "Users can record their own settlements"
on public.settlements
for insert
to authenticated
with check (
  payer_id = auth.uid()
  and public.is_group_member(group_id, auth.uid())
  and public.is_group_member(group_id, payee_id)
);

create policy "Members can view messages"
on public.group_messages
for select
to authenticated
using (
  public.is_group_member(group_id, auth.uid())
);

create policy "Members can create messages"
on public.group_messages
for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.is_group_member(group_id, auth.uid())
);
