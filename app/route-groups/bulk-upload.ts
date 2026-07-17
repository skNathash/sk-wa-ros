import { route, layout } from "@react-router/dev/routes";

const bulkUploadRoutes = [
  route(
    "dashboard/bulk-upload/add-stock",
    "routes/dashboard/bulk-upload/add-stock/index.tsx"
  ),
  route(
    "dashboard/bulk-upload/pricing",
    "routes/dashboard/bulk-upload/pricing/index.tsx"
  ),
  route(
    "dashboard/bulk-upload/barcode",
    "routes/dashboard/bulk-upload/barcode/index.tsx"
  ),
  route(
    "dashboard/bulk-upload/stock-correction",
    "routes/dashboard/bulk-upload/stock-correction/index.tsx"
  ),
];

export default [
  layout("routes/dashboard/bulk-upload/layout.tsx", bulkUploadRoutes),
];
