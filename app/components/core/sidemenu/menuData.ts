interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  children?: MenuItem[];
}

export const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'bi-speedometer2',
    children: [
      {
        id: 'sales-overview',
        label: 'Sales Overview',
        icon: 'bi-graph-up',
        path: '/dashboard/sales-overview'
      },
      {
        id: 'inventory-analysis',
        label: 'Inventory Analysis',
        icon: 'bi-box-seam',
        path: '/dashboard/inventory/analysis'
      },
      {
        id: 'shipments',
        label: 'Shipments',
        icon: 'bi-truck',
        path: '/dashboard/shipments'
      }
    ]
  },
  {
    id: 'products',
    label: 'Products',
    icon: 'bi-box',
    path: '/products'
  },
  
];
