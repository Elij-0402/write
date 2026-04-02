# Design System — AI 小说工作台

## Product Context
- **What this is:** AI-assisted Chinese novel writing workshop
- **Who it's for:** Chinese fiction writers who want AI help with drafting, rewriting, and brainstorming
- **Space/industry:** Creative writing tools (Sudowrite, NovelAI, Novlr, Scrivener)
- **Project type:** Web app (editor-centric workspace)

## Aesthetic Direction
- **Direction:** Warm Editorial — quiet, warm, immersive. Like writing on fine paper.
- **Decoration level:** Minimal. Typography does all the work.
- **Mood:** A calm, focused writing sanctuary with the warmth of a physical notebook. The interface disappears so the words take center stage.
- **Reference sites:** Novlr (clean structure), Sudowrite (warm tone), Ulysses (minimalism)

## Typography
- **Display/Hero:** Noto Serif SC (思源宋体) 700 — serif strokes evoke traditional Chinese printing, gives literary weight
- **Body/Editor:** Noto Serif SC 400 — line-height: 2.0 for Chinese text readability, 18-20px
- **UI/Labels:** Noto Sans SC (思源黑体) 400/500 — clean sans-serif for chrome, contrasts with editor serif
- **Data/Tables:** Noto Sans SC with font-variant-numeric: tabular-nums
- **Code:** JetBrains Mono
- **Loading:** Google Fonts `https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=Noto+Serif+SC:wght@400;600;700&display=swap`
- **Scale:**
  - xs: 12px (captions, metadata)
  - sm: 13px (labels, status bar)
  - base: 14px (UI body)
  - md: 16px (secondary content)
  - lg: 18px (editor body)
  - xl: 20px (editor body large)
  - 2xl: 24px (section headings)
  - 3xl: 32px (page titles)
  - 4xl: 36px (display/hero)

## Color
- **Approach:** Restrained — one accent + warm neutrals. Color is rare and meaningful.
- **Primary (accent):** #2D5F3F (墨绿) — ink green, literary and calm. Used for primary actions, links, active states.
- **Primary hover:** #234B32
- **Primary light:** #E8F0EB (green tint backgrounds)
- **Primary subtle:** #F2F7F4 (barely-there green)
- **Neutrals (warm):**
  - Background: #FDFBF7 (奶油底)
  - Surface: #FFFFFF
  - Surface warm: #F8F5EF (暖纸色, editor background)
  - Border: #E8E3D9
  - Border light: #F0EBE2
  - Text primary: #1A1A1A (墨色)
  - Text secondary: #5C5647
  - Text muted: #9B9484
- **Semantic:**
  - Success: #276749 / bg: #F0FFF4
  - Warning: #B7791F / bg: #FFFFF0
  - Error: #C53030 / bg: #FFF5F5
  - Info: #2B6CB0 / bg: #EBF8FF
- **Dark mode strategy:**
  - Background: #1A1916
  - Surface: #242320
  - Surface warm: #2A2926
  - Border: #3D3B36
  - Text primary: #E0DDD6 (off-white, not pure white)
  - Accent: #5A9B72 (desaturated 15%)
  - Apply `color-scheme: dark` on html element

## Spacing
- **Base unit:** 8px
- **Density:** Spacious (writing tools need breathing room)
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)
- **Editor-specific:** 48px top/bottom padding, 80px left/right padding on desktop (narrower on mobile: 24px 20px)

## Layout
- **Approach:** Editor-centric workspace
- **Grid:** Single column for editor, max-width centered for lists
- **Max content width:** 640px for book/chapter lists, full-width for editor (with generous padding)
- **Border radius:**
  - sm: 4px (inputs, small elements)
  - md: 8px (buttons, cards)
  - lg: 12px (panels, modals, editor container)
  - full: 9999px (avatars, badges)
- **Inner radius = outer radius - gap for nested elements**

## Motion
- **Approach:** Minimal-functional — only transitions that aid comprehension
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms)
- **Rules:**
  - Only animate transform and opacity (never layout properties)
  - Respect prefers-reduced-motion
  - No transition: all — list properties explicitly
  - No animation longer than 400ms in the editor

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-03 | Initial design system created | Created by /design-consultation. Warm editorial aesthetic with Noto Serif SC for editor, ink green accent. Differentiated from competitors who all use sans-serif + cold white. |
| 2026-04-03 | Noto Serif SC as editor font | Chinese novel writing needs Song typeface stroke details for literary feel. No competitor does this. |
| 2026-04-03 | Warm cream background (#FDFBF7) | Reduces eye strain for long writing sessions, adds "paper" warmth. Better than pure white for a writing tool. |
