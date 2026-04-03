# AI 模型自定義接入設計

**Date:** 2026-04-03
**Status:** Approved

## 目標

讓用戶在設置頁面自定義接入多個 AI 模型（支持官方模板和 OpenAI 兼容格式的中轉），並在編輯器工具列快速切換。

---

## 1. 數據模型

**錨點表：`user_ai_models`**

| 字段 | 類型 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| user_id | uuid | 關聯用戶 |
| name | text | 用戶給配置起的名字 |
| base_url | text | API endpoint |
| api_key | text | API Key（加密存儲）|
| model_name | text | 模型名稱 |
| is_default | boolean | 是否為默認 |
| created_at | timestamp | |

**行為規則：**
- 每個用戶只有一個 `is_default = true`
- 新建配置時，若勾選「設為默認」，先取消其他記錄的 `is_default`
- 刪除時，若刪的是默認，自動把最近一條設為默認（若有的話）

---

## 2. AI Provider 工廠

**文件重構：**

- 刪除 `lib/ai/deepseek.ts`
- 新建 `lib/ai/factory.ts` — `AIProviderFactory`
- 統一 `complete()` 方法，底層構造 OpenAI 兼容格式 fetch

```typescript
// lib/ai/factory.ts
export function createAIProvider(config: {
  base_url: string
  api_key: string
  model_name: string
}): AIProvider {
  return {
    async complete(prompt, options) {
      const res = await fetch(`${config.base_url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.api_key}`,
        },
        body: JSON.stringify({
          model: config.model_name,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options?.max_tokens ?? 1024,
          temperature: options?.temperature ?? 0.8,
        }),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      return data.choices[0].message.content
    },
  }
}
```

**Provider 接口不變：** `complete(prompt, options?) => string`

---

## 3. 設置頁面

**路由：** `/app/(app)/settings/ai-models/page.tsx`

**功能：**
- 列表展示用戶所有模型配置，標記默認
- 新增 / 編輯 / 刪除配置
- 新增表單字段：名稱、API Key、Base URL、模型名、是否默認

**預設模板（新建時可快速填充 Base URL 和模型名）：**

| 名稱 | Base URL | 模型名 |
|------|----------|--------|
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat` |
| OpenAI | `https://api.openai.com` | `gpt-4o` |
| MiniMax | `https://api.minimax.chat` | `MiniMax-Text-01` |
| 自定義（空 Base URL）| — | — |

用戶選模板後，Base URL 和模型名預填充，用戶仍可修改。

**驗證：** 保存前檢查必填項，刪除前確認。

---

## 4. 編輯器工具列模型切換

**位置：** `WritingCockpit` 或同等工具列組件

**UI：** 在 AI 工具按鈕旁加下拉選單

```
[寫作] [改寫] [腦暴] [校對]  [▼ 模型名]
```

**邏輯：**
- 打開時從 `user_ai_models` 讀取用戶所有配置，顯示名稱列表
- 當前默認模型顯示 `●`
- 點擊切換：寫入 `is_default = false` 原默認 → `is_default = true` 新選擇
- 下拉只顯示**有效配置**（必要字段非空即可，實際可用性由 API 调用時驗證）

---

## 5. API Route 適配

現有 route 簽名不改，只改 `getAIProvider()` 內部邏輯。

**寫作 route 示例（`app/api/ai/write/route.ts`）：**

```typescript
// 改前
import { getAIProvider } from '@/lib/ai/deepseek'

// 改後
// 從 session 用戶的 user_ai_models 讀取 is_default = true 的配置
// factory.createAIProvider(config) 創建 provider
```

用戶級聯：每個 AI API route 需要先查詢當前用戶的默認模型配置，然後構造 provider。

---

## 6. 實現順序

1. 數據庫遷移 — `user_ai_models` 表
2. `lib/ai/factory.ts` — Provider 工廠
3. 設置頁面 CRUD + 預設模板
4. API Route 適配（從默認配置構造 provider）
5. 編輯器工具列下拉組件
6. 清理 — 刪除 `lib/ai/deepseek.ts`

---

## 7. 約束

- 所有 API 調用為 OpenAI Chat Completions 兼容格式
- API Key 加密存儲（使用 Supabase 加密或 server-side 加密）
- 不支持 streaming（保持現有行為一致）
