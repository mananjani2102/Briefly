# Changelog

All notable changes to **Briefly** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-09-10

### Added
- **Multi-Format Conversation Export**:
  - Export chat threads to standalone, beautifully formatted HTML (`.html`) with embedded typography, responsive layout, and styled source citations.
  - Export clean Plain Text (`.txt`) for easy terminal viewing and markdown-free pasting.
  - Accessible directly from the Header actions menu and History conversation options.
- **Enhanced Code Block Component**:
  - Added formatted programming language badges (`TypeScript`, `JavaScript (React)`, `Python`, `Shell`, etc.).
  - Added line count indicators for snippets with multiple lines.
  - Added code line-wrapping toggle (`wrap / unwrap`) with visual icons.
  - Instant one-click copy button with visual tooltip feedback.
- **Global Keyboard Navigation & Command Shortcuts**:
  - `Ctrl / ⌘ + Shift + L` (or `Ctrl / ⌘ + K`): Start a new chat immediately.
  - `Ctrl / ⌘ + Shift + H`: Toggle conversation history view.
  - `Ctrl / ⌘ + Shift + S`: Toggle live Web Search on/off.
  - `Ctrl / ⌘ + Shift + A`: Toggle Act mode (browser automation).
  - `Escape`: Cancel streaming responses or stop running agent loops.
  - `?`: Open the keyboard shortcuts reference cheatsheet modal.
- **Rich Page Context Metadata**:
  - Extracted OpenGraph descriptions (`og:description`, `meta[name="description"]`).
  - Extracted estimated reading time in minutes and total word counts.
  - Extracted author bylines and site metadata, displayed in the active ContextChip menu.
- **Extended Browser Agent Capabilities**:
  - Added `get_element_text` tool to extract exact inner text or input values from indexed snapshot elements.
  - Added `wait_for_selector` tool allowing the agent to await dynamic DOM rendering or modal openings with configurable timeout safeguards.
- **Custom System Prompt & Assistant Persona**:
  - Added configurable "Custom instructions" in Settings under the General tab.
  - Injects personalized tone guidelines, response depth requirements, and role presets directly into the chat prompt.
- **Advanced Cost & Token Accounting**:
  - Added cache hit ratio and dollar savings metrics calculated from prompt cache reads.
  - Added per-model expenditure breakdown in cost tracking utilities.
- **Thread Scroll Lock & Live Status Pill**:
  - Intelligent auto-scroll lock that remains pinned to bottom during streaming unless the user manually scrolls up to read prior messages.
  - Added a pulsating "Generating below…" floating jump button with smooth scrolling.

### Changed
- **Storage & Query Performance**:
  - Upgraded Dexie schema to `version(2)` introducing compound index `[conversationId+createdAt]` for zero-overhead chronological message fetching.
  - Enhanced conversation search in History with multi-token query matching.
- **Refined Theme & Visual Elevation**:
  - Tuned dark mode contrast ratios (WCAG AA compliant) across warm terracotta and paper-toned surfaces.
  - Added glassmorphic backdrop filters (`backdrop-filter: blur(12px)`) for overlays, dialogs, and popovers.

### Fixed
- **Citation Sanitization & Security**:
  - Enforced strict protocol validation (`http:` and `https:` only) for web citations.
  - Stripped tracking parameters (`utm_*`, `fbclid`, `gclid`, `ref`) to keep outbound links clean and private.
- **Speech Synthesis Offline Fallback**:
  - Added offline detection (`navigator.onLine`) to immediately use browser speech synthesis when disconnected.
  - Added automatic fallback to native Web Speech API if remote audio playback fails.

---

## [1.0.0] - 2026-08-11

### Added
- Initial release of Briefly AI Chrome Extension (Manifest V3).
- Active tab page context extraction with Mozilla Readability.
- Multi-model switching between Claude 3.5 Haiku, Sonnet 5, and Opus 4.8.
- Agent automation loop with page interaction tools (`click`, `type_text`, `scroll`, `navigate`, `tabs`).
- Text-to-speech audio streaming with FreeTTS and offline synthesis fallback.
- Client-side IndexedDB persistence with Dexie and markdown export.
- Bring-your-own-key security model with strictly local key storage.
