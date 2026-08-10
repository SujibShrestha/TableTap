---
name: L'Artiste Editorial
colors:
  surface: '#fef9f2'
  surface-dim: '#ded9d3'
  surface-bright: '#fef9f2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f3ec'
  surface-container: '#f2ede6'
  surface-container-high: '#ece7e1'
  surface-container-highest: '#e6e2db'
  on-surface: '#1d1c18'
  on-surface-variant: '#57423c'
  inverse-surface: '#32302c'
  inverse-on-surface: '#f5f0e9'
  outline: '#8b716a'
  outline-variant: '#dec0b8'
  surface-tint: '#a53c1b'
  primary: '#802102'
  on-primary: '#ffffff'
  primary-container: '#a03818'
  on-primary-container: '#ffc6b6'
  inverse-primary: '#ffb5a0'
  secondary: '#655d50'
  on-secondary: '#ffffff'
  secondary-container: '#ede1d0'
  on-secondary-container: '#6b6356'
  tertiary: '#4c423a'
  on-tertiary: '#ffffff'
  tertiary-container: '#645951'
  on-tertiary-container: '#e0d1c6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd1'
  primary-fixed-dim: '#ffb5a0'
  on-primary-fixed: '#3b0900'
  on-primary-fixed-variant: '#842405'
  secondary-fixed: '#ede1d0'
  secondary-fixed-dim: '#d0c5b5'
  on-secondary-fixed: '#201b11'
  on-secondary-fixed-variant: '#4d463a'
  tertiary-fixed: '#efe0d5'
  tertiary-fixed-dim: '#d3c4ba'
  on-tertiary-fixed: '#221a14'
  on-tertiary-fixed-variant: '#4f453d'
  background: '#fef9f2'
  on-background: '#1d1c18'
  surface-variant: '#e6e2db'
  surface-cream: '#fef9f2'
  surface-warm-grey: '#f2ede6'
  border-sepia: '#8b716a'
  status-critical: '#ba1a1a'
  ticket-high-priority: '#ffdad6'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
  menu-item-title:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  price-label:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.4'
  body-main:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  cta-label:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  body-secondary:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  caption-bold:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '700'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  section-gap: 48px
  container-padding-mobile: 24px
  container-padding-desktop: 64px
---

## Brand & Style

L'Artiste Bistro's interface embodies a "Modern Bistro" aesthetic—a sophisticated blend of **Minimalism** and **Tactile Editorial** design. It targets high-end culinary professionals who require clarity and speed without sacrificing the brand's elegant, artisanal identity.

The visual style is characterized by:
- **Editorial Typography:** High-contrast serif-like usage of sans-serif fonts, utilizing italics to convey a "hand-written menu" feel.
- **Warm Minimalism:** A palette of creamy neutrals and earthen ochres that avoids the sterility of typical SaaS dashboards.
- **Micro-interactions:** Subtle lift effects and shadow transitions that provide physical feedback, mimicking the tactile nature of a physical kitchen ticket.

## Colors

The palette is rooted in culinary heritage. The **Primary** color is a rich "Pimentón" Red, used for high-importance actions and branding. The **Neutral** base is a "Paper Cream" instead of pure white, reducing eye strain in high-brightness kitchen environments.

- **Surface Tiers:** Uses a series of warm grays (`surface-container` levels) to create subtle separation between the navigation, the dashboard background, and the order tickets.
- **Functional Accents:** Crimson is reserved for time-critical alerts and VIP indicators. Secondary "Slate-Ochre" is used for utility icons and secondary text to maintain a grounded, professional tone.

## Typography

The system exclusively utilizes **Montserrat**, but treats it with editorial flair.

- **Italicization:** Used strategically for headlines, brand names, and CTA labels to evoke the "L'Artiste" persona—sophisticated, fast, and creative.
- **Hierarchy through Weight:** Table numbers (`display-lg`) use heavy weights and tight line heights to be readable from across a kitchen.
- **Clarity:** Body text remains upright and clean for maximum legibility in lists and ticket modifiers.

## Layout & Spacing

The dashboard employs a **Fixed Grid** philosophy with generous "Negative Space" to ensure individual order tickets are distinct and actionable.

- **Grid Model:** A responsive multi-column grid that shifts from 1 column (mobile) to 4 columns (XL desktops).
- **Rhythm:** An 8px base unit drives all spacing. 
- **Side Navigation:** A fixed 256px (w-64) sidebar provides a persistent anchor for system-level navigation, while the main content area utilizes a maximum width of 1400px to prevent excessive line lengths on ultra-wide monitors.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Ambient Shadows**.

- **Surface Tiers:** The background uses `surface` (#fef9f2), while the side nav and input areas use `surface-container-low` (#f8f3ec) to create a subtle "inset" look.
- **Physicality:** Tickets (cards) use a specialized shadow: `0px 10px 30px rgba(45,36,30,0.05)`. This warm-tinted shadow makes elements appear to float slightly above the cream surface.
- **Interaction Depth:** Hover states on tickets trigger a deeper shadow (`0px 15px 40px rgba(45,36,30,0.08)`) and a subtle vertical translation (-4px), giving the UI a "squishy," responsive feel.

## Shapes

The shape language is **Soft (Level 1)**, leaning towards architectural precision rather than playful roundness.

- **Standard Radius:** 4px (0.25rem) for buttons and small UI elements.
- **Container Radius:** 8px (0.5rem) for cards (tickets) and navigation items, providing a modern but structured container.
- **Tag Radius:** Smaller 4px corners for modifiers (e.g., "- No capers") to maintain a compact, "stamped" aesthetic.

## Components

### Buttons
- **Primary Action (Ready):** Solid `primary-container` background with white text. High-contrast, bold, and uppercase with wide letter spacing.
- **Secondary Action (Hold):** Outlined with `border-sepia`, using the same typography but lower visual weight.

### Order Tickets (Cards)
- Tickets are the core unit of the UI. High-priority tickets utilize a `primary` border and a subtle `error-container/20` (pinkish) header tint to draw immediate attention.
- Internal padding is a consistent 24px (3 units) to ensure readability.

### Chips & Filters
- **Active Filter:** `surface-container-low` background with a `border-outline-variant`.
- **Inactive Filter:** Ghost style with no border, appearing as raw text until hovered.

### Modifiers
- Modifiers (special instructions) are presented in small boxed-tags with a `surface-container-low` background, clearly separating "standard" items from "customer requests."