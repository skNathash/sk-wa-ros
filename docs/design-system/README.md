# StoreKing OS — Design System Guide (WhatsApp theme / "theme-2")

> Source of truth for the visual language handed off in
> `design_handoff_storeking_os.zip` (Accounts / Supply / Catalog / POS Billing /
> Customer+Paylater flows). **Every UI change in this repo — new module,
> screen, or component — must follow this guide.** It translates the design
> bundle's rules (written against a standalone JSX prototype) onto how this
> app is actually built: a React Router v7 app with Tailwind v4
> (`tw:`-prefixed utilities), a shared component library under
> `app/components/core`, and a domain layer under `app/shared/*` +
> `app/routes/*`.
>
> Read this **before** styling or building any page. If something here
> conflicts with a specific PR/task instruction, ask — don't silently diverge.

---

## 0. Where things live in *this* repo

The handoff bundle's README describes a different (prototype) codebase
(`dukaan_*.jsx`, `DUKAAN` tokens, `shared.jsx`). **Do not look for those
files here.** This is the mapping to what actually exists:

| Bundle concept | This repo |
|---|---|
| `DUKAAN` tokens in `shared.jsx` | CSS variables in `app/styles/theme-1.css` (defaults) + `app/styles/theme-2.css` (WA overrides), activated via `data-theme="theme-2"` on `<html>` (set in `app/root.tsx`) |
| `Ic` icon set | `lucide-react` (already the app-wide icon library — do not add a second icon set) |
| `useFF()` → `phone / tablet / desktop` | `useScreenView()` (`app/hooks/useScreenView.ts`, boolean `isMobile`) for JS branching, and Tailwind responsive prefixes (`tw:lg:...`) for CSS-only breakpoints. There is no three-way "tablet" hook — tablet is handled by the same `lg:` breakpoint as desktop, or by CSS-only rules in `theme-2.css` (see `@media (min-width: 1024px)`) |
| Tab bar `Home · Catalog · Bill · Business · Supply` | `app/components/core/bottom-tab/BottomTab.tsx` (mobile, theme-2 only — see `.bottom-tab` gating in `theme-2.css`) |
| Desktop side rail per section | `app/shared/navigation/section-menu/SectionMenu.tsx`, fed by `app/services/SectionTabService.ts` (`SectionTabKey = "bill" | "business" | "supply" | "catalog"`) |
| Mobile horizontal sub-tab strip | `app/shared/navigation/section-tabs/SectionTabs.tsx` + `app/components/core/tab/AppTab.tsx` |
| `data.js` (products, customers, vendors, bins, ledger) | Real backend via `app/services/*Service.ts` (`SellerCatalogService`, `AuthService`, etc.) — **do not invent a static data.js**, wire to the existing services/API layer per module |
| `strings.js` i18n | `react-i18next`, namespaces loaded from `public/locales/{{lng}}/{{ns}}.json` (see `app/i18n.ts`). Always add copy through `t("key")` + a locale JSON entry, never hardcode English strings that a retailer will read |
| `CfThumb` / `SfThumb` placeholder product art | `app/components/core/img/EntityThumb.tsx` / `ImgRender.tsx` (asset-id driven, falls back to an initial badge) — use these, don't reintroduce striped placeholder rectangles in production code |
| Phone/Tablet/Desktop showroom frames (`PhoneShell`, `DesktopShell`) | Editorial-only in the bundle. **Not applicable here** — this app renders real responsive routes, not device mockups |

**Icons rule:** the bundle defines five parallel inline-SVG icon sets
(`AfIc`, `SfIc`, `PfIc`, `CfIc`, `Ic`). Its own README says to "consolidate
at implementation." In this repo that consolidation is `lucide-react`,
already used everywhere (see `BottomTab.tsx`, `SectionMenu.tsx`). Pick the
closest semantic `lucide-react` icon instead of hand-rolling SVGs.

---

## 1. Non-negotiable rules (carried over verbatim from the handoff)

These are the bundle's own "Design language rules to preserve" — they still
apply, just expressed via this repo's tokens/components:

1. **The base OS shell doesn't change.** Bottom tab bar
   (`Home · Catalog · Bill · Business · Supply`) on mobile, side rail
   (`SectionMenu`) on desktop. **Bill is always the primary action** — the
   elevated green FAB-style tab (`primary: true` in `BottomTab.tsx`).
2. **App-bar chrome is WA-green** (`--primary: #075e54` in theme-2, i.e.
   `bg-primary` / `.app-header`). Sub-tab strips live inside/under it.
