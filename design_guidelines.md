# Design Guidelines: Offline-First PWA Inventory & Sales App

## Design Approach
**Reference-Based:** Apple iOS/Stripe design system hybrid
- Apple's minimalist clarity for operational efficiency
- Stripe's professional polish for business credibility
- Optimized for rapid mobile transactions in unstable network conditions

## Core Design Principles

### 1. Mobile-First, Thumb-Optimized Layout
**Critical Constraint:** All primary actions must be reachable within thumb zone (bottom 2/3 of screen)

**Layout Structure:**
- Bottom navigation/action bar for primary functions (Inventory, Sell, Reports)
- Top area for status indicators (offline mode, sync status)
- Primary CTAs positioned 60-80% from screen top
- Minimum touch target: 48px × 48px (64px recommended for speed)

### 2. Typography
**Font Stack:** System fonts for instant loading
- Primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto
- Headers: 24px/32px bold (Product names, Section titles)
- Body: 16px/24px regular (Product details, descriptions)
- Small: 14px/20px regular (Metadata, timestamps)
- Numbers: Tabular figures, 20px/28px medium (Prices, quantities)

### 3. Spacing System
**Tailwind Units:** 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6
- Section spacing: space-y-6, space-y-8
- Card gaps: gap-4
- Screen margins: px-4, py-6

### 4. Color Palette (User-Specified)
- **Base:** Whites and soft grays (#F9FAFB, #E5E7EB)
- **Accent:** Electric blue (#3B82F6) or emerald green (#10B981) - choose one
- **Text:** Near-black (#1F2937) for primary, gray (#6B7280) for secondary
- **Status:** Red for offline, green for synced, amber for syncing
- **Surfaces:** White cards with subtle shadows on light gray background

## Screen Specifications

### Splash Screen
**Purpose:** Professional first impression during app initialization
- Full-screen centered composition
- Modern illustration: upward arrow/graph + shopping elements (vector style, 2-color maximum)
- App name below illustration (32px bold)
- Tagline: "Tu inventario siempre disponible" (16px regular)
- Loading indicator at bottom (accent color)
- Duration: 1.5-2 seconds maximum

### Main Interface Components

**Product Cards:**
- White rounded rectangles (rounded-lg, shadow-sm)
- Product image placeholder (80px × 80px, top-left)
- Name (18px bold), Category tag (12px, accent color)
- Price (20px bold, tabular), Stock count (16px with icon)
- Compact grid: 2 columns on mobile, 3-4 on tablet+

**POS Interface:**
- Split view: Product selection (top 50%) + Cart summary (bottom 50%)
- Large "Registrar Venta" button (w-full, h-16, accent color, bottom-fixed)
- Cart items: Left-aligned name, right-aligned price, quantity controls between
- Total displayed prominently above action button (28px bold)

**Daily Report:**
- Summary cards at top: Total Sales, Items Sold, Average Transaction
- Chart visualization: Simple bar chart (SVG, accent colors)
- Product breakdown: Table with Name | Quantity | Revenue columns
- Export/Share button (top-right, subtle)

### Status Indicators
**Offline Mode Badge:**
- Fixed top-right position
- Pill shape with dot indicator + text
- Subtle animation when syncing
- Clear iconography (cloud-off, cloud-sync, cloud-check)

## Navigation Pattern
**Bottom Tab Bar (Mobile):**
- 3 primary tabs: Inventario | Vender | Reportes
- Icons + labels (icon 24px, label 12px)
- Active state: Accent color, inactive: Gray
- Safe area padding for iOS notch

## Component Library

**Buttons:**
- Primary: Accent background, white text, h-12, rounded-lg, shadow-sm
- Secondary: White background, accent border, accent text
- Ghost: Transparent, accent text for tertiary actions
- All buttons: Active state with slight scale (95%), no complex hovers

**Forms (Add Product):**
- Stacked inputs with labels above (14px medium)
- Input fields: h-12, border gray, rounded-lg, focus ring in accent
- Number steppers for quantity (large +/- buttons)
- Category dropdown: Native select styled minimally

**Cards:**
- Base: bg-white, rounded-lg, shadow-sm, p-4
- Hover: Subtle shadow increase (mobile: none)
- Interactive cards: Add subtle border on active/selected

## Animations
**Minimal, Purposeful Only:**
- Page transitions: Simple fade (150ms)
- Button feedback: Scale down on press (100ms)
- Sync status: Gentle pulse on syncing icon
- NO complex scroll animations, parallax, or decorative motion

## Images
**Splash Screen:**
- Single modern illustration (512px × 512px)
- Style: Flat/outlined vector, 2-color (accent + neutral)
- Concept: Growth chart + retail icons or upward trending product boxes
- Position: Centered vertically and horizontally

**Product Placeholders:**
- Square aspect ratio (1:1)
- Light gray background with icon placeholder
- Optional: Support user-uploaded images (optimized to 400px max)

## Grid System
- Container: max-w-7xl, px-4
- Product grid: grid-cols-2 (mobile), md:grid-cols-3, lg:grid-cols-4
- Form layout: Single column on mobile, 2-column on tablet+

**Viewport Management:**
- Natural content flow, no forced 100vh sections
- Bottom navigation fixed, content scrolls beneath
- Safe areas respected on all devices

This design ensures rapid, confident operation in offline environments with professional aesthetics that build trust with small business owners.