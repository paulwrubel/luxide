# Mobile-Friendly & Responsive Design

**Goal**: Make the UI usable on mobile devices and smaller screens.

**THIS IS THE LARGEST TASK.**

## Current state
- **Zero responsive breakpoint classes** anywhere in the codebase — no `md:`, `lg:`, `sm:`, `xl:`, `2xl:` classes
- Every layout uses hardcoded widths: `w-80` (cards), `w-82` (detail sidebar), `w-128` (new-render sidebar)
- `h-[264px]` fixed card heights
- No touch-friendly tap targets (should be 44px minimum)
- No viewport-aware layouts

## Scope by view
1. **Renders list** (`views/renders/`): Card grid from multi-column → single-column on mobile
2. **Render detail** (`views/render-detail/`): Sidebar should collapse or slide-over on mobile
3. **New render** (`views/render-new/`): Horizontal split (sidebar | 3D preview) → vertical stack or tab toggle on mobile
4. **All buttons/touch targets**: Need minimum 44px tap size
5. **Speed dial dropdowns**: Need to work on touch devices

## Where to start
Renders list page (simplest — just card grid responsiveness). Then render detail (sidebar collapse). Save new-render for last (most complex).
