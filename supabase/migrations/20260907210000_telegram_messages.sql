-- Входящие сообщения из Telegram-бота
create table if not exists public.telegram_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  chat_id text not null,
  message_id bigint,
  text text,
  parsed jsonb,          -- что распарсилось (тип записи + значения)
  applied boolean default false, -- записано ли в дневник
  created_at timestamptz default now()
);

alter table public.telegram_messages enable row level security;

create policy "Users can view own telegram messages"
  on public.telegram_messages for select
  using (auth.uid() = user_id);

create index if not exists telegram_messages_user_idx
  on public.telegram_messages (user_id, created_at desc);
