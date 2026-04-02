-- 叙事引擎 V1 — DB Migration
-- 在 Supabase SQL Editor 中运行

-- 为项目添加风格卡字段
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS style_guide TEXT;
