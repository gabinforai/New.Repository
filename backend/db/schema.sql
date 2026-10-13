-- ============================================================
-- 포트폴리오 DB 스키마 (Supabase / PostgreSQL)
-- Supabase 대시보드 > SQL Editor 에 전체를 붙여 넣고 Run 하세요.
-- 전제: 프로젝트 생성 시 "Automatically expose new tables" 를 끈 상태
--       (그래서 아래 5번에서 권한을 직접 부여합니다)
-- ============================================================

-- 1. 공통: updated_at 자동 갱신 -------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. 테이블 ---------------------------------------------------
-- 공개 여부: 목록형 테이블은 is_public, projects 는 기존 status(draft/published) 사용,
--           reservations 는 항상 비공개.

create table public.profile (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  tagline      text,
  hero_eyebrow text,
  hero_desc    text,
  is_public    boolean not null default true,
  updated_at   timestamptz not null default now()
);

create table public.profile_basic_info (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profile(id) on delete cascade,
  icon       text,
  label      text not null,
  value      text not null,
  sort_order int  not null default 0,
  is_public  boolean not null default true,
  updated_at timestamptz not null default now()
);
create index on public.profile_basic_info (profile_id);

create table public.education (
  id             uuid primary key default gen_random_uuid(),
  school         text not null,
  department     text,
  admission_year text,
  status         text not null,
  is_current     boolean not null default false,
  sort_order     int  not null default 0,
  is_public      boolean not null default true,
  updated_at     timestamptz not null default now()
);

create table public.achievements (
  id         uuid primary key default gen_random_uuid(),
  year       text not null,
  prefix     text not null,
  highlight  text not null,
  sort_order int  not null default 0,
  is_public  boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.likes (
  id         uuid primary key default gen_random_uuid(),
  icon       text,
  label      text not null,
  sort_order int  not null default 0,
  is_public  boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.contact_links (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,
  icon       text,
  label      text not null,
  href       text not null,
  sort_order int  not null default 0,
  is_public  boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  title        text not null default '',
  role         text not null default '',
  description  text not null default '',
  date_text    text not null default '',
  participants int check (participants is null or participants >= 1),
  notes        text not null default '',
  status       text not null default 'draft' check (status in ('draft', 'published')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.reservations (
  id             uuid primary key default gen_random_uuid(),
  reservation_no text not null unique,
  name           text not null,
  email          text not null,
  purpose        text not null,
  visit_date     date not null,
  visit_time     time not null,
  consent        boolean not null,
  status         text not null default 'received'
                 check (status in ('received', 'confirmed', 'change_requested', 'canceled')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 같은 날짜·시간에 취소되지 않은 예약은 하나만 (중복 예약 방지)
create unique index uq_active_slot
  on public.reservations (visit_date, visit_time)
  where status <> 'canceled';

-- 3. updated_at 트리거 ----------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profile', 'profile_basic_info', 'education', 'achievements',
    'likes', 'contact_links', 'projects', 'reservations'
  ] loop
    execute format(
      'create trigger trg_%1$s_updated before update on public.%1$I
         for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- 4. RLS (행 단위 접근 제어) ----------------------------------
alter table public.profile            enable row level security;
alter table public.profile_basic_info enable row level security;
alter table public.education          enable row level security;
alter table public.achievements       enable row level security;
alter table public.likes              enable row level security;
alter table public.contact_links      enable row level security;
alter table public.projects           enable row level security;
alter table public.reservations       enable row level security;

-- 방문자(anon)는 공개 행만 읽을 수 있음
create policy "public read" on public.profile            for select to anon using (is_public);
create policy "public read" on public.profile_basic_info for select to anon using (is_public);
create policy "public read" on public.education          for select to anon using (is_public);
create policy "public read" on public.achievements       for select to anon using (is_public);
create policy "public read" on public.likes              for select to anon using (is_public);
create policy "public read" on public.contact_links      for select to anon using (is_public);
create policy "public read" on public.projects           for select to anon using (status = 'published');
-- reservations: 정책 없음 = 방문자는 접근 불가

-- 예약 화면용: 이름·이메일 없이 날짜·시간만 보여 주는 뷰
-- (뷰는 만든 사람 권한으로 동작하므로 reservations 를 직접 열지 않고도 읽을 수 있음)
create view public.booked_slots as
  select visit_date, visit_time
  from public.reservations
  where status <> 'canceled';

-- 5. 권한 (Automatically expose new tables 를 껐기 때문에 직접 부여) ---
grant usage on schema public to anon, service_role;

-- 서버(service_role): 모든 표를 읽고 쓸 수 있음 (RLS 우회)
grant all on all tables in schema public to service_role;

-- 방문자(anon): 공개용 표와 뷰의 읽기만
grant select on
  public.profile,
  public.profile_basic_info,
  public.education,
  public.achievements,
  public.likes,
  public.contact_links,
  public.projects,
  public.booked_slots
to anon;
