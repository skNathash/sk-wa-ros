import { route } from "@react-router/dev/routes";

export default [
  route(
    "dashboard/fulfillment/list",
    "routes/dashboard/fulfillment/list/index.tsx"
  ),
  route(
    "dashboard/fulfillment/vendor-return",
    "routes/dashboard/fulfillment/vendor-return/index.tsx"
  ),
  route(
    "dashboard/fulfillment/status",
    "routes/dashboard/fulfillment/status/index.tsx"
  ),
];
