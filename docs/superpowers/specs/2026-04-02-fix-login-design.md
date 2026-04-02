# 修复登录问题 — 设计规格

## 问题描述

用户无法登录，表现为：
1. 点击登录后无响应或一直加载
2. 登录成功后被重定向回登录页

## 根因分析

### 1. 根路由跳转到不存在的路径
`app/page.tsx` 检测到已登录用户后执行 `redirect('/p')`，但 `/p` 路径不存在。项目主页面在 `app/(app)/page.tsx` 路由组下，实际路径是 `/`。

### 2. Providers 竞态条件
`app/(app)/layout.tsx` 中的 `AppLayoutInner` 依赖 `Providers` 通过 `useEffect` 异步获取用户信息。初始状态 `user=null`，导致组件在用户信息加载完成前就执行 `router.push('/login')`，把已登录用户踢回登录页。

### 3. 根路由冲突
`app/page.tsx` 和 `app/(app)/page.tsx` 都映射到 `/`，`app/page.tsx` 优先匹配，形成无限重定向。

## 修复方案：Middleware 统一认证保护

### 改动 1：`middleware.ts` — 添加认证路由保护

在现有会话刷新逻辑基础上添加路由保护：

- **认证页面**（`/login`、`/register`）：已登录用户访问时重定向到 `/`
- **受保护页面**（其他所有非 API、非静态资源路由）：未登录用户重定向到 `/login`
- **API 路由**：不在 middleware 中处理，各 API 路由自行检查认证

### 改动 2：删除 `app/page.tsx`

删除这个服务端中间跳转层。删除后：
- `app/(app)/page.tsx`（项目列表页）直接作为 `/` 路由
- 认证保护由 middleware 负责，无需中间跳转

### 改动 3：`app/(app)/layout.tsx` — 移除客户端认证重定向

移除 `AppLayoutInner` 中的 `if (!user) router.push('/login')` 逻辑。Middleware 已保证进入此路由组的用户已登录。

### 改动 4：`components/providers.tsx` — 添加 loading 状态

为 `Providers` 添加 `loading` 状态，在 `getUser()` 完成前显示加载指示器，避免 `user=null` 导致的误判。

Context 接口从 `{ user: User | null }` 扩展为 `{ user: User | null; loading: boolean }`。

### 改动 5：`app/(auth)/login/page.tsx` — 无需改动

保持 `window.location.href = '/'` 硬跳转。登录后硬刷新确保服务端感知新的认证 cookie，搭配新的 middleware 逻辑可正常工作。

## 不改动的部分

- API 路由的认证检查（各自独立，运行正常）
- `lib/supabase/client.ts` 和 `lib/supabase/server.ts`（无问题）
- 注册页面逻辑

## 验证标准

1. 未登录用户访问 `/` 被重定向到 `/login`
2. 输入正确凭证后登录成功，进入项目列表页
3. 已登录用户访问 `/login` 被重定向到 `/`
4. 页面刷新后认证状态持续有效
