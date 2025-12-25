import {
  Bell,
  DollarSign,
  House,
  Info,
  Mail,
  Settings,
  ShoppingCart,
  Users,
  ShoppingBag,
  Shapes,
  Type,
  Package,
  FolderTree,
  Palette,
  Tag,
  Layers,
  BadgeCheck,
  Gem,
  Component,
  Square,
  Glasses,
  Image,
  Warehouse
} from "lucide-react";
import { Routes } from "@/lib/routes";

export const ICONS = {
  House,
  DollarSign,
  Settings,
  ShoppingCart,
  Mail,
  Users,
  Bell,
  Info,
  ShoppingBag,
  Shapes,
  Type,
  Package,
  FolderTree,
  Palette,
  Tag,
  Layers,
  BadgeCheck,
  Gem,
  Component,
  Square,
  Glasses,
  Image,
  Warehouse,
};

export type SubMenuItem = {
  name: string;
  href: string;
  icon?: keyof typeof ICONS;
  subItems?: SubMenuItem[];
  activeBg?: boolean;
};

export type SidebarItem = {
  name: string;
  href: string;
  icon: keyof typeof ICONS;
  subItems?: SubMenuItem[];
};

export const sidebarItems: SidebarItem[] = [
  { name: "Dashboard", href: Routes.root, icon: "House" },
  {
    name: "Products Management",
    href: Routes.productsManagement.root,
    icon: "ShoppingBag",
    subItems: [
      {
        name: "Products",
        href: Routes.productsManagement.products.root,
        icon: "Package",
      },
      {
        name: "Categories",
        href: Routes.productsManagement.categories.root,
        icon: "FolderTree",
      },
      {
        name: "Brands",
        href: Routes.productsManagement.brands.root,
        icon: "BadgeCheck",
      },
      {
        name: "Glasses Frames",
        href: Routes.productsManagement.frames.root,
        icon: "Glasses",
      },
      {
        name: "Colors",
        href: Routes.productsManagement.colors.root,
        icon: "Palette",
      },
      {
        name: "Tags",
        href: Routes.productsManagement.tags.root,
        icon: "Tag",
      },
      {
        name: "Images",
        href: Routes.productsManagement.images.root,
        icon: "Image",
      },
    ],
  },
  { name: "Inventory", href: Routes.stocks.root, icon: "Warehouse" },
  { name: "Users", href: Routes.users.root, icon: "Users" },
  { name: "Sales", href: Routes.sales.root, icon: "DollarSign" },
  { name: "Orders", href: Routes.orders, icon: "ShoppingCart" },
  { name: "Settings", href: Routes.settings, icon: "Settings" },
  { name: "Messages", href: Routes.messages, icon: "Mail" },
  { name: "Notifications", href: Routes.notifications, icon: "Bell" },
  { name: "Help", href: Routes.help, icon: "Info" },
];