3. **Body background is paper, never plain white.** Mobile: WhatsApp
   chat-wallpaper cream `#ece5dd` (`.page-bg` in theme-2). Desktop: a clean
   light neutral `#f7f8fa` (cards/inputs need contrast against a big flat
   expanse — see the `@media (min-width:1024px)` override in
   `theme-2.css`). Use the `page-bg` class, never a bespoke background color.
4. **Section labels**: IBM Plex Mono, uppercase, ~9–11px, letter-spacing
   ~0.08em. Use the `.wa-section-label` utility — don't hand-roll this.
5. **Big numbers (money, KPIs) use Fraunces serif** with tight/negative
   letter-spacing and tabular figures. Use the `.wa-amount` utility class.
6. **Word-level emphasis in headlines** uses Instrument Serif italic in the
   domain accent color — editorial-only (masthead/heading copy), not
   applicable to most app UI; only use if a screen has genuine
   headline-style copy.
7. **Every mobile screen has a sticky footer** — either a CTA, a cart
   summary, or the OS tab bar. Use `.wa-sticky-foot` for a footer bar; if a
   page's own footer would collide with the bottom tab bar, see the
   `wa-above-tabbar` / `has-footer` / `theme-2-no-footer` conventions in
   `theme-2.css` — don't invent new positioning math per page.
8. **Every desktop workstation follows the same skeleton**: dark/utility
   nav → top utility bar → greeting header → 4 position cards → "Do Today"
   action tiles → two tables side by side → directory/list below. See
   §4 "Desktop control-center pattern" for how to build this with existing
   components.
