import { layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/dashboard/delivery/layout/layout.tsx", [
    route(
      "dashboard/delivery/dispatch",
      "routes/dashboard/delivery/dispatch/index.tsx"
    ),
    route(
      "dashboard/delivery/in-transit",
      "routes/dashboard/delivery/in-transit/index.tsx"
    ),
    route(
      "dashboard/delivery/cod-reconciliation",
      "routes/dashboard/delivery/cod-reconciliation/index.tsx"
    ),
    route(
      "dashboard/delivery/analytics",
      "routes/dashboard/delivery/analytics/index.tsx"
    ),
    route(
      "dashboard/delivery/personnel",
      "routes/dashboard/delivery/personnel/index.tsx"
    ),
    route(
      "dashboard/delivery/agencies",
      "routes/dashboard/delivery/agencies/index.tsx"
    ),
  ]),
];
