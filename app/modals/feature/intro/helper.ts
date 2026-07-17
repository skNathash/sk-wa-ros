const createMyCatalog = [
  {
    title: "Choose From Master List",
    description:
      "Pick the products you sell from StoreKing's Master Catalog to build your store inventory.",
    image: "/intro/create-catalog/1.png",
  },
  {
    title: "Open Create My Catalog",
    description:
      "From the APP main menu, tap “Create My Catalog” to start adding items.",
    image: "/intro/create-catalog/2.png",
  },
  {
    title: "Search & Subscribe items",
    description:
      "Use the Search Bar to find products quickly and tap Subscribe to add them to your catalog.",
    image: "/intro/create-catalog/3.png",
  },
  {
    title: "Add new products",
    description:
      "Can't find an item? Tap “Add New Product”, snap a photo, and enter its details — name, brand, and MRP.",
    image: "/intro/create-catalog/4.png",
  },
  {
    title: "Your store inventory is ready",
    description:
      "All subscribed products form your My Catalog — your digital store, ready to sell online!",
    image: "/intro/create-catalog/5.png",
  },
];

export const getIntroSlides = (key: string) => {
  switch (key) {
    case "create-catalog":
      return createMyCatalog;
    default:
      return [];
  }
};
