# TODOS.md

## P2: 向量检索升级 (V2)

**What:** 将上下文组装器的角色/世界观匹配从精确字符串匹配升级到 Supabase pgvector 语义检索。
**Why:** V1 精确匹配无法处理别名、代称、省略、同名等中文小说常见情况。Codex 审查确认这是 V1 最大的已知限制。
**Pros:** 大幅提升上下文匹配准确率，支持模糊查询。
**Cons:** 需要引入 embedding 模型，增加每次调用的成本和延迟。
**Context:** 上下文组装器 V1 用 `characters.name` 精确匹配正文。升级需要：(1) 为角色卡/世界观生成 embedding, (2) 用 pgvector 做相似度检索, (3) 调整 token 预算分配。
**Effort:** L (human) -> M (CC+gstack)
**Priority:** P2
**Depends on:** V1 上线后用户反馈确认精确匹配不够用

## P3: 误报反馈闭环 (V2)

**What:** 一致性检查的"忽略此项"操作能持久化，后续检查不再报告同类冲突。
**Why:** 作者可能故意让角色行为偏离设定（角色成长）。无反馈闭环时，每次检查都会重复报告已知的"假冲突"，变成噪声。Codex 审查指出这是一致性检查可用性的关键缺陷。
**Pros:** 让一致性检查越用越精准，减少噪声。
**Cons:** 需要新表存储忽略历史，增加 DB 复杂度。
**Context:** 需要在 Supabase 加 `consistency_ignores` 表，存储 chapter_id + conflict_type + conflict_hash。组装器查询时过滤已忽略项。
**Effort:** M (human) -> S (CC+gstack)
**Priority:** P3
**Depends on:** 一致性检查 V1 上线

## P1: 实现后视觉 QA

**What:** 写作驾驶舱和章节侧栏实现完成后，跑 /design-review 做渲染后的视觉 QA。
**Why:** 计划阶段的设计审查用文字和 ASCII 图，无法发现间距、对齐、颜色渲染等实际视觉问题。
**Pros:** 在发布前捕捉视觉缺陷，确保 DESIGN.md token 正确应用。
**Cons:** 需要实现完成后额外 15 分钟。
**Context:** 重点检查：(1) 三栏布局在不同视口的表现，(2) DESIGN.md token 是否正确应用到新组件，(3) 空状态和 loading 状态的视觉效果，(4) 移动端底部 tab 栏的 touch target 和间距。
**Effort:** S (human) -> S (CC+gstack ~15 min)
**Priority:** P1
**Depends on:** 写作驾驶舱 + 章节侧栏实现完成
