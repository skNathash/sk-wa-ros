import { route } from "@react-router/dev/routes";

export default [
  route(
    "dashboard/orders/dashboard",
    "routes/dashboard/orders/dashboard/index.tsx",
  ),
  route("dashboard/orders/view/:id", "routes/dashboard/orders/view/index.tsx"),
  route(
    "dashboard/orders/process/:id",
    "routes/dashboard/orders/process/index.tsx",
  ),
  route(
    "dashboard/orders/analytics",
    "routes/dashboard/orders/analytics/index.tsx",
  ),
  route("dashboard/orders/list", "routes/dashboard/orders/list/index.tsx"),
  route(
    "dashboard/orders/refunds/list",
    "routes/dashboard/orders/refunds/list/index.tsx",
  ),
  route(
    "dashboard/orders/refunds/view/:id",
    "routes/dashboard/orders/refunds/view/index.tsx",
  ),
  route(
    "dashboard/orders/performance",
    "routes/dashboard/orders/performance/index.tsx",
  ),
  route(
    "dashboard/orders/primary/receive/list",
    "routes/dashboard/orders/primary/receive/list/index.tsx",
  ),
  route(
    "dashboard/orders/primary/receive/process/:id",
    "routes/dashboard/orders/primary/receive/process/index.tsx",
  ),
  route(
    "dashboard/orders/primary/receive/sk/list",
    "routes/dashboard/orders/primary/receive/sk/list/index.tsx",
  ),
  route(
    "dashboard/orders/primary/receive/sk/process/:id",
    "routes/dashboard/orders/primary/receive/sk/process/index.tsx",
  ),
  route(
    "dashboard/orders/partial-order-request/list",
    "routes/dashboard/orders/partial-order-request/list/index.tsx",
  ),
  route(
    "dashboard/orders/partial-order-request/create",
    "routes/dashboard/orders/partial-order-request/create/index.tsx",
  ),
  route(
    "dashboard/orders/partial-order-request/view",
    "routes/dashboard/orders/partial-order-request/view/index.tsx",
  ),
];
