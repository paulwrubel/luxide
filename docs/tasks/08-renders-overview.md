# Rethink Renders Overview Page

**Goal**: Redesign `/renders` since cards don't look right no matter what.

## Current state
- `w-80` (320px) fixed-width cards in `flex-wrap justify-center` grid
- Cards: checkpoint image + ID + config name + progress bar (if running/pausing)
- `NewRenderCard` fixed `h-[264px]`, `RenderPreviewCard` heights vary → cards are uneven
- No hover/selection states beyond background color
- No responsive breakpoints

## Options
1. **Table view**: ID, name, status, progress, checkpoint count, actions. Less visual, more informative, responsive-friendly
2. **Fixed aspect-ratio cards**: Force all cards same height with `aspect-ratio` and `object-fit` on images
3. **List + detail panel**: Click list item → show preview in side panel
4. **Keep cards but fix them**: Min/max height, aspect-ratio images, responsive grid columns

## Where to start
Try the simplest fix first — force consistent card heights with `aspect-ratio` and `object-cover` on images. If still doesn't look right, explore a table.
