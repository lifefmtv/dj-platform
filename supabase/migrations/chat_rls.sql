-- Enable RLS on chat_messages (safe to run even if already enabled)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop policies first so re-running this file is idempotent
DROP POLICY IF EXISTS "anon_select" ON public.chat_messages;
DROP POLICY IF EXISTS "anon_insert" ON public.chat_messages;

-- Anonymous users can read all chat messages (for the live feed)
CREATE POLICY "anon_select" ON public.chat_messages
  FOR SELECT
  TO anon
  USING (true);

-- Anonymous users can insert new messages
CREATE POLICY "anon_insert" ON public.chat_messages
  FOR INSERT
  TO anon
  WITH CHECK (true);
