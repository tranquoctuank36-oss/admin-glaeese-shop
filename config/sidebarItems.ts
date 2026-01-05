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
  Warehouse,
  Star
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
  Star,
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
  { name: "Tổng quan", href: Routes.root, icon: "House" },
  {
    name: "Quản lý sản phẩm",
    href: Routes.productsManagement.root,
    icon: "ShoppingBag",
    subItems: [
      {
        name: "Sản phẩm",
        href: Routes.productsManagement.products.root,
        icon: "Package",
      },
      {
        name: "Danh mục",
        href: Routes.productsManagement.categories.root,
        icon: "FolderTree",
      },
      {
        name: "Thương hiệu",
        href: Routes.productsManagement.brands.root,
        icon: "BadgeCheck",
      },
      {
        name: "Gọng kính",
        href: Routes.productsManagement.frames.root,
        icon: "Glasses",
      },
      {
        name: "Màu sắc",
        href: Routes.productsManagement.colors.root,
        icon: "Palette",
      },
      {
        name: "Nhãn",
        href: Routes.productsManagement.tags.root,
        icon: "Tag",
      },
      {
        name: "Hình ảnh",
        href: Routes.productsManagement.images.root,
        icon: "Image",
      },
    ],
  },
  { name: "Kho hàng", href: Routes.stocks.root, icon: "Warehouse" },
  { name: "Người dùng", href: Routes.users.root, icon: "Users" },
  { name: "Sales", href: Routes.sales.root, icon: "DollarSign" },
  { 
    name: "Đơn hàng", 
    href: Routes.orders.root, 
    icon: "ShoppingCart",
  },
  { name: "Đánh giá", href: Routes.reviews.root, icon: "Star" },
  { name: "Cài đặt", href: Routes.settings, icon: "Settings" },
  { name: "Tin nhắn", href: Routes.messages, icon: "Mail" },
  { name: "Thông báo", href: Routes.notifications, icon: "Bell" },
  { name: "Trợ giúp", href: Routes.help, icon: "Info" },
];
