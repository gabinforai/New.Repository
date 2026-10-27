-- 방명록 표 추가 (Supabase 대시보드 > SQL Editor 에서 한 번만 실행하세요)
-- 방문자(anon)는 이 표에 직접 접근할 수 없고, 서버(service_role)만 읽고 씁니다.

create table if not exists public.guestbook_entries (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 20),
  message    text not null check (char_length(message) between 1 and 500),
  is_hidden  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guestbook_entries_created_idx
  on public.guestbook_entries (created_at desc);

drop trigger if exists trg_guestbook_entries_updated on public.guestbook_entries;
create trigger trg_guestbook_entries_updated before update on public.guestbook_entries
  for each row execute function public.set_updated_at();

alter table public.guestbook_entries enable row level security;
-- 정책 없음 = 방문자는 접근 불가 (서버만 접근)

grant all on public.guestbook_entries to service_role;
