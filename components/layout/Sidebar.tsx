// components/Sidebar.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { syncGHNOrderStatus } from "@/services/orderService";
import toast from "react-hot-toast";
import { ICONS, sidebarItems } from "@/config/sidebarItems";

export default function Sidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const pathname = usePathname();

  const handleSyncGHN = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsSyncing(true);
    try {
      const result = await syncGHNOrderStatus();
      if (result.success) {
        toast.success(result.message || "Đồng bộ thành công!");
      } else {
        toast.error(result.message || "Đồng bộ thất bại!");
      }
    } catch (error: any) {
      console.error("Sync GHN failed:", error);
      toast.error(error?.response?.data?.message || "Lỗi khi đồng bộ đơn hàng!");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    sidebarItems.forEach((item) => {
      if (item.subItems?.some((s) => pathname === s.href)) {
        setOpenSubmenu(item.name);
      }
    });
  }, [pathname]);

  if (!mounted) return null;

  const toggleSubmenu = (itemName: string) => {
    setOpenSubmenu((prev) => (prev === itemName ? null : itemName));
  };

  return (
    <div
      className={`relative z-10 transition-all duration-300 ease-in-out flex-shrink-0 ${
        isSidebarOpen ? "w-72" : "w-20"
      }`}
    >
      <div className="h-full bg-gradient-to-br from-gray-200 via-slate-100 to-blue-200 text-gray-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 flex-shrink-0">
          <button
            onClick={() => setIsSidebarOpen((s) => !s)}
            className="p-2 rounded-full hover:bg-gray-300 transition-colors max-w-fit cursor-pointer"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-4 flex-grow overflow-y-auto scrollbar-gutter-stable px-4 pb-4">
          {sidebarItems.map((item) => {
            const Icon = ICONS[item.icon];
            const isActive = pathname === item.href;
            const hasSub = !!item.subItems?.length;
            const hasActiveChild = !!item.subItems?.some((s) => pathname === s.href);
            
            // Check if any submenu or its detail pages are active
            const hasActiveChildOrDetail = !!item.subItems?.some((s) => {
              if (pathname === s.href) return true;
              // Check for detail pages like /orders/refunds/details/[id] or /orders/returns/details/[id]
              if (s.href && pathname.startsWith(s.href + '/')) return true;
              return false;
            });
            
            // Parent active khi: đang ở trang parent HOẶC có submenu đang active
            const isParentActive = isActive || hasActiveChildOrDetail || 
              (item.href !== "/" && item.href !== "" && pathname.startsWith(item.href));
            const isOpen = openSubmenu === item.name;

            return (
              <div key={item.name}>
                {hasSub ? (
                  item.name === "Đơn hàng" ? (
                    <Link href={item.href}>
                      <div
                        onClick={() => toggleSubmenu(item.name)}
                        className={`flex items-center justify-between p-4 pr-3 text-sm font-medium rounded-lg transition-colors hover:bg-gray-300 mb-2 cursor-pointer${
                          isParentActive ? " bg-gray-300" : ""
                        }`}
                      >
                        <div className="flex items-center min-w-0 flex-1">
                          <Icon size={20} className="flex-shrink-0" />
                          {isSidebarOpen && (
                            <span className="ml-4 text-base truncate">{item.name}</span>
                          )}
                        </div>
                        {isSidebarOpen && (
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <button
                              onClick={handleSyncGHN}
                              disabled={isSyncing}
                              className={`p-1.5 rounded-full transition-all ${
                                isSyncing 
                                  ? "bg-blue-200 cursor-not-allowed" 
                                  : "hover:bg-blue-300 bg-blue-200 cursor-pointer"
                              }`}
                              title="Đồng bộ trạng thái đơn hàng GHN"
                            >
                              <RefreshCw 
                                size={14} 
                                className={`text-white ${
                                  isSyncing ? "animate-spin" : ""
                                }`}
                              />
                            </button>
                            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </div>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div
                      onClick={() => toggleSubmenu(item.name)}
                      className={`flex items-center justify-between p-4 pr-3 text-sm font-medium rounded-lg transition-colors hover:bg-gray-300 mb-2 cursor-pointer${
                        isParentActive ? " bg-gray-300" : ""
                      }`}
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        <Icon size={20} className="flex-shrink-0" />
                        {isSidebarOpen && (
                          <span className="ml-4 text-base truncate">{item.name}</span>
                        )}
                      </div>
                      {isSidebarOpen && (
                        <div className="flex-shrink-0 ml-2">
                          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <Link href={item.href}>
                    <div
                      className={`flex items-center p-4 text-sm font-medium rounded-lg transition-colors hover:bg-gray-300 mb-2${
                        isParentActive ? " bg-gray-300" : ""
                      }`}
                    >
                      <Icon size={20} style={{ minWidth: 20 }} />
                      {isSidebarOpen && (
                        <span className="ml-4 whitespace-nowrapp text-base">{item.name}</span>
                      )}
                    </div>
                  </Link>
                )}

                {hasSub && isOpen && isSidebarOpen && (
                  <div className="mb-2 space-y-1">
                    {item.subItems!.map((sub) => {
                      // Check if current submenu is active or any of its child routes
                      const subActive = pathname === sub.href || 
                        (sub.href && pathname.startsWith(sub.href + '/'));
                      const SubIcon = sub.icon ? ICONS[sub.icon] : null;
                      return (
                        <Link key={sub.name} href={sub.href}>
                          <div
                            className={`flex items-center p-3 pl-8 text-sm rounded-lg transition-colors hover:bg-gray-200 ${
                              subActive
                                ? "hover:bg-white bg-white text-blue-600 font-semibold"
                                : " text-gray-700"
                            }`}
                          >
                            {SubIcon && <SubIcon size={16}/>}
                            <span className="text-sm ml-5">{sub.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
