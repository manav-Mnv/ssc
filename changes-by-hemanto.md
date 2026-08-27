# Changes by Hemanto

## Summary of Changes

### 1. Guideline Section Connecting Line (Static Thread)
- **Removed Animations**: Disabled GSAP scroll-triggered draw-on-scroll (`drawTween`) and looping ember pulse animation (`pulseTween`).
- **Removed `#threadPulse` Path**: Stripped out the pulse path overlay element from the SVG markup in `app.js`.
- **Fixed Gradient Fade-out**: Updated `<linearGradient id="threadGrad">` in `app.js` so the 100% stop offset uses `rgba(240,81,35,0.55)` instead of `rgba(240,81,35,0)` (which was making the line end invisible and appear cut short).

### 2. "Apply Now" Button Position & Stacking Context
- **Repositioned Section**: Moved `.apply-cta-section` upwards by adjusting padding to `0 24px 130px` and adding `margin-top: -60px`.
- **Fixed Stacking & Clickability**: Added `position: relative; z-index: 10;` to `.apply-cta-section` in `styles.css`. This resolved an issue where `.guidelines-section` (`z-index: 1`) overlapped the button section and blocked mouse click/hover events.

### 3. Hover Glitch Prevention on Connecting Line
- **Anchored Line Endpoint**: Modified `threadD()` in `app.js` to calculate line coordinates (`tX`, `tY`) relative to `#applyCtaSection` (static section container) instead of `#showcaseBeginBtn` (the button itself).
- **Prevented Line Shifts**: Because `#showcaseBeginBtn` tilts/transforms on hover/click, calculating coordinates from the button directly caused `buildThread()` to recalculate and shift the line during hover. Anchoring to `#applyCtaSection` ensures the line remains completely static.

### 4. Cache Versioning
- **Cache Bunking**: Bumped asset query parameters in `index.html`:
  - `styles.css` updated to `v=14`
  - `app.js` updated to `v=16`
