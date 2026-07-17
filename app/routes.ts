import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

import accountRoutes from "./route-groups/account";
import authRoutes from "./route-groups/auth";
import bulkUploadRoutes from "./route-groups/bulk-upload";
import clubRoutes from "./route-groups/club";
import cms from "./route-groups/cms";
import configsRoutes from "./route-groups/configs";
import deliveryRoutes from "./route-groups/delivery";
import employeeRoutes from "./route-groups/employee";
import fulfillmentRoutes from "./route-groups/fulfillment";
import inventoryRoutes from "./route-groups/inventory";
import manualRoutes from "./route-groups/manual";
import networkRoutes from "./route-groups/network";
import ordersRoutes from "./route-groups/orders";
import paylaterRoutes from "./route-groups/paylater";
import paymentRoutes from "./route-groups/payment";
import pointsRoutes from "./route-groups/points";
import posRoutes from "./route-groups/pos";
import productsRoutes from "./route-groups/products";
import purchaseOrderRoutes from "./route-groups/purchaseOrder";
import reportsRoutes from "./route-groups/reports";
import salesRoutes from "./route-groups/sales";
import ticketRoutes from "./route-groups/ticket";
import userRoutes from "./route-groups/user";
import vendorRoutes from "./route-groups/vendor";
import expense from "./route-groups/expense";
import scanRoutes from "./route-groups/scan";
import masterRoutes from "./route-groups/master";
import osRoutes from "./route-groups/os";

const childRoutes = [
  ...accountRoutes,
  ...bulkUploadRoutes,
  ...vendorRoutes,
  ...clubRoutes,
  ...employeeRoutes,
  ...fulfillmentRoutes,
  ...inventoryRoutes,
  ...manualRoutes,
  ...networkRoutes,
  ...ordersRoutes,
  ...paymentRoutes,
  ...productsRoutes,
  ...purchaseOrderRoutes,
  ...reportsRoutes,
  ...salesRoutes,
  ...configsRoutes,
  ...paylaterRoutes,
  ...deliveryRoutes,
  ...cms,
  ...ticketRoutes,
  ...posRoutes,
  ...pointsRoutes,
  ...userRoutes,
  ...expense,
  ...scanRoutes,
  route("dashboard", "routes/dashboard/index.tsx"),
  route("dashboard/main", "routes/dashboard/main/index.tsx"),
];

const routes: RouteConfig = [
  index("routes/home.tsx"),
  ...osRoutes,
  layout("routes/layout.tsx", [...authRoutes, ...masterRoutes]),
  layout("routes/sidebar-layout/layout.tsx", childRoutes),
];

export default routes;
