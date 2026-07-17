import { route } from "@react-router/dev/routes";

export default [
  route("ticket/list", "routes/ticket/list/index.tsx"),
  route("ticket/view/:id", "routes/ticket/view/index.tsx"),
  route("ticket/manage", "routes/ticket/manage/index.tsx"),
];
