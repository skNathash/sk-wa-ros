import { route } from "@react-router/dev/routes";

export default [
  route("dashboard", "routes/dashboard/index.tsx"),
  route("dashboard/main", "routes/dashboard/main/index.tsx"),
  route("dashboard/journey", "routes/dashboard/journey/index.tsx"),
  route("dashboard/modules", "routes/dashboard/modules/index.tsx"),
  route("dashboard/insight", "routes/dashboard/insight/index.tsx"),
  route("dashboard/reorder/list", "routes/dashboard/reorder/list/index.tsx"),
];
