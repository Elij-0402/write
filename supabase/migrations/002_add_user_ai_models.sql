-- AI 模型自定义接入 — DB Migration
-- 在 Supabase SQL Editor 中运行

-- 用户 AI 模型配置表
CREATE TABLE IF NOT EXISTS public.user_ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  model_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 策略
ALTER TABLE public.user_ai_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own ai models" ON public.user_ai_models
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 索引：加速查询用户的默认模型
CREATE INDEX IF NOT EXISTS idx_user_ai_models_user_default
  ON public.user_ai_models(user_id, is_default)
  WHERE is_default = true;
