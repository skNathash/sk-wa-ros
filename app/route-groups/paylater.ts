import { layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/dashboard/paylater/layout/layout.tsx", [
    route("dashboard/paylater", "routes/dashboard/paylater/main/index.tsx"),
    route(
      "dashboard/paylater/analytics",
      "routes/dashboard/paylater/analytics/index.tsx"
    ),
    route(
      "dashboard/paylater/orders",
      "routes/dashboard/paylater/orders/index.tsx"
    ),
    route(
      "dashboard/paylater/wallets/:type",
      "routes/dashboard/paylater/wallets/index.tsx"
    ),
    route(
      "dashboard/paylater/statements",
      "routes/dashboard/paylater/statements/index.tsx"
    ),
    route(
      "dashboard/paylater/my-paylater",
      "routes/dashboard/paylater/my-paylater/index.tsx"
    ),
  ]),
  route(
    "dashboard/paylater/view/:id",
    "routes/dashboard/paylater/view/index.tsx"
  ),
  route(
    "dashboard/paylater/request",
    "routes/dashboard/paylater/request/index.tsx"
  ),
  route(
    "dashboard/paylater/assign",
    "routes/dashboard/paylater/assign/index.tsx"
  ),
];
