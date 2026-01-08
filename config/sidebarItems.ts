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
  Star,
  Percent,
  TicketPercent,
  PackageX,
  Megaphone,
  Layout
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
  Percent,
  TicketPercent,
  PackageX,
  Megaphone,
  Layout,
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
  { name: "Sản phẩm", href: Routes.products.root, icon: "Package" },
  {
    name: "Thuộc tính",
    href: Routes.attributes.root,
    icon: "ShoppingBag",
    subItems: [
      {
        name: "Thương hiệu",
        href: Routes.attributes.brands.root,
        icon: "BadgeCheck",
      },
      {
        name: "Gọng kính",
        href: Routes.attributes.frames.root,
        icon: "Glasses",
      },
      {
        name: "Màu sắc",
        href: Routes.attributes.colors.root,
        icon: "Palette",
      },
      {
        name: "Nhãn",
        href: Routes.attributes.tags.root,
        icon: "Tag",
      },
    ],
  },
  { name: "Kho hàng", href: Routes.stocks.root, icon: "Warehouse" },
  { 
    name: "Đơn hàng", 
    href: "", // No direct page, only dropdown
    icon: "ShoppingCart",
    subItems: [
      {
        name: "Tất cả đơn hàng",
        href: Routes.orders.all,
        icon: "ShoppingCart",
      },
      {
        name: "Chờ xác nhận",
        href: Routes.orders.pending,
        icon: "Package",
      },
      {
        name: "Chờ đóng gói",
        href: Routes.orders.packing,
        icon: "Warehouse",
      },
      {
        name: "Trả hàng",
        href: Routes.orders.returns,
        icon: "PackageX",
      },
    ],
  },
  { name: "Người dùng", href: Routes.users.root, icon: "Users" },
  { 
    name: "Khuyến mãi", 
    href: Routes.sales.root, 
    icon: "DollarSign",
    subItems: [
      {
        name: "Chương trình giảm giá",
        href: Routes.sales.discounts.root,
        icon: "Percent",
      },
      {
        name: "Mã giảm giá",
        href: Routes.sales.vouchers.root,
        icon: "TicketPercent",
      },
    ],
  },
  {
    name: "Giao diện",
    href: Routes.interface.root,
    icon: "Layout",
    subItems: [
      {
        name: "Danh mục",
        href: Routes.interface.categories.root,
        icon: "FolderTree",
      },
      {
        name: "Banners",
        href: Routes.interface.banners.root,
        icon: "Megaphone",
      },
      {
        name: "Hình ảnh",
        href: Routes.interface.images.root,
        icon: "Image",
      },
    ],
  },
  { name: "Đánh giá", href: Routes.reviews.root, icon: "Star" },
  // { name: "Cài đặt", href: Routes.settings, icon: "Settings" },
  // { name: "Tin nhắn", href: Routes.messages, icon: "Mail" },
  // { name: "Thông báo", href: Routes.notifications, icon: "Bell" },
  // { name: "Trợ giúp", href: Routes.help, icon: "Info" },
];
