# AI 小说工作台 — 设计文档

**日期：** 2026-04-02
**项目：** Sudowrite 类 AI 小说工作台
**技术栈：** Next.js 14 (App Router) + Supabase + Tiptap 编辑器 + DeepSeek API

---

## 1. 产品定位与核心体验

**定位：** 沉浸式 AI 小说写作工作台，服务于想要利用 AI 辅助完成小说创作的作者。

**核心体验原则：**
- 沉浸优先：编辑器最大化，工具最小化，不打断写作心流
- 创意与写作并重：既有灵感激发工具（头脑风暴、角色创建）也有文字加工工具（续写、改写、润色）
- 预览确认：AI 生成内容从不直接插入，通过侧滑面板预览，用户确认后再插入
- 隐私优先：数据自主可控，所有内容存储在用户自己的 Supabase 实例中

---

## 2. 整体布局

```
┌──────────────────────────────────────────────────────────────────┐
│  TOP BAR（高度：48px）                                            │
│  [☰ 项目]  │  [✏️ 续写]  [🔄 改写]  [💡 头脑风暴]  [📖 角色] [📝 设定]  │  │
├────────────┼─────────────────────────────────────────────────────┤
│             │                                                     │
│             │                                                     │
│             │              沉浸式编辑器                            │
│             │           （Tiptap ProseMirror）                    │
│             │                                                     │
│             │                                                     │
│             │                                                     │
│             │                                                     │
│             │                                                     │
├─────────────┴───────────────────────────────┬────────────────────┤
│  STATUS BAR（字数 / 当前章节 / 保存状态）     │  [历史版本] [设置]  │
└─────────────────────────────────────────────┴────────────────────┘

侧滑面板（从右侧滑出，宽度 420px）：
┌──────────────────────────┐
│  ✕  续写结果               │
├──────────────────────────┤
│                          │
│  AI 生成的预览内容...       │
│  （可编辑，可修改）         │
│                          │
├──────────────────────────┤
│  [插入到光标位置]  [取消]   │
└──────────────────────────┘
```

---

## 3. 功能模块

### 3.1 项目与章节管理

**项目列表（左侧抽屉）：**
- 创建 / 删除 / 重命名书籍
- 每本书下管理章节（拖拽排序）
- 章节预览缩略图（首行文字）
- 导出为 Markdown / PDF

**书籍数据模型：**
```typescript
Project {
  id: uuid
  title: string
  description: string
  created_at: timestamp
  updated_at: timestamp
}

Chapter {
  id: uuid
  project_id: uuid (FK)
  title: string
  content: text (JSON of Tiptap doc)
  order: int
  word_count: int
  created_at: timestamp
  updated_at: timestamp
}
```

### 3.2 沉浸式编辑器

**编辑体验：**
- Tiptap 编辑器，ProseMirror 底层
- 支持 Markdown 快捷键（`**粗体**`、`# 标题` 等）
- 打字机模式：当前行始终在视口中央
- 自动保存（每 30 秒 + 每次操作后防抖 2 秒）
- 字数统计（当前章节 + 全书）

**章节切换：**
- 点击顶部章节 Tab 或 `Cmd+Shift+[` / `Cmd+Shift+]` 切换
- 未保存修改时提示确认

### 3.3 AI 工具（顶部栏按钮）

#### 续写（Write）
- 读取光标前约 200 字作为上下文
- 发送给 AI，生成 200-500 字续写内容
- 侧滑面板弹出预览，可编辑
- 用户确认后，插入光标位置，附带撤销支持

#### 改写（Rewrite）
- 选中文字 → 点击改写
- 或未选中时，改写光标所在段落
- 提供 2-3 个改写版本供选择（一次生成多个）
- 侧滑面板展示多版本对比

#### 头脑风暴（Brainstorm）
- 侧滑面板打开，输入框：想探索什么？
  - 情节走向
  - 角色动机
  - 世界观设定
  - 解决写不下去的"卡文"时刻
- AI 生成多个创意方向，用户可选择任意一个展开或继续追问

#### 角色卡（Character）
- 打开侧滑面板，创建/编辑角色
- 字段：姓名、外貌、性格、背景、动机、关系网
- 保存后可在后续 AI 对话中引用（自动注入角色设定到 prompt）

#### 设定卡（Worldbuilding）
- 世界观设定：大纲、规则、历史、文化
- 与角色卡类似，可被后续 AI 调用

### 3.4 侧滑预览面板（统一）

**交互规则：**
- 所有 AI 工具统一使用右侧滑面板（宽度 420px）
- 面板内可编辑 AI 响应内容
- `[插入]` 按钮 → 插入光标位置
- `[取消]` 按钮 → 关闭面板，不插入
- `Esc` 键 → 等效取消
- 面板可拖拽调整宽度

