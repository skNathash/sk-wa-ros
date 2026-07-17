import { route } from "@react-router/dev/routes";

export default [
  route("products/sk", "routes/products/sk/products/main/index.tsx"),
  route(
    "products/sk/brands",
    "routes/products/sk/products/brands/index.tsx",
  ),
  route(
    "products/sk/category",
    "routes/products/sk/products/category/index.tsx",
  ),
  route(
    "products/sk/list",
    "routes/products/sk/products/list/index.tsx",
  ),
  route("products/cart", "routes/products/cart/index.tsx"),
  route("products/cart/overview", "routes/products/cart/overview/index.tsx"),
  route("products/cart/check", "routes/products/cart/check/index.tsx"),
  route("products/menus", "routes/products/menus/index.tsx"),
  // route("products/main", "routes/products/main/index.tsx"),
  route("products/search", "routes/products/search/index.tsx"),
  route(
    "products/coin-store-deals",
    "routes/products/coin-store-deals/list/index.tsx",
  ),
  route("products/order-placed", "routes/products/order-placed/index.tsx"),
  route(
    "products/browse/by-brand",
    "routes/products/browse/by-brand/index.tsx",
  ),
  // buy from other retailer routes
  route(
    "products/buy-from-other-retailer/retailers",
    "routes/products/buy-from-other-retailer/retailers/index.tsx",
  ),
  route(
    "products/buy-from-other-retailer/retailer/:id",
    "routes/products/buy-from-other-retailer/retailer/index.tsx",
  ),
  route(
    "products/main",
    "routes/products/buy-from-other-retailer/products/main/index.tsx",
  ),
  route(
    "products/buy-from-other-retailer/products/search",
    "routes/products/buy-from-other-retailer/products/search/index.tsx",
  ),
  route(
    "products/buy-from-other-retailer/products/list",
    "routes/products/buy-from-other-retailer/products/list/index.tsx",
  ),
  route(
    "products/buy-from-other-retailer/products/cart",
    "routes/products/buy-from-other-retailer/products/cart/index.tsx",
  ),
  route(
    "products/buy-from-other-retailer/products/brands",
    "routes/products/buy-from-other-retailer/products/brands/index.tsx",
  ),
  route(
    "products/buy-from-other-retailer/products/category",
    "routes/products/buy-from-other-retailer/products/category/index.tsx",
  ),
  route(
    "products/buy-from-other-retailer/products/my",
    "routes/products/buy-from-other-retailer/products/my/index.tsx",
  ),
  route(
    "products/buy-from-other-retailer/products/order-success",
    "routes/products/buy-from-other-retailer/products/order-success/index.tsx",
  ),
  route(
    "products/buy-from-other-retailer/payment",
    "routes/products/buy-from-other-retailer/payment/index.tsx",
  ),
  route("products/cart/shared/:id", "routes/products/cart/shared/index.tsx"),
];
