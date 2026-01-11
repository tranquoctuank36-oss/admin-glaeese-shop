export const Routes = {
  root: "/",

  reviews: {
    root: "/reviews",
    details: (id: string) => `/reviews/details/${id}`,
  },

  products: {
    root: "/products",
    add: "/products/add",
    edit: (id: string) => `/products/edit/${id}`,
    details: (id: string) => `/products/details/${id}`,
    trash: "/products/trash",
  },

  attributes: {
    root: "/attributes",
    brands: {
      root: "/attributes/brands",
      details: "/attributes/brands/details/[id]",
      add: "/attributes/brands/add",
      edit: "/attributes/brands/edit/[id]",
      trash: "/attributes/brands/trash",
    },
    frames: {
      root: "/attributes/frames",
      frameShapes: {
        root: "/attributes/frames/frameShapes",
        add: "/attributes/frames/frameShapes/add",
        edit: "/attributes/frames/frameShapes/edit/[id]",
        trash: "/attributes/frames/frameShapes/trash",
      },
      frameTypes: {
        root: "/attributes/frames/frameTypes",
        add: "/attributes/frames/frameTypes/add",
        edit: "/attributes/frames/frameTypes/edit/[id]",
        trash: "/attributes/frames/frameTypes/trash",
      },
      frameMaterials: {
        root: "/attributes/frames/frameMaterials",
        add: "/attributes/frames/frameMaterials/add",
        edit: "/attributes/frames/frameMaterials/edit/[id]",
        trash: "/attributes/frames/frameMaterials/trash",
      },
    },
    stocks: {
      root: "/attributes/stocks",
    },
    colors: {
      root: "/attributes/colors",
      add: "/attributes/colors/add",
      edit: "/attributes/colors/edit/[id]",
      trash: "/attributes/colors/trash",
    },
    tags: {
      root: "/attributes/tags",
      add: "/attributes/tags/add",
      edit: "/attributes/tags/edit/[id]",
      trash: "/attributes/tags/trash",
    },
  },

  stocks: {
    root: "/inventory",
    movements: "/inventory/movements",
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

  interface: {
    root: "/interface",
    categories: {
      root: "/interface/categories",
      add: "/interface/categories/add",
      review: "/interface/categories/review",
      viewDetails: "/interface/categories/details/[id]",
      edit: "/interface/categories/edit/[id] ",
    },
    banners: {
      root: "/interface/banners",
      add: "/interface/banners/add",
      edit: "/interface/banners/edit/[id]",
    },
    images: {
      root: "/interface/images",
      add: "/interface/images/add",
    },
  },
  
  orders: {
    root: "", // No standalone orders page
    all: "/orders/all",
    pending: "/orders/pending",
    packing: "/orders/packing",
    returns: "/orders/returns",
    returnDetails: (id: string) => `/orders/returns/details/${id}`,
    refunds: "/orders/refunds",
    details: (id: string) => `/order-details/${id}`,
  },
  settings: "/settings",
  messages: "/messages",
  notifications: "/notifications",
  help: "/help",
} as const;

export type RouteValue =
  | (typeof Routes)[keyof typeof Routes]
  | (typeof Routes)["attributes"][keyof (typeof Routes)["attributes"]];