**状态处理：**
- AI 生成中：显示加载动画 + "正在思考..."
- AI 错误：红色提示 + 重试按钮
- 空结果：提示"AI 没有生成有效内容，请重试"

---

## 4. 技术架构

### 4.1 前端

- **框架：** Next.js 14 App Router
- **编辑器：** Tiptap 2.x（ProseMirror）
- **UI 组件：** Shadcn/ui（Tailwind CSS）
- **状态管理：** Zustand（编辑器状态 + AI 面板状态）
- **样式：** Tailwind CSS（深色/浅色主题）
- **部署：** Vercel

### 4.2 后端

- **API：** Next.js Route Handlers（`/app/api/`）
- **AI 层：** 统一接口 `AIProvider`（今天用 DeepSeek，未来说明可切换）
  ```typescript
  interface AIProvider {
    complete(prompt: string, options?: object): Promise<string>
    // 未来：complete → 支持 OpenAI / Claude / 本地模型
  }
  ```
- **数据库：** Supabase（PostgreSQL + Row Level Security）
- **Auth：** Supabase Auth（邮箱登录 / 魔法链接）

### 4.3 数据库 Schema（Supabase）

```sql
-- 用户配置（扩展 auth.users）
profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  ai_model_preference text DEFAULT 'deepseek',
  theme text DEFAULT 'dark',
  created_at timestamptz
)

-- 书籍项目
projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

-- 章节
chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects ON DELETE CASCADE,
  title text NOT NULL,
  content jsonb, -- Tiptap JSON doc
  word_count int DEFAULT 0,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

-- 角色卡
characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects ON DELETE CASCADE,
  name text,
  traits jsonb, -- 外貌/性格/动机等
  created_at timestamptz DEFAULT now()
)

-- 设定卡
worldbuilding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects ON DELETE CASCADE,
  category text, -- 世界观/规则/历史等
  content text,
  created_at timestamptz DEFAULT now()
)
```

**RLS 策略：** 所有表 `user_id = auth.uid()` 才能访问。

### 4.4 API 路由

```
POST /api/ai/write        — 续写
POST /api/ai/rewrite      — 改写
POST /api/ai/brainstorm   — 头脑风暴
POST /api/auth/login      — 登录
POST /api/auth/register   — 注册
GET  /api/projects        — 获取项目列表
POST /api/projects        — 创建项目
GET  /api/projects/:id    — 获取项目详情
...
```

---

## 5. AI Prompt 设计原则

- **写作风格锚定：** 首次创建项目时，让用户选择写作风格（简洁/华丽/悬疑/浪漫等），影响所有 AI 生成
- **上下文注入：** 续写/改写时，自动注入：前文内容 + 当前章节标题 + 角色卡（如有）
- **结构化输出：** AI 返回格式化的 Markdown 或 JSON，前端负责渲染
- **Token 控制：** 最大上下文 128k token，单次生成不超过 4k output token

---

## 6. 第一阶段（MVP）范围

### 包含
- 用户注册 / 登录（Supabase Auth）
- 项目和章节 CRUD
- 沉浸式 Tiptap 编辑器（基础功能：加粗/斜体/标题/列表）
- 续写功能（DeepSeek API）
- 改写功能（选中文字改写）
- 头脑风暴（基础版）
- 侧滑预览面板
- 响应式布局（支持 1024px 以上屏幕）

### 不包含（后续迭代）
- 角色卡、设定卡（v2）
- 多人协作（v2）
- 全书目录 / 大纲视图（v2）
- 导出 PDF / EPUB（v2）
- 移动端适配（v2）
- AI 多模型切换 UI（v2）
- 插件系统（v3）

---

## 7. 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 编辑器 | Tiptap | ProseMirror 生态成熟，扩展性好，适合复杂写作场景 |
| AI 插入 | 预览确认模式 | 不打断写作心流，用户始终掌控内容 |
| 侧滑宽度 | 420px | 足够展示 AI 响应全文，又不挤占编辑空间 |
| 数据存储 | Supabase | 用户自持数据，隐私可控，支持 RLS |
| 部署 | Vercel | 一键部署，与 Next.js 天然契合 |

---

## 8. 成功标准（第一版上线）

- 用户 5 分钟内完成注册并开始写第一段文字
- AI 续写响应时间 < 10 秒（DeepSeek V3）
- 零数据丢失（自动保存 + 乐观更新）
- 核心流程无阻断：注册 → 创建书 → 写章节 → AI 续写 → 插入保存
