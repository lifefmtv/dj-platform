-- Recurring show templates
create table if not exists show_templates (
  id uuid default gen_random_uuid() primary key,
  dj_name text not null,
  stage text,
  start_time time not null,
  end_time time not null,
  genre text,
  description text,
  recurrence_type text not null, -- 'weekly', 'monthly_day' (e.g. first Saturday)
  recurrence_day int not null,   -- 0=Sunday, 1=Monday ... 6=Saturday
  recurrence_week int,           -- null=every week, 1=first, 2=second, 3=third, 4=fourth, -1=last
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Keep existing schedule table for one-off shows
-- Add genre / description / recurring metadata columns
alter table schedule add column if not exists genre text;
alter table schedule add column if not exists description text;
alter table schedule add column if not exists is_recurring boolean default false;
alter table schedule add column if not exists template_id uuid references show_templates(id);

-- RLS: public read, admin writes via service role (bypasses RLS)
alter table show_templates enable row level security;

drop policy if exists "public_read_templates" on show_templates;
create policy "public_read_templates" on show_templates
  for select to anon using (true);
