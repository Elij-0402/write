# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0.0] - 2026-04-03

### Added

- User-configurable AI model provider system: add, edit, delete, and set default AI models
- `user_ai_models` table with RLS policies for secure per-user model storage
- AIProviderFactory replacing DeepSeek-only provider — now works with any OpenAI-compatible API
- AI models settings page at `/settings/ai-models` with preset templates for DeepSeek, OpenAI, and MiniMax
- Model switcher dropdown in writing cockpit toolbar and side panel header
- `useUserAIModels` React hook for client-side CRUD operations
- All AI routes (write, rewrite, brainstorm, consistency-check) now use the user's configured provider

### Documentation

- AI model customization design spec and接入 guide
- Codebase architecture, concerns, conventions, integrations, stack, and structure documentation

### Fixed

- Top bar "角色" and "设定" buttons now navigate to characters and worldbuilding pages from the editor
- Settings gear icon no longer links to a nonexistent /settings route
- Mobile hamburger menu opens a navigation drawer with all AI tools and project pages
- Editor word count shows the correct count on initial load instead of always showing 0
- Brainstorm panel now has a visible close button (续写 and 改写 already had one)
- ModelSwitcher now fetches models on mount instead of showing "未配置"
- Duplicate export collision in use-user-ai-models resolved
- Ownership verification added to update and delete operations
- Brainstorm route auth check ordering fixed for non-chapter context

## [0.0.1.0] - 2026-04-03

### Fixed

- Top bar "角色" and "设定" buttons now navigate to characters and worldbuilding pages from the editor
- Settings gear icon no longer links to a nonexistent /settings route
- Mobile hamburger menu opens a navigation drawer with all AI tools and project pages
- Editor word count shows the correct count on initial load instead of always showing 0
- Brainstorm panel now has a visible close button (续写 and 改写 already had one)
