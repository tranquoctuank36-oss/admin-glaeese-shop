export const Routes = {
  root: "/",

  productsManagement: {
    root: "/productsManagement",
    products: {
      root: "/productsManagement/products",
      add: "/productsManagement/products/add",
      edit: (id: string) => `/productsManagement/products/edit/${id}`,
      details: (id: string) => `/productsManagement/products/details/${id}`,
      trash: "/productsManagement/products/trash",
    },
    categories: {
      root: "/productsManagement/categories",
      add: "/productsManagement/categories/add",
      review: "/productsManagement/categories/review",
      viewDetails: "/productsManagement/categories/details/[id]",
      edit: "/productsManagement/categories/edit/[id] ",
    },
    brands: {
      root: "/productsManagement/brands",
      details: "/productsManagement/brands/details/[id]",
      add: "/productsManagement/brands/add",
      edit: "/productsManagement/brands/edit/[id]",
      trash: "/productsManagement/brands/trash",
    },
    frames: {
      root: "/productsManagement/frames",
      frameShapes: {
        root: "/productsManagement/frames/frameShapes",
        add: "/productsManagement/frames/frameShapes/add",
        edit: "/productsManagement/frames/frameShapes/edit/[id]",
        trash: "/productsManagement/frames/frameShapes/trash",
      },
      frameTypes: {
        root: "/productsManagement/frames/frameTypes",
        add: "/productsManagement/frames/frameTypes/add",
        edit: "/productsManagement/frames/frameTypes/edit/[id]",
        trash: "/productsManagement/frames/frameTypes/trash",
      },
      frameMaterials: {
        root: "/productsManagement/frames/frameMaterials",
        add: "/productsManagement/frames/frameMaterials/add",
        edit: "/productsManagement/frames/frameMaterials/edit/[id]",
        trash: "/productsManagement/frames/frameMaterials/trash",
      },
    },
    stocks: {
      root: "/productsManagement/stocks",
    },
    colors: {
      root: "/productsManagement/colors",
      add: "/productsManagement/colors/add",
      edit: "/productsManagement/colors/edit/[id]",
      trash: "/productsManagement/colors/trash",
    },
    tags: {
      root: "/productsManagement/tags",
      add: "/productsManagement/tags/add",
      edit: "/productsManagement/tags/edit/[id]",
      trash: "/productsManagement/tags/trash",
    },
    images: {
      root: "/productsManagement/images",
      add: "/productsManagement/images/add",
    },
  },

  stocks: {
    root: "/inventory",
  },

  users: {
    root: "/users",
    details: "/users/details/[id]",
    edit: "/users/edit/[id]",
    addresses: "/users/[id]/addresses",
    orders: "/users/[id]/orders",
  },
  
  sales: {
    root: "/sales",
    vouchers: {
      root: "/sales/vouchers",
      add: "/sales/vouchers/add",
      edit: (id: string) => `/sales/vouchers/edit/${id}`,
      details: (id: string) => `/sales/vouchers/details/${id}`,
      trash: "/sales/vouchers/trash",
    },
    discounts: {
      root: "/sales/discounts",
      add: "/sales/discounts/add",
      edit: (id: string) => `/sales/discounts/edit/${id}`,
      details: (id: string) => `/sales/discounts/details/${id}`,
      targets: (id: string) => `/sales/discounts/targets/${id}`,
      trash: "/sales/discounts/trash",
    },
  },
  
  orders: "/orders",
  settings: "/settings",
  messages: "/messages",
  notifications: "/notifications",
  help: "/help",
} as const;

export type RouteValue =
  | (typeof Routes)[keyof typeof Routes]
  | (typeof Routes)["productsManagement"][keyof (typeof Routes)["productsManagement"]];
