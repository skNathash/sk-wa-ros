/**
 * Desktop (>=1024px) slides-per-view for the product carousels on the
 * buy-from-other-retailer pages. Both theme-2 and the default theme currently
 * use 4.2; kept theme-aware so the two can diverge again without touching each
 * carousel.
 */
export const getDesktopPerView = (theme: string): number =>
  theme === "theme-2" ? 4.2 : 4.2;
