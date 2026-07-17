import { layout, route } from "@react-router/dev/routes";

export default [
  route("dashboard/vendor/manage", "routes/dashboard/vendor/manage/index.tsx"),
  // route(
  //   "dashboard/vendor/view/:id",
  //   "routes/dashboard/vendor/detail/index.tsx"
  // ),
  route(
    "dashboard/vendor/analytics",
    "routes/dashboard/vendor/analytics/index.tsx"
  ),
  route("dashboard/vendor/list", "routes/dashboard/vendor/list/index.tsx"),
  route(
    "dashboard/vendor/statement/:id",
    "routes/dashboard/vendor/statement/index.tsx"
  ),
  layout("routes/dashboard/vendor/detail/layout/layout.tsx", [
    route(
      "dashboard/vendor/view/:id",
      "routes/dashboard/vendor/detail/overview/index.tsx"
    ),
    route(
      "dashboard/vendor/view/:id/purchase-order",
      "routes/dashboard/vendor/detail/purchase-order/index.tsx"
    ),
    route(
      "dashboard/vendor/view/:id/products",
      "routes/dashboard/vendor/detail/products/index.tsx"
    ),
    route(
      "dashboard/vendor/view/:id/payments-transactions",
      "routes/dashboard/vendor/detail/payment/index.tsx"
    ),
    route(
      "dashboard/vendor/view/:id/returns",
      "routes/dashboard/vendor/detail/returns/index.tsx"
    ),
  ]),
];
