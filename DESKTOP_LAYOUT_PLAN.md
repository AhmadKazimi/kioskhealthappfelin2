# Desktop Layout Restructure Plan

## Problem
Current implementation only makes things bigger but doesn't change LAYOUT STRUCTURE.

## Solution
Create COMPLETELY SEPARATE layouts:

### Desktop Layout (lg: and up)
```
┌──────────────────────────────────────────────────────┐
│                   HEADER                              │
└──────────────────────────────────────────────────────┘

┌───────────────────────────┬──────────────────────────┐
│                           │                          │
│     VIDEO (BIG)          │    STATUS CARD           │
│      (no overlay         │                          │
│       button)            │    PROGRESS CARD         │
│                           │                          │
│                           │    VITALS GRID (2x2)     │
│                           │                          │
│                           │    BLOOD PRESSURE        │
│                           │                          │
└───────────────────────────┴──────────────────────────┘

┌──────────────────────────────────────────────────────┐
│           START BUTTON (if not started)              │
│  OR finger badges (if started) outside video        │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│         [BACK]                     [NEXT]            │
└──────────────────────────────────────────────────────┘
```

### Mobile Layout (< lg)
- Keep current working layout
- Everything stacked vertically
- Button overlays in video are fine

## Key Changes for Desktop
1. ✅ Video on left (3/5 width)
2. ✅ All vitals/status on right (2/5 width)  
3. ✅ Start button OUTSIDE video (below it)
4. ✅ Finger detection badge still on video (ok for desktop)
5. ✅ Progress shown on right sidebar
6. ✅ No button overlays blocking video

## Implementation
- Use `hidden lg:block` for desktop layout
- Use `lg:hidden` for mobile layout
- Share only the footer buttons