9. **Colour-coded tags on every list row** — domain-specific, see §3.
10. **Product/pack images**: real asset-backed thumbnails via
    `EntityThumb`/`ImgRender`, never inline "striped placeholder" art in
    production code (that's a prototype-only device from the bundle).

---

## 2. Design tokens

### 2.1 Where tokens live

- `app/styles/theme-1.css` — default theme CSS variables (`:root`), loaded
  first.
- `app/styles/theme-2.css` — WhatsApp theme overrides, scoped under
  `[data-theme="theme-2"]`. **This is the active theme** — `app/root.tsx`
  sets `<html data-theme="theme-2">` unconditionally today.
- `app/root.tsx` `links()` — Google Fonts `<link>` tags. Fraunces,
  Instrument Serif *(not yet linked — add it if a screen needs headline
  italics)*, Plus Jakarta Sans, IBM Plex Mono are loaded here; Open Sans is
  the pre-theme-2 app-wide default.

Never inline hex colors for anything covered by a token below. Reference
the CSS variable (`var(--primary)`, `bg-primary`, etc.) or the utility
class, so a future palette tweak is a one-file change.

### 2.2 Base neutrals & chrome (from theme-2.css, already live)

| Token | Value | Tailwind / usage |
|---|---|---|
| `--background` | `oklch(0.939 0.012 79.78)` (≈ paper) | `bg-background` |
| `--primary` | `#075e54` (WA teal) | `bg-primary` / `text-primary` — app-bar, active nav, primary buttons |
| `--wa-bubble` / `--wa-bubble-text` | `#d9fdd3` / `#0a6b57` | "sent message" chips — active tabs, in-cart indicators (`.wa-incart`) |
| `--wa-accent` / `--wa-accent-foreground` | `#25d366` / `#fff` | `.wa-cta` — the ONE primary action per screen (Pay, Save, Checkout) |
| `--wa-paper` / `--wa-paper-2` | `#ece5dd` / `#e6ddcc` | chat-wallpaper cream, section fills |
| `--muted-foreground` | teal-grey | secondary text |
| `--border` | hairline grey | card/input borders |

### 2.3 Utility classes already in `theme-2.css` — use these, don't re-derive

| Class | Purpose |
|---|---|
| `.wa-mono` | Receipt-style mono text (SKU, barcode, timestamps, quantities) |
| `.wa-amount` | Fraunces serif, tabular figures — every rupee amount that's a "headline number" |
| `.wa-section-label` | Small uppercase mono caption above a control group |
| `.wa-chip` / `[data-active="true"]` | Quick-action / filter chip, flips to WA sent-bubble green when active |
| `.wa-cta` | Bright-green single primary action button per screen |
| `.wa-incart` | "In cart" / selected indicator as a WA sent-bubble |
| `.wa-sticky-foot` | Sticky bottom bar (white, hairline top border) |
| `.wa-scan-target` | Dashed camera-capture card with animated scan-line |
| `.wa-above-tabbar` / `.wa-above-cartbar` | Position floating controls above the bottom tab bar / cart bar |
| `.page-bg` | Correct page background (cream mobile / neutral desktop) — always pair with `app-page` |
| `.app-page-heading`, `.app-breadcrumbs` (hidden), `.hide-in-theme-2` | theme-2 hides breadcrumbs/descriptions app-wide; use `PageHeading` for title+description instead |

### 2.4 Domain accent tokens — **new, added by this change** (see §2.5)

The handoff defines a consistent accent color per module. These didn't
exist yet in `theme-2.css` (only POS/billing had been styled). Added as
CSS variables + row-tag utility classes so every future module (Supply,
Accounts, Catalog, Customer/Paylater) pulls from one place instead of
re-deriving hexes per component:

| Domain | Var | Hex | Utility classes |
|---|---|---|---|
| POS / retail (B2C) | `--wa-domain-pos` | `#2e5aa8` | `.wa-tag-b2c` |
| Supply · SK lane | `--wa-domain-sk` | `#2e5aa8` | `.wa-tag-sk` |
| Supply · peer lane | `--wa-domain-peer` | `#0d8f7f` | `.wa-tag-peer` |
| Supply · local lane | `--wa-domain-local` | `#c85a1d` | `.wa-tag-local` |
| Accounts · money in | `--wa-domain-in` | `#1f8a4f` | `.wa-tag-in` |
| Accounts · money out | `--wa-domain-out` | `#c85a1d` | `.wa-tag-out` |
| Accounts · GST/docs | `--wa-domain-docs` | `#7a4bc0` | `.wa-tag-docs` |
| Accounts · pending | `--wa-domain-pending` | `#c67312` | `.wa-tag-pending` |
| Catalog · own catalog | `--wa-domain-catalog-own` | `#0d8f7f` | `.wa-tag-fast` (fast-moving) |
| Catalog · library | `--wa-domain-catalog-lib` | `#2e5aa8` | — |
| Catalog · shelf | `--wa-domain-catalog-shelf` | `#7a4bc0` | — |
| Catalog · pricing | `--wa-domain-catalog-price` | `#c67312` | `.wa-tag-out-of-stock` uses danger instead |
| B2B | `--wa-domain-b2b` | `#8a6a1a` | `.wa-tag-b2b` |
| Danger / out-of-stock / non-moving | `--wa-domain-danger` | `#d93732` | `.wa-tag-danger`, `.wa-tag-slow` |
| Slow-moving | (amber, reuse pending) | `#c67312` | `.wa-tag-slow` |

Row-tag utilities (`.wa-tag-*`) render as small pill badges — background is
a light tint of the domain color, text is the deep/ink variant, matching
rule **#9** above ("Colour-coded tags on every list row": FAST/SLOW/OUT for
catalog, IN/OUT for money, SK/PEER/LOCAL for supply, B2C/B2B/CLUB for
orders). Existing movement-type colouring
(`app/shared/inventory/modals/inventory-filter/components/StockMovementType.tsx`)
predates this system and uses ad-hoc Tailwind color maps — **new catalog UI
should use `.wa-tag-fast` / `.wa-tag-slow` / `.wa-tag-danger` instead**; do
not extend that ad-hoc map further. (Migrating the existing file is a
follow-up, not required to unblock new work.)

### 2.5 Typography

| Role | Font | Where |
|---|---|---|
| Body / UI text | Plus Jakarta Sans | app-wide under `data-theme="theme-2"` (`* { font-family }` override in `theme-2.css`) |
| Headline / big numbers | Fraunces (serif, variable, opsz 9..144) | `.wa-amount` |
| Editorial italic emphasis | Instrument Serif | headline-only, rare in-app; **font `<link>` not yet added to `root.tsx`** — add it alongside the others if a screen needs it |
| Mono / receipt data | IBM Plex Mono | `.wa-mono`, `.wa-section-label` |

### 2.6 Spacing / radii

Follow existing Tailwind scale, no new spacing tokens needed:
- Card padding: `tw:p-3` to `tw:p-4` (12–16px) — matches bundle's 10–16px band
- Card radius: components already default to `rounded-xl`/`rounded-lg` — keep consistent within a page
- `[data-slot="card"]` — theme-2 removes shadows app-wide (flatter look); don't re-add `shadow-*` to cards under theme-2 without a reason

---

## 3. Row-tag conventions (rule #9)

Every list/table row in a data-heavy module needs a small colour-coded tag.
This is the biggest source of visual inconsistency if left ad hoc, so it's
now a fixed vocabulary (`.wa-tag-*`, §2.4):

