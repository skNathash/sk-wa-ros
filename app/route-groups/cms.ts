import { index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/cms/layout/layout.tsx", [
    // index("routes/dashboard/cms/deal/index.tsx"),
    route("cms/deal", "routes/cms/deal/index.tsx"),
  ]),

  route("cms/brands/view/:id", "routes/cms/brands/view/index.tsx"),
  route("cms/categories/view/:id", "routes/cms/categories/view/index.tsx"),
  route("cms/categories/list", "routes/cms/categories/view/list/index.tsx"),
  route("cms/brands/list", "routes/cms/brands/list/index.tsx"),
];
