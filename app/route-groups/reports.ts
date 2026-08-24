import { layout, route } from "@react-router/dev/routes";

export default [
  route("dashboard/reports", "routes/dashboard/reports/index.tsx"),
  layout("routes/dashboard/reports/gst-dashboard/list/layout/layout.tsx", [
    route(
      "dashboard/reports/gst-dashboard/products-level",
      "routes/dashboard/reports/gst-dashboard/list/products-level/index.tsx"
    ),
    route(
      "dashboard/reports/gst-dashboard/hsn-summary",
      "routes/dashboard/reports/gst-dashboard/list/hsn-summary/index.tsx"
    ),
    route(
      "dashboard/reports/gst-dashboard/rate-summary",
      "routes/dashboard/reports/gst-dashboard/list/rate-summary/index.tsx"
    ),
    route(
      "dashboard/reports/gst-dashboard/party-wise",
      "routes/dashboard/reports/gst-dashboard/list/party-wise/index.tsx"
    ),
    route(
      "dashboard/reports/gst-dashboard/reports",
      "routes/dashboard/reports/gst-dashboard/list/reports/index.tsx"
    ),
  ]),
];