| Module | Tag set |
|---|---|
| Catalog (`My Catalog`) | `FAST` · `SLOW` · `OUT` · `HIGH ₹` |
| Accounts / Money | `IN` · `OUT` |
| Supply (source lane) | `SK` · `PEER` · `LOCAL` |
| Orders | `B2C` · `B2B` · `POS` · `CLUB` |

Existing per-module badge components (`ReserveBadge`, `PromotionalBadge`,
`UserBadgeType`, `AppBadge` variants) are fine to keep for their specific
semantics (reserve stock, promo deal, seller-type) — they are **not** row
tags in the bundle's sense and don't need to switch to `.wa-tag-*`. Only
new "movement/direction/lane/channel" indicators should adopt `.wa-tag-*`.

---

## 4. Desktop control-center pattern (rule #8)

The bundle's five desktop workstations (`FS1_HomeDesktop`,
`SS1_HubDesktop`, `AS1_MoneyHomeDesktop`, `CS1_CatalogDesktop`, and the
customer/paylater desktop view) all share one skeleton:

```
┌─────────────┬──────────────────────────────────────────────┐
│  Dark left  │  Utility bar (breadcrumb · search · actions) │
│  nav rail   ├──────────────────────────────────────────────┤
│  (sections  │  Greeting header ("Good afternoon, X...")    │
│  + live     ├──────────────────────────────────────────────┤
│  counts +   │  4 POSITION cards (KPI + delta + breakdown)  │
│  a pinned   ├──────────────────────────────────────────────┤
│  wallet/    │  DO TODAY — 4 actionable tiles                │
│  cash card) ├───────────────────────┬──────────────────────┤
│             │  Table A (states)     │  Table B (states)    │
│             ├───────────────────────┴──────────────────────┤
│             │  Directory / searchable list                 │
└─────────────┴──────────────────────────────────────────────┘
```

**Map this to existing building blocks — do not build a new bespoke layout
system per module:**

- Left rail → `SectionMenu` (already renders per-section tabs with live
  icon + active-state teal accent bar, styled WA-chat-list style). Extend
  `SectionTabService` with counts if a module needs "42k SKUs · 4 arriving"
  style badges next to a tab (the `SectionTab` type / `AppTab`'s `count`
  prop already supports numeric counts, see `app/types/CommonTypes.ts`).
- Utility bar / breadcrumb → `AppHeader` (`app/components/core/header/AppHeader.tsx`)
  + `AppBreadcrumbs` — note theme-2 hides `.app-breadcrumbs` by default
  (rule from `theme-2.css`); use `PageHeading` for the title+description
  slot instead, per the existing convention.
- Greeting header → compose from `PageHeading` + a short calculated
  sentence (see `dashboard/main/components/DashboardHeading.tsx` for the
  existing pattern of a personalized one-liner).
- 4 position cards → `AppStatsCard` / `AppStatsCardOne` /
  `AppStatsCardTemplate2` (`app/components/core/stats-card/*`) — reuse
  these, don't hand-roll new stat-card markup. Style with `.wa-amount` for
  the headline figure.
- DO TODAY tiles → model on
  `app/routes/dashboard/main/components/QuickActions.tsx` /
  `NeedsAttention.tsx` (existing "actionable tile row" pattern on the home
  dashboard) — reuse this component shape for consistency across modules
  rather than inventing a new tile component per module.
- Two side-by-side tables → `AppTable` (`app/components/core/table/AppTable.tsx`)
  in a `tw:grid tw:grid-cols-2 tw:gap-4 tw:lg:grid` layout (mobile:
  single-column stack, same as `dashboard/main/index.tsx`'s
  `tw:hidden tw:grid-cols-12 tw:lg:grid` responsive split).
- Directory/list below → paginated list/table with search, same pattern as
  `app/routes/dashboard/vendor/list` or `app/routes/dashboard/network/management/*`.

**Responsive collapse:** mobile does NOT get the desktop skeleton — mobile
renders the step-by-step phone screens from the bundle's mobile flow (see
§5). Branch with `useScreenView()`'s `isMobile`, same pattern as
`TopFastMovingProducts.tsx` (`isMobile || viewType === "card" ? <MobileView/> : <DesktopView/>`).
Don't build one giant component with inline media-query CSS trying to
reshape a desktop grid into a phone screen — the bundle's mobile flows are
deliberately different screens/steps, not a squeezed desktop layout.

---

## 5. Mobile flow pattern

