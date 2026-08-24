import { index, layout, route } from "@react-router/dev/routes";

export default [
  // Devices routes
  route("configs/devices", "routes/configs/devices/index.tsx"),

  // RSP (Retail Selling Price) routes
  route("configs/rsp", "routes/configs/rsp/list/index.tsx"),
  route("configs/rsp/electronics", "routes/configs/rsp/electronics/index.tsx"),
  route("configs/rsp/trend", "routes/configs/rsp/trend/index.tsx"),
  route("configs/rsp/history", "routes/configs/rsp/history/index.tsx"),
  route("configs/rsp/analysis", "routes/configs/rsp/analysis/index.tsx"),

  // Price slab routes
  route("configs/price-slab", "routes/configs/price-slab/list/index.tsx"),

  // Settings routes
  route("configs/settings", "routes/configs/settings/index.tsx"),
  route(
    "configs/settings/delivery-slot",
    "routes/configs/settings/delivery-slot/index.tsx",
  ),
  route(
    "configs/settings/payment-config",
    "routes/configs/settings/payment-config/index.tsx",
  ),
  route("configs/settings/others", "routes/configs/settings/others/index.tsx"),
  route(
    "configs/settings/delivery-charge",
    "routes/configs/settings/delivery-charge/index.tsx",
  ),
  route(
    "configs/settings/price-labels",
    "routes/configs/settings/price-labels/index.tsx",
  ),
  route(
    "configs/settings/prepaid-payment",
    "routes/configs/settings/prepaid-payment/index.tsx",
  ),
  route(
    "configs/settings/delivery-routes",
    "routes/configs/settings/delivery-routes/index.tsx",
  ),

  // Product select routes
  route(
    "configs/product-select",
    "routes/configs/product-select/list/index.tsx",
  ),
  route(
    "configs/product-select/cart/scheme",
    "routes/configs/product-select/cart/scheme/index.tsx",
  ),
  route(
    "configs/product-select/cart/case",
    "routes/configs/product-select/cart/case/index.tsx",
  ),
  route(
    "configs/product-select/cart/reserve",
    "routes/configs/product-select/cart/reserve/index.tsx",
  ),
  route(
    "configs/product-select/cart/promotional-deal",
    "routes/configs/product-select/cart/promotional-deal/index.tsx",
  ),
  route(
    "configs/product-select/cart/price",
    "routes/configs/product-select/cart/price/index.tsx",
  ),

  // Banner config routes
  route("configs/banner", "routes/configs/banner/list/index.tsx"),
  route("configs/banner/slides", "routes/configs/banner/slides/index.tsx"),
  route(
    "configs/banner/manage-slide",
    "routes/configs/banner/manage-slide/index.tsx",
  ),
  route("configs/banner/view", "routes/configs/banner/view/index.tsx"),

  // B2B schemes routes
  route("configs/schemes", "routes/configs/schemes/list/index.tsx"),

  // Coupon config routes
  route("configs/coupon", "routes/configs/coupon/list/index.tsx"),
  route("configs/coupon/view/:id", "routes/configs/coupon/view/index.tsx"),
  route("configs/coupon/manage", "routes/configs/coupon/manage/index.tsx"),
  // WhatsApp template request routes
  route(
    "configs/whatsapp-template-request",
    "routes/configs/whatsapp-template-request/list/index.tsx",
  ),
];
