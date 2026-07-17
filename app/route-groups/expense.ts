import { layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/dashboard/expenses/layout/layout.tsx", [
    route(
      "dashboard/expenses/list",
      "routes/dashboard/expenses/expense-records/index.tsx"
    ),
    route(
      "dashboard/expenses/statement-of-accounts",
      "routes/dashboard/expenses/statement-of-accounts/index.tsx"
    ),
    route(
      "dashboard/expenses/analytics",
      "routes/dashboard/expenses/analytics/index.tsx"
    ),
    route(
      "dashboard/expenses/categories",
      "routes/dashboard/expenses/categories/index.tsx"
    ),
  ]),
  route(
    "dashboard/expenses/manage",
    "routes/dashboard/expenses/manage/index.tsx"
  ),
  route(
    "dashboard/expenses/view/:id",
    "routes/dashboard/expenses/view/index.tsx"
  ),
];
