---
name: Sacred Blueprint
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#20201f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e5e2e1'
  on-surface-variant: '#d0c5af'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#99907c'
  outline-variant: '#4d4635'
  surface-tint: '#e9c349'
  primary: '#f2ca50'
  on-primary: '#3c2f00'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#735c00'
  secondary: '#ffb4a8'
  on-secondary: '#690000'
  secondary-container: '#920703'
  on-secondary-container: '#ff9a8a'
  tertiary: '#c0d78f'
  on-tertiary: '#253600'
  tertiary-container: '#a5bb76'
  on-tertiary-container: '#394b13'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#ffdad4'
  secondary-fixed-dim: '#ffb4a8'
  on-secondary-fixed: '#410000'
  on-secondary-fixed-variant: '#920703'
  tertiary-fixed: '#d4eca2'
  tertiary-fixed-dim: '#b8cf88'
  on-tertiary-fixed: '#141f00'
  on-tertiary-fixed-variant: '#3b4d14'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353535'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.05em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.1em
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 48px
  blueprint-grid: 32px
---

## Brand & Style
The design system for this project bridges the gap between ancient manuscript aesthetics and high-tech combat telemetry. The brand personality is "The Scholar-General": authoritative, analytical, and steeped in tradition. It evokes the feeling of a digital palimpsest—where divine geometry and modern tactical data occupy the same space.

The visual style is a hybrid of **Minimalism** and **Modern-Technical**. It utilizes heavy whitespace to allow complex data to breathe, while employing razor-sharp lines and geometric accents that suggest a blueprint. The goal is a fast, CSS-driven UI that feels like a sacred relic being viewed through a high-end combat visor.

## Colors
The palette is rooted in a dark, atmospheric foundation. 
- **Backgrounds**: Use `#121212` for primary surfaces and `#1a1a1a` for raised containers to mimic deep charcoal stone.
- **Accents**: **Esoteric Gold** is reserved for interactive elements, critical paths, and divine status. **Deep Crimson** and **Mossy Green** are functional colors for health and stamina, desaturated to maintain the "weathered" feel.
- **Structural Lines**: Use muted silver with varying opacities to create the blueprint grid effect without overwhelming the content.

## Typography
The typography uses a tri-axis system to define content hierarchy:
1.  **Playfair Display**: Used for dramatic headers, item names, and titles. It brings the "Sacred/Medieval" weight to the dashboard.
2.  **Inter**: The workhorse for all UI descriptions and body text. High legibility and a neutral profile ensure it doesn't clash with the decorative headers.
3.  **JetBrains Mono**: Used for all numerical data, timestamps, and technical logs. It reinforces the "analytical tool" aspect of the system.

## Layout & Spacing
This design system utilizes a **Fluid Grid** with an emphasis on **Asymmetric Negative Space**.
- **The Blueprint Grid**: A background layer consisting of a subtle 32px grid of muted silver lines (`rgba(192, 192, 192, 0.05)`).
- **Margins**: Generous outer margins (48px on desktop) keep the content centered and focused, reminiscent of a margin in a manuscript.
- **Breakpoints**: 
  - Mobile (<768px): 4-column layout, reduced margins, simplified iconography.
  - Tablet (768px - 1024px): 8-column layout.
  - Desktop (>1024px): 12-column layout with fixed-width sidebars for inventory/telemetry.

## Elevation & Depth
Depth is achieved through **Tonal Layers** and **Low-Contrast Outlines** rather than traditional shadows.
- **Surfaces**: Use different shades of dark slate to differentiate background levels. No ambient shadows are used; instead, "inner glow" effects using thin, 1px borders create a sense of light catching on a sharp edge.
- **Structural Lines**: Use 1px wide lines to connect related components, reinforcing the "blueprint" look.
- **The Diamond Motif**: Use rhombus-shaped clips or background patterns to designate "High" elevation or "Divine" importance.

## Shapes
The shape language is strictly **Sharp (0px roundedness)**. 
- **Rhombus/Diamond**: Primary shape for status icons, checkboxes, and decorative flourishes.
- **Clipped Corners**: Use CSS `clip-path` to create 45-degree angle cuts on container corners (e.g., top-right and bottom-left) to simulate tactical data windows.
- **Borders**: Elements are defined by 1px solid borders. Hover states should brighten these borders rather than changing the background color.

## Components
- **Buttons**: Rectangular with a 1px border. The "Gold" button uses a 45-degree corner cut. Hovering triggers a subtle flicker or a solid color fill.
- **Health/Stamina Bars**: Segmented into vertical blocks. Health uses a Deep Crimson fill; Stamina uses a Mossy Green. The background of the bar is a 10% opacity version of the color.
- **Cards**: Large, border-only containers. A small rhombus icon should sit at the intersection of the top-left corner.
- **Inputs**: Bottom-border only, using JetBrains Mono for the text. Active state changes the border from Silver to Gold.
- **Chips**: Small rhombus-shaped containers for attributes (e.g., +5 STR), using `label-sm` typography.
- **Blueprint Connectors**: SVG lines that dynamically connect "Equipped" items to their respective stat blocks.