# Project memory

## Product intent & audience

- **SketchPad**: premium browser-based digital handwriting notebook and whiteboard. Tagline: "Write naturally. Create freely."
- Target: daily users wanting a natural, offline-capable handwriting experience across desktop, tablet, and mobile.
- No mandatory account or cloud; fully local-first using IndexedDB.

## Brand personality & voice

- Premium, production-quality, non-cookie-cutter.
- Minimal macOS-inspired interface; calm, focused, tool-like.
- Honest about platform capabilities; writing experience prioritized over decoration.

## Visual design & UX direction

- Next.js + Tailwind + shadcn/ui + lucide-react only (per `.bolt/prompt`).
- **Infinite canvas architecture**: single continuous full-screen drawing surface; no white page, page boundaries, margins, shadows, or clipping.
- Canvas background covers entire workspace; dark charcoal appearance maintained.
- **Solid dark toolbars** — no glassmorphism, no backdrop blur, no translucent surfaces, no excessive gradients. Subtle 1px borders, restrained shadows, clean minimal premium styling.
- Top navbar: solid dark background; keeps notebook title, save status, undo/redo, export, theme, settings.
- Bottom navbar: solid dark; zoom out/percentage/in, canvas controls. Page numbers and paper-background controls removed.
- Tool palette and properties panel also converted to solid surfaces.
- Eight named themes: Arctic White, Midnight Black, macOS Silver, Warm Paper, Lavender Mist, Ocean Blue, Forest Green, Rose Quartz (+ Light/Dark/System).
- Themes affect app UI and canvas defaults, never existing drawing colors.
- Responsive shells: desktop floating toolbars/sidebar; tablet stylus-first collapsible panels; mobile compact toolbar + full-screen drawing, no horizontal overflow.
- Drawing engine kept independent from React UI.

## Decisions, constraints & rationale

- **Infinite canvas implemented**: origin-based view (starts at origin, not page-centered); unlimited panning H/V; space+drag pan; mouse-wheel zoom; accurate pointer coords at all zoom levels; existing strokes preserved.
- **Page model merged into single canvas**: pages merged on load so no drawing is hidden; page-management actions removed; view helper renamed to neutral name.
- **PNG export**: bounds-based (crops to drawing bounds on white background) instead of page-sized rectangle. Older files with page backgrounds still open; paper styles no longer shown.
- IndexedDB for notebooks, pages→canvas, strokes, shapes, text, images, prefs; localStorage not used for large data.
- Portable `.sketchpad` format (versioned JSON + packaged assets).
- Export: PNG, SVG, PDF, full notebook, single page. Import/backup/restore.
- PWA: manifest, service worker, offline shell, graceful fallback.
- Keyboard shortcuts defined (undo/redo, save, export, delete, pan, escape, zoom).
- Build verified (type-check + build pass); browser runtime, stylus, and offline behavior still untested; narrow-width layout needs visual pass.

## Open questions & assumptions

- Custom SketchPad logo/mark still needed (header still uses generic icon).
- Large spec areas remain incomplete: shapes/diagrams, text & sticky notes, images, selection/multi-select, SVG & PDF export, PWA install/offline, automated tests, production deployment.
- Pressure sensitivity and stroke smoothing untested in-browser.
- Assume Vercel deployment target with HTTPS and production builds.