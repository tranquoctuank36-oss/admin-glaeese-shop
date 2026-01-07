// components/Sidebar.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { ICONS, sidebarItems } from "@/config/sidebarItems";

export default function Sidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

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
            // Fix: Chỉ dùng startsWith cho non-root paths, tránh "/" match tất cả
            const isParentActive = isActive || hasActiveChild || 
              (item.href !== "/" && pathname.startsWith(item.href));
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
                          <div className="flex-shrink-0 ml-2">
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
                      const subActive = pathname === sub.href;
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
