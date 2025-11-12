# Design Guidelines: GitHub Blog PR Automation Dashboard

## Design Approach

**Selected Approach:** Design System-Based (Utility-Focused)

**Primary Reference:** GitHub's interface patterns combined with Linear's clean, modern aesthetic for developer tools

**Key Principles:**
- Information hierarchy and scanability first
- Efficient workflows with minimal clicks
- Clear status indicators and feedback
- Technical precision without unnecessary decoration

---

## Typography

**Font Stack:**
- Primary: Inter (Google Fonts) - all UI elements, body text
- Monospace: JetBrains Mono (Google Fonts) - branch names, PR titles, logs

**Type Scale:**
- Page Headers: text-2xl font-semibold (24px)
- Section Headers: text-lg font-medium (18px)
- Body Text: text-sm (14px) - default for most content
- Labels: text-xs font-medium uppercase tracking-wide (11px)
- Code/Logs: text-xs font-mono (11px)
- Metadata: text-xs opacity-70 (11px)

**Line Heights:**
- Headers: leading-tight
- Body: leading-relaxed
- Code blocks: leading-relaxed

---

## Layout System

**Spacing Primitives:**
Use Tailwind units of **2, 3, 4, 6, 8, 12** for consistent rhythm
- Tight spacing: p-2, gap-2 (8px) - compact lists, inline elements
- Standard spacing: p-4, gap-4 (16px) - cards, form fields
- Section spacing: p-6, gap-6 (24px) - major sections
- Page margins: p-8 (32px) - outer containers

**Grid Structure:**
- Main Layout: Sidebar navigation (240px fixed) + Main content area (flex-1)
- Content max-width: max-w-6xl mx-auto for readability
- Dashboard cards: Single column on mobile, 2-column grid (md:grid-cols-2) on desktop

---

## Component Library

### Navigation (Sidebar)
- Fixed left sidebar, full-height, w-60
- Logo/app name at top (p-6)
- Navigation items: py-2 px-4, flex items-center gap-3
- Active state: subtle background treatment, font-medium
- Icons: Heroicons (outline style, w-5 h-5)

### Dashboard Cards
- Rounded borders: rounded-lg
- Padding: p-6
- Border: border with subtle treatment
- Shadow: shadow-sm on hover for interactive cards
- Header: flex justify-between items-start mb-4
- Status indicators: Small badge pills (px-2 py-1 rounded-full text-xs)

### Status Display (Main Dashboard)
Three primary cards in grid:
1. **Current Status** - Active merge process indicator
2. **Recent Activity** - Last 5 merge operations with timestamps
3. **Next Scheduled Run** - Countdown timer display

### PR List Component
- Table layout with columns: Branch Name | Target | Status | Actions
- Row height: py-3
- Monospace font for branch names
- Status badges: inline-flex items-center gap-1 with icon
- Hover state on rows: subtle background change

### Logs Viewer
- Full-width container with rounded-lg border
- Header: flex justify-between (title + clear logs button)
- Log entries: space-y-1
- Individual log: px-4 py-2 font-mono text-xs
- Timestamp prefix: opacity-60
- Max height with scroll: max-h-96 overflow-y-auto
- Auto-scroll to bottom for new entries

### Configuration Form
- Single column layout, max-w-2xl
- Form groups: space-y-6
- Label + Input pattern: space-y-2
- Input fields: w-full px-3 py-2 rounded-md border
- Helper text: text-xs mt-1 opacity-70
- Form sections: border-t pt-6 mt-6 for logical grouping
- Action buttons at bottom: flex justify-end gap-3

### Manual Trigger Panel
- Prominent card at top of dashboard
- Large CTA button: px-6 py-3 rounded-lg font-medium
- Loading state: Spinner icon + "Processing..." text
- Success/error feedback: Alert banner above button

### Alert/Toast Messages
- Top-right positioned toast notifications
- Fixed positioning, slide-in animation
- Icons: Success (check-circle), Error (x-circle), Info (information-circle)
- Auto-dismiss after 5 seconds
- Close button: Heroicons x-mark

### Buttons
Primary action: px-4 py-2 rounded-md font-medium
Secondary action: px-4 py-2 rounded-md border
Icon buttons: p-2 rounded-md (for actions in tables)
Disabled state: opacity-50 cursor-not-allowed

### Icons
**Library:** Heroicons via CDN (outline style for navigation, solid for status indicators)
**Common icons needed:**
- Navigation: home, cog-6-tooth, clock, document-text
- Status: check-circle, x-circle, clock, arrow-path (spinner)
- Actions: play, refresh, trash, external-link

---

## Animations

**Minimal, Purposeful Motion:**
- Loading spinners: animate-spin on refresh icons
- Toast notifications: Slide-in from top-right (100ms ease-out)
- Hover transitions: transition-colors duration-150
- No scroll-triggered or decorative animations

---

## Images

**No hero images or decorative imagery.** This is a pure dashboard application.

**Icon usage only:**
- GitHub Octocat logo in sidebar header (SVG, 32px)
- Integration status icons in configuration (connection indicators)
- Use Heroicons for all functional UI icons