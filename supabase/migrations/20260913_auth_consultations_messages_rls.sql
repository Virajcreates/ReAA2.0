-- ==============================================================================
-- K-RERA ReAA 2.0: Multi-Tenant Chat Consultations & Messages with RLS
-- ==============================================================================

-- 1. Create Consultations Table (Chat Sessions)
CREATE TABLE IF NOT EXISTS public.consultations (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Consultation',
  active_namespaces JSONB DEFAULT '["rera-legal", "rera-litigation", "rera-complaints", "rera-projects"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Messages Table (Conversation History)
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  consultation_id TEXT NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  routed_namespaces JSONB DEFAULT '[]'::jsonb,
  citations JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'done',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Performance & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON public.consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_updated_at ON public.consultations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_consultation_id ON public.messages(consultation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS "Users can select own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Users can insert own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Users can update own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Users can delete own consultations" ON public.consultations;

DROP POLICY IF EXISTS "Users can select own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;

-- 6. Strict RLS Policies for Consultations (auth.uid() = user_id)
CREATE POLICY "Users can select own consultations"
  ON public.consultations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consultations"
  ON public.consultations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consultations"
  ON public.consultations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own consultations"
  ON public.consultations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 7. Strict RLS Policies for Messages (auth.uid() = user_id)
CREATE POLICY "Users can select own messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON public.messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
