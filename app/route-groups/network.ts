import { route, layout } from "@react-router/dev/routes";

const b2cViewRoutes = [
  route(
    "dashboard/network/view/b2c/:id",
    "routes/dashboard/network/view/b2c/overview/index.tsx",
  ),
  route(
    "dashboard/network/view/b2c/:id/kyc",
    "routes/dashboard/network/view/b2c/kyc/index.tsx",
  ),
  route(
    "dashboard/network/view/b2c/:id/paylater",
    "routes/dashboard/network/view/b2c/paylater/index.tsx",
  ),
  route(
    "dashboard/network/view/b2c/:id/loyalty-program",
    "routes/dashboard/network/view/b2c/loyalty-program/index.tsx",
  ),
  route(
    "dashboard/network/view/b2c/:id/purchase-history",
    "routes/dashboard/network/view/b2c/purchase-history/index.tsx",
  ),
  route(
    "dashboard/network/view/b2c/:id/payments",
    "routes/dashboard/network/view/b2c/payments/index.tsx",
  ),
  route(
    "dashboard/network/view/b2c/:id/statement",
    "routes/dashboard/network/view/b2c/statement/index.tsx",
  ),
  route(
    "dashboard/network/view/b2c/:id/notification-logs",
    "routes/dashboard/network/view/b2c/notification-logs/index.tsx",
  ),
];

const b2bViewRoutes = [
  route(
    "dashboard/network/view/b2b/:id",
    "routes/dashboard/network/view/b2b/orders/index.tsx",
  ),
  route(
    "dashboard/network/view/b2b/:id/payments",
    "routes/dashboard/network/view/b2b/payments/index.tsx",
  ),
  route(
    "dashboard/network/view/b2b/:id/statement",
    "routes/dashboard/network/view/b2b/statement/index.tsx",
  ),
  route(
    "dashboard/network/view/b2b/:id/paylater",
    "routes/dashboard/network/view/b2b/paylater/index.tsx",
  ),
  route(
    "dashboard/network/view/b2b/:id/kyc",
    "routes/dashboard/network/view/b2b/kyc/index.tsx",
  ),
  route(
    "dashboard/network/view/b2b/:id/notification-logs",
    "routes/dashboard/network/view/b2b/notification-logs/index.tsx",
  ),
];

export default [
  layout("routes/dashboard/network/management/layout/layout.tsx", [
    route(
      "dashboard/network/management/overview",
      "routes/dashboard/network/management/overview/index.tsx",
    ),
    route(
      "dashboard/network/management/b2c-customers",
      "routes/dashboard/network/management/b2c/list/index.tsx",
    ),
    route(
      "dashboard/network/management/b2b-retailers",
      "routes/dashboard/network/management/b2b/list/index.tsx",
    ),
    route(
      "dashboard/network/management/sk-sellers",
      "routes/dashboard/network/management/sk-sellers/list/index.tsx",
    ),
    route(
      "dashboard/network/management/joining-request",
      "routes/dashboard/network/management/joining-request/list/index.tsx",
    ),
  ]),
  route(
    "dashboard/network/management/b2c-customers/manage",
    "routes/dashboard/network/management/b2c/manage/index.tsx",
  ),
  route(
    "dashboard/network/management/b2b-retailers/manage",
    "routes/dashboard/network/management/b2b/manage/index.tsx",
  ),
  layout("routes/dashboard/network/view/b2c/layout.tsx", b2cViewRoutes),
  layout("routes/dashboard/network/view/b2b/layout.tsx", b2bViewRoutes),
  route(
    "dashboard/network/view/sk-seller/:id",
    "routes/dashboard/network/view/sk-seller/index.tsx",
  ),
  route(
    "dashboard/network/view/view-join-request/:id",
    "routes/dashboard/network/view/view-join-request/index.tsx",
  ),
];