Each module's mobile experience in the bundle is a **sequence of dedicated
screens** (e.g. Catalog: My Catalog → Library Hub → Library Browse → Store
Shelf → Pricing → Subscribe Cart → Price Update), not a single responsive
page. When implementing a module end-to-end:

1. Identify the phone screens for that flow from the bundle
   (`*_flow_screens*.jsx` + the flow's `.html` file for a visual reference).
2. Build each as its own route or route-nested step under the module's
   existing route group (e.g. Catalog lives under
   `app/routes/dashboard/inventory/*` + `app/route-groups/inventory.ts`).
3. Reuse the module's existing sub-tab strip
   (`SectionTabs`/`AppTab` fed by `SectionTabService`) for the
   Catalog/Library/Shelf/Prices (etc.) switcher — don't build a bespoke tab
   switcher.
4. Every screen ends in a sticky footer per rule #7 — CTA (`.wa-cta` +
   `.wa-sticky-foot`), cart bar, or (if it's a top-level tab landing) the
   `BottomTab`.
5. Persist cross-reload state (active sub-tab, language, density) via
   `StorageService` (`app/services/StorageService.ts`), matching the
   bundle's `localStorage.dk_*` convention conceptually (key names should
   follow this repo's own naming, not `dk_*` literally — check
   `StorageService` usage elsewhere for existing key conventions before
   adding new ones).

---

## 6. Implementation order

Matches the bundle's suggested order — still sound advice for this
codebase:

1. ~~Consolidate design tokens~~ — done in `theme-2.css` for POS; **this
   change** extends it with the domain-accent/tag tokens all other modules
   need (§2.4).
2. Catalog next (smallest surface, existing routes under
   `dashboard/inventory/*` + `dashboard/inventory/subscribe/*` +
   `dashboard/inventory/rack-bin/*` already roughly map to
   My Catalog / Library / Shelf).
3. POS Billing is furthest along (see open PR #1 — billing core done,
   checkout modals/order-placed/recent-orders still pending per that PR's
   description).
4. Supply (`dashboard/purchase-order/*`, `dashboard/vendor/*`) — depends on
   Catalog for product data.
5. Accounts (`dashboard/accounts/*`, `os/accounts/main` prototype already
   exists as a WA-thread chat feed for Money Home — see
   `app/routes/os/accounts/main/`) — implement last, it's the connective
   tissue.
6. Customer/Paylater extends `dashboard/network/management/b2c` +
   `dashboard/paylater/*`.

---

## 7. Checklist for every new/updated screen

- [ ] Uses `page-bg` for background (not a raw white/gray div)
- [ ] App-bar/header is `--primary` teal, no other header color
- [ ] Section captions use `.wa-section-label`, not ad-hoc uppercase spans
- [ ] Money/KPI headline figures use `.wa-amount`
- [ ] Exactly one `.wa-cta` primary action visible per screen (not two
      competing bright-green buttons)
- [ ] List rows needing a state/lane/channel indicator use the matching
      `.wa-tag-*` class (§3) instead of a new ad-hoc color
- [ ] Sticky footer present (CTA / cart / bottom tab) — page doesn't end in
      dead space above the viewport edge
- [ ] Mobile and desktop are separate compositions per §4/§5, gated by
      `useScreenView()` — not one component squeezed by media queries
- [ ] All copy goes through `t("key")` + a locale JSON entry (no hardcoded
      user-facing English)
- [ ] Product/entity images use `EntityThumb`/`ImgRender`, not placeholder
      art
- [ ] No business logic changed for a pure style pass (see PR #1 for the
      precedent — style-only commits stay style-only)

---

## 8. Reference bundle contents (for visual fidelity only)

The original handoff files are kept for reference — **do not import or
execute them**, they're a separate throwaway prototype:

- `flows/*.html` — pixel-accurate visual reference per module (open in a
  browser to check exact spacing/colour/type before building)
- `flows/*_flow_desktop.jsx`, `*_flow_screens*.jsx` — annotated JSX showing
  exact screen composition/copy per step
- `context/Discussion Doc.html` — product rationale / narrative context
- `context/handoff.html` — prior handoff spec (superseded by this doc for
  implementation purposes, kept for historical context)

When in doubt about an exact pixel value (padding, radius, font-size) for a
specific screen, open the matching `flows/<Flow> Flow.html` file and read
the computed styles — treat it as **high-fidelity pixel reference**, but
always re-express the result using this repo's tokens/utilities (§2), never
by copy-pasting inline styles from the prototype JSX.
